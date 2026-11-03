"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion, animate } from "framer-motion";
import { Caveat, Permanent_Marker, VT323 } from "next/font/google";
import { RotateCw, Send, X } from "lucide-react";
import { Confetti, makeBits, type Bit } from "./Confetti";
import { BRANCHES, IDEAS, ideasFor, pickNext, type Branch, type Idea, type Level } from "@/lib/ideas";

// Fonts that make it feel like a student's bench, not an app: pen, marker, and the LCD's own pixels
const pen = Caveat({ subsets: ["latin"], weight: ["600", "700"] });
const marker = Permanent_Marker({ subsets: ["latin"], weight: "400" });
const pixels = VT323({ subsets: ["latin"], weight: "400" });

// Scene coordinates (480 x 480). Photos, wires and sockets all live on this one grid.
const WIRE_START = { x: 106.1, y: 46.4 };                   // a hole in the photo's digital header
const SOCKET_X = 322;
const socketY = (i: number) => 52 + i * 46;
const RESET = { x: 28.6, y: 173.3 };                        // centre of the real red button on the photo
const LCD_WIRES = [
  // from: header holes measured on the photo; to: pads on the LCD photo
  { from: [248.5, 114], to: [235.6, 291.1], color: "#E0A100" },
  { from: [244.3, 120.3], to: [222, 291.3], color: "#1F8A4C" },
  { from: [231.2, 150.6], to: [208.4, 291.6], color: "#2563EB" },
  { from: [227.4, 157.7], to: [194.7, 291.8], color: "#20242C" },
];
const GOLDEN_ODDS = 1 / 15;
// The scribble above the Arduino: a new line every spin, in student voice
const NOTES = [
  "it compiled. don't touch it.",
  "works on my laptop. honest.",
  "demo is tomorrow. no pressure.",
  "blame the loose wire",
  "ctrl+z can't save you now",
  "1 AM idea = 9 AM regret",
  "final_final_v2_REAL.ino",
];
const STORAGE_KEY = "src-idea-machine";

// idle → spinning (the LCD decodes) → open (the notebook page lands on screen)
//   → stub (closed page stays taped under the bench; tap to open again)
type Phase = "idle" | "spinning" | "open" | "stub";
type Receipt = { idea: Idea; golden: boolean; branch: Branch; at: Date; spin: number };

// ─── Little sound effects (Web Audio, no files): lever clack, reel stops, printer, win jingle.
function useSfx(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(
    (kind: "pull" | "stop" | "print" | "win" | "gold") => {
      if (!enabled) return;
      try {
        const ctx = (ctxRef.current ??= new AudioContext());
        if (ctx.state === "suspended") void ctx.resume();
        const notes: [number, number, number, OscillatorType][] =
          kind === "pull" ? [[90, 0, 0.09, "square"], [140, 0.06, 0.07, "square"]]
          : kind === "stop" ? [[180, 0, 0.07, "square"]]
          : kind === "print" ? Array.from({ length: 9 }, (_, i) => [110, i * 0.12, 0.05, "square"] as [number, number, number, OscillatorType])
          : kind === "win" ? [[660, 0, 0.12, "triangle"], [990, 0.1, 0.2, "triangle"]]
          : [[660, 0, 0.1, "triangle"], [880, 0.08, 0.1, "triangle"], [1320, 0.16, 0.3, "triangle"]];
        for (const [freq, at, dur, type] of notes) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = ctx.currentTime + at;
          osc.type = type;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(kind === "print" ? 0.05 : 0.12, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          osc.connect(gain).connect(ctx.destination);
          osc.start(t);
          osc.stop(t + dur + 0.02);
        }
      } catch {}
    },
    [enabled]
  );
}

const buzz = (pattern: number | number[]) => {
  try { navigator.vibrate?.(pattern); } catch {}
};

const pad = (id: number) => String(id).padStart(4, "0");

// ─── The 16x2 LCD: real character limits, so text wraps and clips like the actual part.
const COLS = 16;

function wrap16(text: string): [string, string] {
  const lines = ["", ""];
  let row = 0;
  for (const word of text.split(" ")) {
    const next = lines[row] ? `${lines[row]} ${word}` : word;
    if (next.length <= COLS) lines[row] = next;
    else if (row === 0) { row = 1; lines[1] = word.slice(0, COLS); }
    else break;
  }
  return [lines[0], lines[1]];
}

function Lcd({ idle, idea, spinning, onDone }: { idle: [string, string]; idea: Idea; spinning: boolean; onDone: () => void }) {
  const [typed, setTyped] = useState<[string, string]>(idle);
  useEffect(() => {
    if (!spinning) return;
    const [l1, l2] = wrap16(idea.title);
    const total = l1.length + l2.length;
    const start = performance.now();
    const id = setInterval(() => {
      const ms = performance.now() - start;
      if (ms < 1100) {                                       // loading bar on the bottom row
        setTyped([idea.domain.slice(0, COLS), "#".repeat(Math.ceil((ms / 1100) * COLS))]);
        return;
      }
      const n = Math.floor((ms - 1100) / 45);                // then the title types itself out
      if (n >= total + 8) {
        clearInterval(id);
        onDone();
        return;
      }
      setTyped([l1.slice(0, n), l2.slice(0, Math.max(0, n - l1.length))]);
    }, 40);
    return () => clearInterval(id);
  }, [spinning, idea, onDone]);

  const [a, b] = spinning ? typed : idle;
  return (
    <div className={`bench-lcd ${pixels.className}`} aria-hidden>
      <span>{a}</span>
      <span>{b}</span>
    </div>
  );
}

// Hand-drawn pen stroke around the chosen option
const PenCircle = () => (
  <svg aria-hidden viewBox="0 0 120 50" preserveAspectRatio="none" className="absolute -inset-x-1 -inset-y-1 w-[calc(100%+8px)] h-[calc(100%+8px)]" fill="none">
    <path d="M18 12C44 2 92 2 108 14c12 10 2 26-26 31C54 49 18 47 8 34 0 22 14 8 40 6" stroke="#E0A100" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ─── The notebook page ───────────────────────────────────────────

// Gold foil seal for the rare golden idea
const SEAL_POINTS = Array.from({ length: 32 }, (_, i) => {
  const r = i % 2 ? 40 : 48;
  const a = (i * Math.PI) / 16;
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

function FoilSeal() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="absolute -top-5 -right-3 z-10 w-[84px] h-[84px] rotate-12" style={{ filter: "drop-shadow(0 4px 6px rgb(0 0 0 / .3))" }}>
      <defs>
        <linearGradient id={`foil-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF4B8" />
          <stop offset=".35" stopColor="#E3A008" />
          <stop offset=".6" stopColor="#FFE07A" />
          <stop offset="1" stopColor="#B7791F" />
        </linearGradient>
      </defs>
      <polygon points={SEAL_POINTS} fill={`url(#foil-${id})`} />
      <circle cx="50" cy="50" r="32" fill="none" stroke="#7A4F00" strokeOpacity=".45" strokeDasharray="2 3" />
      <text x="50" y="47" textAnchor="middle" fontFamily="var(--font-bricolage), sans-serif" fontSize="15" fontWeight="800" fill="#5C3B00">RARE</text>
      <text x="50" y="63" textAnchor="middle" fontFamily="var(--font-bricolage), sans-serif" fontSize="15" fontWeight="800" fill="#5C3B00">FIND</text>
    </svg>
  );
}

// A battery drawn with a pen: segments filled = difficulty
function Battery({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 74 28" className="w-[74px] h-7" role="img" aria-label={`Difficulty ${n} out of 5`} fill="none">
      <path d="M3 5.5C20 3 45 3.5 63 4.5c2 .1 3 1 3 3V21c0 2-1 3-3 3-18 1.5-42 1-60 .2C1 24 1 22.5 1 21V8c0-1.5.5-2.3 2-2.5Z" stroke="#16233A" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M68.5 10v8" stroke="#16233A" strokeWidth="3.2" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${7 + i * 11.4} 9.5v9`} stroke={i < n ? "#E0A100" : "transparent"} strokeWidth="7" strokeLinecap="round" />
      ))}
    </svg>
  );
}

// Hand-drawn tick box. Tapping draws the tick in pen.
function TickBox({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 28 28" className="w-6 h-6 shrink-0" fill="none" aria-hidden>
      <path d="M4 5.5c6-1.5 13-1.2 20-.4.5 6.5.3 12.5-.4 18.6-6.4 1-12.5.7-19.2.2C3.7 17.5 3.5 11 4 5.5Z" stroke="#16233A" strokeWidth="2" strokeLinejoin="round" />
      <motion.path
        d="M7 14.5l5 5.5L26 3"
        stroke="#16233A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: 0.22 }}
      />
    </svg>
  );
}

// Wavy pen underline
const Squiggle = ({ className = "" }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 120 8" preserveAspectRatio="none" className={`block w-full h-[6px] ${className}`} fill="none">
    <path d="M2 4C14 1 22 7 36 4s22-3 36 0 24 3 46 0" stroke="#16233A" strokeWidth="1.8" strokeLinecap="round" opacity=".75" />
  </svg>
);

// The idea, written up like a lab notebook page, taped to the desk
function NotebookOverlay({ receipt, storeOpen, reduced, bits, burst, ticked, onTick, onSpin, onClosed }: {
  receipt: Receipt; storeOpen: boolean; reduced: boolean; bits: Bit[]; burst: number; ticked: string[]; onTick: (part: string) => void; onSpin: () => void; onClosed: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  // Scale the page down on short screens so page + buttons never need scrolling
  const [fit, setFit] = useState<{ s: number; h: number } | null>(null);
  const { idea, golden, branch } = receipt;
  const buildHref = `/submit?category=${idea.category}&title=${encodeURIComponent(idea.title)}`;
  const shareText = `Got this project idea from SRC e-solutions 👀\n\n${idea.title}: ${idea.pitch}\n\nSpin your own:`;
  const tilt = (idea.id % 5) * 0.6 - 1.2; // each idea lands at its own slight angle

  useLayoutEffect(() => {
    const measure = () => {
      const natural = fitRef.current?.offsetHeight;
      const buttons = btnRef.current?.offsetHeight ?? 0;
      if (!natural) return;
      const col = btnRef.current?.parentElement; // computed padding resolves env(safe-area-inset-bottom) to px
      const padTop = col ? parseFloat(getComputedStyle(col).paddingTop) : 56;
      const padBottom = col ? parseFloat(getComputedStyle(col).paddingBottom) : 16;
      const avail = window.innerHeight - padTop - padBottom - 16 /* gap */ - buttons;
      setFit({ s: Math.min(1, Math.max(0.55, avail / natural)), h: natural });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The page drops onto the desk and settles
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (reduced) { animate(el, { opacity: [0, 1] }, { duration: 0 }); return; }
    animate(el, { y: [-70, 0], opacity: [0, 1] }, { type: "spring", stiffness: 260, damping: 20 });
    animate(el, { rotate: [tilt - 7, tilt + 2, tilt] }, { duration: 0.6, ease: "easeOut" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on open
  }, []);

  const close = useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    const el = cardRef.current;
    if (el && !reduced) await animate(el, { y: 90, opacity: 0, rotate: tilt + 4 }, { duration: 0.28, ease: [0.4, 0, 0.6, 1] });
    onClosed();
  }, [onClosed, reduced, tilt]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  const share = async (e: React.MouseEvent) => {
    if (navigator.share) {
      e.preventDefault();
      try { await navigator.share({ text: shareText, url: `${window.location.origin}/#ideas` }); } catch {}
    }
  };
  const day = receipt.at.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <motion.div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label={`Your project idea: ${idea.title}`}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <motion.div className="absolute inset-0 bg-[#0E1626]/85 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={close} />
      <div className="absolute inset-0 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="min-h-full flex flex-col items-center justify-center gap-4 px-5 pt-14 pb-[max(16px,env(safe-area-inset-bottom))]" onClick={(e) => e.target === e.currentTarget && close()}>
          <div ref={cardRef} className="relative w-full max-w-[380px]" style={fit ? { height: fit.h * fit.s } : undefined}>
            {burst > 0 && golden && <Confetti bits={bits} burst={burst} />}
            <div ref={fitRef} className="relative" style={fit ? { transform: `scale(${fit.s})`, transformOrigin: "top center" } : undefined}>
              <div aria-hidden className="absolute inset-x-3 top-6 -bottom-3 rounded-lg bg-black/55 blur-2xl" />
              {golden && <FoilSeal />}

              <div className={`nb-page ${pen.className} ${golden ? "nb-gold" : ""}`}>
                <span aria-hidden className="nb-tape" />
                {[22, 50, 78].map((t) => <span key={t} aria-hidden className="nb-hole" style={{ top: `${t}%` }} />)}

                <div className="nb-content">
                  {/* Header, like the top of a lab sheet */}
                  <div className="flex items-baseline justify-between text-[19px] font-bold leading-none">
                    <span>Expt. No. {pad(idea.id)}</span>
                    <span className="opacity-70">{day}</span>
                  </div>
                  <Squiggle className="mt-1" />

                  <p className="mt-2 text-[21px] font-semibold leading-snug">
                    Branch: <b className="font-bold">{branch}</b> &nbsp;·&nbsp; {idea.level === "mini" ? "Mini project" : "Major project"}
                  </p>
                  <p className="text-[21px] font-semibold leading-snug">
                    Domain: <b className="font-bold">{idea.domain}</b>
                  </p>
                  <p className="text-[21px] font-semibold leading-snug">
                    Built with: <b className="font-bold">{idea.tech}</b>
                  </p>

                  {/* Title in marker, highlighted */}
                  <h3 className={`mt-4 text-[27px] leading-[1.15] text-[var(--ink)] ${marker.className}`}>
                    <span className="hl">{idea.title}</span>
                  </h3>
                  <p className="mt-2 text-[22px] font-semibold leading-[1.2] opacity-85">{idea.pitch}</p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[21px] font-bold">Difficulty <Battery n={idea.difficulty} /></span>
                    <span className="text-[21px] font-bold">≈ {idea.weeks} weeks</span>
                  </div>

                  {idea.parts && (
                    <div className="mt-3">
                      <p className="text-[21px] font-bold leading-none">Parts needed:</p>
                      <ul className="mt-1.5 space-y-0.5">
                        {idea.parts.map((p) => (
                          <li key={p} className="flex items-center gap-2.5">
                            <button type="button" onClick={() => onTick(p)} aria-pressed={ticked.includes(p)} aria-label={`Tick off ${p}`} className="press -m-1 p-1">
                              <TickBox on={ticked.includes(p)} />
                            </button>
                            {storeOpen ? (
                              <Link href={`/store?q=${encodeURIComponent(p)}`} className={`text-[22px] font-semibold leading-tight underline decoration-[var(--hi)] decoration-[3px] underline-offset-4 hover:decoration-[var(--ink)] ${ticked.includes(p) ? "opacity-50" : ""}`}>
                                {p}
                              </Link>
                            ) : (
                              <span className={`text-[22px] font-semibold leading-tight ${ticked.includes(p) ? "opacity-50" : ""}`}>{p}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* The main action is a sticky note stuck on the page */}
                  <Link href={buildHref} className={`nb-sticky ${marker.className}`}>
                    <span>Build this</span>
                    <span>for me</span>
                  </Link>
                </div>
                <span aria-hidden className="nb-corner" />
              </div>
            </div>
          </div>

          <motion.div
            ref={btnRef}
            className="w-full max-w-[380px] grid grid-cols-2 gap-3 px-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.3 }}
          >
            {/* Two strips of masking tape, written on with the marker. The wrapper carries the shadow and tilt (a shadow on the clipped tape itself would be cut off). */}
            <span className="nb-tape-wrap" style={{ rotate: "-1.6deg" }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${typeof window === "undefined" ? "" : window.location.origin}/#ideas`)}`}
                onClick={share}
                target="_blank"
                rel="noopener noreferrer"
                className={`nb-tape-btn ${marker.className}`}
              >
                <Send size={16} strokeWidth={2.4} aria-hidden /> Send to my group
              </a>
            </span>
            <span className="nb-tape-wrap" style={{ rotate: "1.4deg" }}>
              <button type="button" onClick={onSpin} className={`nb-tape-btn ${marker.className}`}>
                <RotateCw size={16} strokeWidth={2.6} aria-hidden /> Spin again
              </button>
            </span>
          </motion.div>
        </div>
      </div>
      <button
        type="button"
        onClick={close}
        autoFocus
        aria-label="Close idea"
        className="press absolute top-3 right-3 grid place-items-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20"
        style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
      >
        <X size={22} />
      </button>
    </motion.div>
  );
}

export default function IdeaMachine({ storeOpen = true }: { storeOpen?: boolean }) {
  const reduced = !!useReducedMotion();
  const [branch, setBranch] = useState<Branch>("CSE");
  const [level, setLevel] = useState<Level>("mini");
  const pool = ideasFor(branch, level);
  const [current, setCurrent] = useState<Idea>(() => IDEAS.find((i) => i.id === 1)!);
  const [phase, setPhase] = useState<Phase>("idle");
  const [spinTo, setSpinTo] = useState<Idea | null>(null); // the idea the displays are decoding
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [spins, setSpins] = useState(0);
  const [burst, setBurst] = useState(0);
  const [bits, setBits] = useState<Bit[]>([]);
  const [ticks, setTicks] = useState<Record<number, string[]>>({}); // parts ticked off, per idea; survives closing the page

  const sfx = useSfx(true);
  const pending = useRef<{ idea: Idea; golden: boolean; reelsLeft: number } | null>(null);
  const busy = phase === "spinning";

  // Switching branch or level shows a fitting idea right away (no spin)
  const choose = useCallback((b: Branch, l: Level) => {
    const next = ideasFor(b, l);
    setBranch(b);
    setLevel(l);
    setCurrent((c) => (next.some((i) => i.id === c.id) ? c : next[0]));
    setReceipt(null);
    setPhase("idle");
  }, []);

  // Restore branch / level / seen ideas from this phone.
  // Runs after hydration on purpose: reading localStorage during render would
  // make the server and client HTML differ.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const b = BRANCHES.includes(saved.branch) ? saved.branch : "CSE";
      const l = saved.level === "major" ? "major" : "mini";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage
      if (b !== "CSE" || l !== "mini") choose(b, l);
      if (Array.isArray(saved.history)) setHistory(saved.history.filter((id: unknown) => IDEAS.some((i) => i.id === id)));
    } catch {}
  }, [choose]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ branch, level, history })); } catch {}
  }, [branch, level, history]);

  const openReceipt = useCallback(
    (celebrate: boolean, golden: boolean) => {
      setPhase("open");
      if (!celebrate) return;
      sfx(golden ? "gold" : "win");
      buzz(golden ? [40, 60, 40] : 25);
      if (golden && !reduced) {
        setBits(makeBits());
        setBurst((b) => b + 1);
      }
    },
    [reduced, sfx]
  );

  const finish = useCallback(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    setCurrent(p.idea);
    setReceipt({ idea: p.idea, golden: p.golden, branch, at: new Date(), spin: spins + 1 });
    setHistory((h) => [p.idea.id, ...h.filter((id) => id !== p.idea.id)].slice(0, 12));
    setSpins((n) => n + 1);
    openReceipt(true, p.golden);
  }, [branch, spins, openReceipt]);

  const onReelStop = useCallback(() => {
    sfx("stop");
    buzz(12);
    if (pending.current && --pending.current.reelsLeft === 0) finish();
  }, [finish, sfx]);

  const spin = useCallback(() => {
    if (busy) return;
    const next = pickNext(pool, current, history.slice(0, 6));
    if (!next) return;
    sfx("pull");
    pending.current = { idea: next, golden: Math.random() < GOLDEN_ODDS, reelsLeft: 1 };
    setReceipt(null);

    if (reduced) {
      finish();
      return;
    }
    setSpinTo(next);
    setPhase("spinning");
  }, [busy, current, pool, history, reduced, finish, sfx]);

  const spinning = phase === "spinning" && !!spinTo;
  const lcdIdle: [string, string] = phase === "idle"
    ? [`${branch.toUpperCase()}: ${level === "mini" ? "MINI" : "MAJOR"} IDEA`, "PRESS RED BUTTON"]
    : wrap16(current.title);

  // ─── The jumper wire: drag its end into a socket, or tap a socket
  const scene = useRef<SVGSVGElement>(null);
  const [plug, setPlug] = useState<{ x: number; y: number } | null>(null); // only set while moving
  const [touchedWire, setTouchedWire] = useState(false);
  const socket = { x: SOCKET_X, y: socketY(BRANCHES.indexOf(branch)) };
  const end = plug ?? socket;

  const plugInto = (b: Branch, from?: { x: number; y: number }) => {
    const to = { x: SOCKET_X, y: socketY(BRANCHES.indexOf(b)) };
    setTouchedWire(true);
    sfx("stop");
    buzz(12);
    choose(b, level);
    if (reduced || !from) { setPlug(null); return; }
    animate(0, 1, {
      type: "spring", stiffness: 420, damping: 24,
      onUpdate: (t) => setPlug({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }),
      onComplete: () => setPlug(null),
    });
  };
  const toScene = (e: React.PointerEvent) => {
    const r = scene.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 480, y: ((e.clientY - r.top) / r.height) * 480 };
  };
  const dragging = useRef(false);
  const onPlugDown = (e: React.PointerEvent) => {
    if (busy) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPlug(toScene(e));
  };
  const onPlugMove = (e: React.PointerEvent) => {
    if (dragging.current) setPlug(toScene(e));
  };
  const onPlugUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const at = toScene(e);
    const nearest = BRANCHES.reduce((best, b, i) => (Math.abs(socketY(i) - at.y) < Math.abs(socketY(BRANCHES.indexOf(best)) - at.y) ? b : best), branch);
    plugInto(nearest, at);
  };
  const wirePath = `M${WIRE_START.x} ${WIRE_START.y}C${WIRE_START.x + 50} ${WIRE_START.y - 60} ${end.x - 110} ${end.y} ${end.x - 44} ${end.y}H${end.x}`; // ends with a level stretch, so it enters the plug dead centre
  const goldNow = !!receipt?.golden && (phase === "open" || phase === "stub");

  return (
    <div className="w-full max-w-[480px]">
      <div>
      <div className="relative">
      {/* A student's bench on the graph paper: real parts, real wires, pen notes. No box around it. */}
      <div className={`bench ${pen.className}`} data-on={busy ? "spin" : goldNow ? "gold" : "idle"}>
        <img src="/categories/microcontrollers.webp" alt="Arduino board" className="bench-arduino" draggable={false} />
        <span aria-hidden className="bench-led" />

        <div className="bench-lcd-wrap">
          <img src="/categories/displays.webp" alt="" className="w-full block" draggable={false} />
          {spinTo || current ? <Lcd idle={lcdIdle} idea={spinTo ?? current} spinning={spinning} onDone={onReelStop} /> : null}
        </div>

        {/* Breadboard strip with one socket per branch, labelled on masking tape */}
        <div aria-hidden className="bench-strip" />
        {BRANCHES.map((b, i) => (
          <button
            key={b}
            type="button"
            disabled={busy}
            aria-pressed={branch === b}
            aria-label={`Branch ${b}`}
            onClick={() => branch !== b && plugInto(b, socket)}
            className="bench-socket disabled:cursor-wait"
            style={{ top: `${(socketY(i) / 480) * 100}%` }}
          >
            <span aria-hidden className="bench-hole" />
            <span className={`bench-tape ${marker.className}`} style={{ rotate: `${[-2, 1.5, -1, 2, -1.5][i]}deg` }}>{b}</span>
          </button>
        ))}

        <svg ref={scene} viewBox="0 0 480 480" className="bench-wires" fill="none">
          {LCD_WIRES.map((w) => {
            const d = `M${w.from[0]} ${w.from[1]}C${w.from[0] + 34} ${w.from[1] + 34} ${w.to[0] + 30} ${w.to[1] - 66} ${w.to[0]} ${w.to[1]}`;
            return (
              <g key={w.color}>
                <path d={d} className="wire-shadow" />
                <path d={d} stroke={w.color} strokeWidth="4" strokeLinecap="round" />
                <path d={d} className="wire-shine" />
                <circle cx={w.from[0]} cy={w.from[1]} r="3.4" fill="#15171C" />
                <circle cx={w.to[0]} cy={w.to[1]} r="2.6" fill="#15171C" />
              </g>
            );
          })}
          <path d={wirePath} className="wire-shadow" />
          <path d={wirePath} stroke="#D6322C" strokeWidth="5" strokeLinecap="round" />
          <path d={wirePath} className="wire-shine" />
          <circle cx={WIRE_START.x} cy={WIRE_START.y} r="3.8" fill="#15171C" />
          {/* Dupont plug on the free end: the wire arrives level, pin tip on the hole centre. */}
          <g transform={`translate(${end.x} ${end.y})`}>
            <g>
              <rect x="-35" y="-4" width="30" height="14" rx="3" fill="rgb(22 35 58 / .5)" filter="url(#plug-blur)" />
              {/* metal pin */}
              <rect x="-9" y="-1.7" width="10.5" height="3.4" rx="1" fill="url(#plug-metal)" />
              <path d="M-9 -0.6h10" stroke="#fff" strokeOpacity=".7" strokeWidth=".6" />
              {/* black plastic housing: rounded, glossy top edge, ribs, shaded underside */}
              <rect x="-37" y="-6.6" width="29" height="13.2" rx="2.4" fill="url(#plug-body)" />
              <rect x="-35.6" y="-5.6" width="25" height="2" rx="1" fill="#fff" fillOpacity=".22" />
              <rect x="-37" y="3.2" width="29" height="3.4" rx="1.6" fill="#000" fillOpacity=".35" />
              {[-33, -30.4, -27.8].map((x) => <path key={x} d={`M${x} -5v10.4`} stroke="#000" strokeOpacity=".55" strokeWidth="1" />)}
              <path d="M-8.6 -5.4v10.8" stroke="#fff" strokeOpacity=".12" strokeWidth=".8" />
              {/* crimp collar where the wire enters */}
              <rect x="-42" y="-4.4" width="5.6" height="8.8" rx="1.4" fill="#0B0D11" />
              <rect x="-41.4" y="-3.8" width="1.4" height="7.6" rx=".7" fill="#fff" fillOpacity=".14" />
            </g>
            <circle
              r="26"
              fill="transparent"
              className={`bench-grab ${busy ? "" : "cursor-grab active:cursor-grabbing"}`}
              onPointerDown={onPlugDown}
              onPointerMove={onPlugMove}
              onPointerUp={onPlugUp}
            />
          </g>
          <defs>
            <linearGradient id="plug-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4B515E" />
              <stop offset=".32" stopColor="#1C2027" />
              <stop offset="1" stopColor="#0A0C10" />
            </linearGradient>
            <linearGradient id="plug-metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F6F8FB" />
              <stop offset=".5" stopColor="#AAB3BF" />
              <stop offset="1" stopColor="#6A7280" />
            </linearGradient>
            <filter id="plug-blur" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.3" /></filter>
          </defs>
        </svg>

        {/* Pen notes */}
        <p aria-hidden className="bench-note" style={{ left: "2%", top: "-1%", rotate: "-3deg" }}>{NOTES[spins % NOTES.length]}</p>
        <p aria-hidden className="bench-note" style={{ left: "63%", top: "-1%", rotate: "-2deg" }}>{touchedWire ? "nice! now press red" : "1. drag wire to branch"}</p>
        <p aria-hidden className="bench-note" style={{ left: "0%", top: "13%", rotate: "-6deg" }}>3. press!</p>
        <svg aria-hidden viewBox="0 0 40 70" className="bench-arrow" fill="none"><path d="M12 3C2 26 24 40 24 66M24 66l-8-11M24 66l8-11" stroke="#16233A" strokeWidth="2.4" strokeLinecap="round" /></svg>

        {/* The real red button on the Arduino photo */}
        <button
          type="button"
          onClick={spin}
          disabled={busy}
          aria-label={spins === 0 ? "Press the red button to get a project idea" : "Press the red button again"}
          className="bench-reset"
          style={{ left: `${(RESET.x / 480) * 100}%`, top: `${(RESET.y / 480) * 100}%` }}
        >
          {spins === 0 && !busy && <span aria-hidden className="bench-reset-ring route-now" />}
        </button>
      </div>

      {/* Mini or major: circle one, like on a form */}
      <div role="group" aria-label="Project size" className={`relative mt-1 flex items-center justify-center gap-5 ${pen.className}`}>
        <span aria-hidden className="bench-note-inline">2.</span>
        {(["mini", "major"] as const).map((l) => (
          <button key={l} type="button" disabled={busy} aria-pressed={level === l} onClick={() => choose(branch, l)} className="relative h-11 px-5 text-[24px] font-bold text-[var(--ink)] disabled:cursor-wait">
            {level === l && <PenCircle />}
            {l === "mini" ? "mini project" : "major project"}
          </button>
        ))}
      </div>

      </div>

      {/* A closed page stays on the desk as a sticky note; tap to open it again */}
      <AnimatePresence>
        {phase === "stub" && receipt && (
          <motion.div
            key={`stub-${receipt.idea.id}`}
            className="relative mt-3 mx-auto w-[62%]"
            initial={reduced ? { opacity: 0 } : { y: -14, opacity: 0, rotate: -5 }}
            animate={{ y: 0, opacity: 1, rotate: -1.5 }}
            exit={{ y: -10, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <button type="button" onClick={() => openReceipt(false, false)} aria-label={`Open idea: ${receipt.idea.title}`} className={`nb-stub ${pen.className} ${receipt.golden ? "nb-stub-gold" : ""}`}>
              <span className="block text-[17px] font-bold leading-none opacity-70">No. {pad(receipt.idea.id)} · tap to open</span>
              <span className={`block mt-1 text-[19px] leading-tight truncate ${marker.className}`}>{receipt.idea.title}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {phase === "open" && receipt ? `Your idea: ${receipt.idea.title}. ${receipt.idea.pitch}` : ""}
      </p>

      {spins >= 8 && (
        <p className="mt-4 text-sm text-[var(--ink)]">
          Picky! Tell us what you like and we&apos;ll suggest one.{" "}
          <Link href="/submit?category=unsure" className="font-semibold underline underline-offset-4">Describe your interest</Link>
        </p>
      )}

      <AnimatePresence>
        {phase === "open" && receipt && (
          <NotebookOverlay
            key="receipt"
            receipt={receipt}
            storeOpen={storeOpen}
            reduced={reduced}
            bits={bits}
            burst={burst}
            ticked={ticks[receipt.idea.id] ?? []}
            onTick={(part) => setTicks((t) => { const cur = t[receipt.idea.id] ?? []; return { ...t, [receipt.idea.id]: cur.includes(part) ? cur.filter((x) => x !== part) : [...cur, part] }; })}
            onSpin={spin}
            onClosed={() => setPhase("stub")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
