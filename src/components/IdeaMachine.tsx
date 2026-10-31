"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, animate } from "framer-motion";
import { X } from "lucide-react";
import { Confetti, makeBits, type Bit } from "./Confetti";
import { BRANCHES, IDEAS, ideasFor, pickNext, type Branch, type Idea, type Level } from "@/lib/ideas";

const REEL_H = 92;           // px, height of one reel row
const FILLERS = 12;          // random words that fly past before the final one
const DURATIONS = [0.9, 1.35, 2.0]; // last reel is slowest: suspense
const FEED_S = 1.2;          // seconds the receipt takes to print out of the slot
const GOLDEN_ODDS = 1 / 15;
const LEVER_PULL = 72;      // px the lever ball travels when pulled
const STORAGE_KEY = "src-idea-machine";

type Field = "domain" | "tech" | "title";
const FIELDS: Field[] = ["domain", "tech", "title"];

// idle → spinning → printing (receipt feeds out of the slot) → open (popped onto the screen)
//   → stub (closed receipt hangs from the slot; tap to open again)
type Phase = "idle" | "spinning" | "printing" | "open" | "stub";
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

function randomWords(field: Field, n: number) {
  return Array.from({ length: n }, () => IDEAS[Math.floor(Math.random() * IDEAS.length)][field]);
}

const pad = (id: number) => String(id).padStart(4, "0");

// ─── One reel window. Idle: a single value. Spinning: a strip that slides up.
function Reel({ strip, spinKey, duration, onStop, wide }: {
  strip: string[]; spinKey: number; duration: number; onStop: () => void; wide?: boolean;
}) {
  const spins = strip.length > 1;
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(#F3F5F8,#FFFFFF_45%,#FFFFFF_55%,#F3F5F8)]" style={{ height: REEL_H }}>
      <motion.div
        key={spins ? spinKey : "idle"}
        initial={{ y: 0 }}
        animate={{ y: spins ? -(strip.length - 1) * REEL_H : 0 }}
        transition={spins ? { duration, ease: [0.15, 0.85, 0.3, 1.06] } : { duration: 0 }}
        onAnimationComplete={() => spins && onStop()}
      >
        {strip.map((word, i) => (
          <div
            key={i}
            className={`flex items-center justify-center text-center px-1.5 font-display font-bold leading-tight text-[var(--ink)] ${wide ? "text-[15px]" : "text-[14px]"}`}
            style={{ height: REEL_H }}
          >
            <span className="line-clamp-2">{word}</span>
          </div>
        ))}
      </motion.div>
      {/* curved-glass depth: fade top and bottom */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(rgb(10 17 32 / .42), rgb(10 17 32 / .08) 26%, transparent 42%, transparent 58%, rgb(10 17 32 / .08) 74%, rgb(10 17 32 / .42))" }} />
    </div>
  );
}

// ─── Receipt bits ────────────────────────────────────────────────
function Barcode({ seed, className = "" }: { seed: string; className?: string }) {
  const widths = Array.from({ length: 34 }, (_, i) => ((seed.charCodeAt(i % seed.length) * (i + 3)) % 3) + 1);
  return (
    <div aria-hidden className={`flex items-stretch gap-[2px] ${className}`}>
      {widths.map((w, i) => <span key={i} style={{ width: w, background: "currentColor" }} />)}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0">{k}</span>
      <span aria-hidden className="flex-1 min-w-4 border-b-2 border-dotted border-current opacity-25" />
      <span className="font-bold text-right">{v}</span>
    </div>
  );
}

const Dashes = () => <div aria-hidden className="my-3 border-t-2 border-dashed border-current opacity-25" />;

// 5 rising bars, like a signal meter
function Meter({ n }: { n: number }) {
  return (
    <span className="inline-flex items-end gap-[3px] align-baseline" role="img" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="w-[5px] rounded-[1px]" style={{ height: 3 + i * 2.4, background: i <= n ? "currentColor" : "rgb(28 36 51 / .18)" }} />
      ))}
    </span>
  );
}

// Rubber-ink stamp that thumps down after the receipt lands. The turbulence
// filter knocks speckles out of the ink so it looks hand-stamped.
function Stamp({ reduced }: { reduced: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => buzz(18), 680);
    return () => clearTimeout(t);
  }, [reduced]);
  return (
    <motion.svg
      viewBox="0 0 120 120"
      aria-hidden
      className="pointer-events-none absolute -right-3 -top-3 w-[88px] h-[88px]"
      initial={reduced ? false : { scale: 2.1, opacity: 0, rotate: 4 }}
      animate={{ scale: 1, opacity: 0.9, rotate: -14 }}
      transition={reduced ? { duration: 0 } : { delay: 0.62, type: "spring", stiffness: 620, damping: 19 }}
    >
      <defs>
        <path id={`ring-${id}`} d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
        <filter id={`ink-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 1.75" result="holes" />
          <feComposite in="SourceGraphic" in2="holes" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#ink-${id})`} fill="#0B6E4F" stroke="#0B6E4F">
        <circle cx="60" cy="60" r="56" fill="none" strokeWidth="4" />
        <circle cx="60" cy="60" r="31" fill="none" strokeWidth="2" />
        <text fontFamily="var(--font-geist-mono), monospace" fontSize="9.5" fontWeight="700" letterSpacing="1.6" stroke="none">
          <textPath href={`#ring-${id}`}>SRC E-SOLUTIONS ★ IDEA MACHINE ★</textPath>
        </text>
        <text x="60" y="58" textAnchor="middle" fontFamily="var(--font-bricolage), sans-serif" fontSize="15" fontWeight="800" stroke="none">BUILD</text>
        <text x="60" y="73" textAnchor="middle" fontFamily="var(--font-bricolage), sans-serif" fontSize="15" fontWeight="800" stroke="none">READY</text>
      </g>
    </motion.svg>
  );
}

// Gold foil seal for the rare golden idea
const SEAL_POINTS = Array.from({ length: 32 }, (_, i) => {
  const r = i % 2 ? 40 : 48;
  const a = (i * Math.PI) / 16;
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

function FoilSeal() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="absolute -top-4 -left-4 z-10 w-[86px] h-[86px] -rotate-12" style={{ filter: "drop-shadow(0 4px 6px rgb(0 0 0 / .35))" }}>
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

// Paper feeding out of the slot: jerky printer steps + a flutter as it hangs
function PrintingPaper({ receipt, paperRef, onDone }: {
  receipt: Receipt; paperRef: React.RefObject<HTMLDivElement | null>; onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, (FEED_S + 0.3) * 1000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="absolute left-10 right-10 top-[calc(100%-2px)] z-10 h-[150px] overflow-hidden [perspective:700px]" aria-hidden>
      <motion.div
        ref={paperRef}
        className={`receipt-paper receipt-feed h-full px-4 pt-3 pb-4 origin-top mono text-[11px] leading-snug ${receipt.golden ? "receipt-gold" : ""}`}
        initial={{ y: "-100%" }}
        animate={{
          y: ["-100%", "-74%", "-72%", "-44%", "-42%", "-12%", "0%"],
          rotateX: [0, 12, -6, 14, -6, 8, 0],
          skewX: [0, 1.5, -1, 2, -1, 0.6, 0],
        }}
        transition={{ duration: FEED_S, ease: "easeOut", times: [0, 0.2, 0.3, 0.5, 0.6, 0.85, 1] }}
      >
        <div className="flex justify-between opacity-70">
          <span>THE IDEA MACHINE</span>
          <span>No. {pad(receipt.idea.id)}</span>
        </div>
        <p className="mt-2 font-display text-lg font-extrabold leading-tight line-clamp-2">{receipt.idea.title}</p>
        <Barcode seed={receipt.idea.title} className="h-7 mt-3" />
      </motion.div>
    </div>
  );
}

// The torn-off receipt, popped onto the screen
function ReceiptOverlay({ receipt, from, slotRef, storeOpen, reduced, bits, burst, onSpin, onClosed }: {
  receipt: Receipt; from: DOMRect | null; slotRef: React.RefObject<HTMLDivElement | null>; storeOpen: boolean;
  reduced: boolean; bits: Bit[]; burst: number; onSpin: () => void; onClosed: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  // Scale the receipt down on short screens so receipt + buttons never need scrolling
  const [fit, setFit] = useState<{ s: number; h: number } | null>(null);
  const { idea, golden, branch } = receipt;
  const buildHref = `/submit?category=${idea.category}&title=${encodeURIComponent(idea.title)}`;
  const shareText = `Got this project idea from SRC e-solutions 👀\n\n${idea.title}: ${idea.pitch}\n\nSpin your own:`;

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

  // Fly from where the paper was (slot / stub / chip) to the centre, with a paper wobble
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (!from || reduced) {
      animate(el, { opacity: [0, 1] }, { duration: reduced ? 0 : 0.2 });
      return;
    }
    const to = el.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    animate(el, { x: [dx, 0], y: [dy, 0], scale: [Math.max(0.2, from.width / to.width), 1] }, { type: "spring", stiffness: 240, damping: 22 });
    animate(el, { rotate: [-10, 5, -2, -0.8], skewY: [0, 2, -1, 0] }, { duration: 0.75, ease: "easeOut" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on open
  }, []);

  // Shrink back into the machine's slot, then hang there as a stub
  const close = useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    const el = cardRef.current;
    const slot = slotRef.current?.getBoundingClientRect();
    if (el && slot && !reduced) {
      const r = el.getBoundingClientRect();
      await animate(
        el,
        { x: slot.left + slot.width / 2 - (r.left + r.width / 2), y: slot.top + 24 - (r.top + r.height / 2), scale: 0.22, rotate: 8, opacity: 0 },
        { duration: 0.38, ease: [0.4, 0, 0.6, 1] }
      );
    }
    onClosed();
  }, [onClosed, reduced, slotRef]);

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

  return (
    <motion.div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label={`Your project idea: ${idea.title}`}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <motion.div className="absolute inset-0 bg-[#0E1626]/90" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={close} />
      <div className="absolute inset-0 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="min-h-full flex flex-col items-center justify-center gap-4 px-5 pt-14 pb-[max(16px,env(safe-area-inset-bottom))]" onClick={(e) => e.target === e.currentTarget && close()}>
          <div ref={cardRef} className="relative w-full max-w-[360px]" style={fit ? { height: fit.h * fit.s } : undefined}>
            {burst > 0 && golden && <Confetti bits={bits} burst={burst} />}
            <div ref={fitRef} className="relative" style={fit ? { transform: `scale(${fit.s})`, transformOrigin: "top center" } : undefined}>
            {/* Cheap layered shadows (a filter on the masked paper glitches some GPUs) */}
            <div aria-hidden className="absolute inset-x-5 top-10 -bottom-3 rounded-[40px] bg-black/55 blur-2xl" />
            <div aria-hidden className="absolute inset-x-2 top-3 -bottom-1 bg-black/30 blur-md" />
            {golden && <FoilSeal />}
            <div className={`receipt-paper receipt-perf relative ${golden ? "receipt-gold" : ""} px-6 pt-8 mono text-[12px] leading-relaxed`}>
              {golden && <div className="receipt-shine" aria-hidden />}

              {/* Header: brand badge + name, stamped in the corner */}
              <div className="relative text-center">
                <Stamp reduced={reduced} />
                <div className="mx-auto mb-2.5 grid place-items-center w-12 h-12 rounded-full bg-[var(--ink)] text-[var(--hi)] font-display text-[13px] font-extrabold shadow-[0_0_0_4px_rgb(28_36_51/.08)]">
                  SRC
                </div>
                <p className="font-display text-[22px] leading-none font-extrabold tracking-tight">SRC e-solutions</p>
                <p className="mt-1.5 text-[11px] tracking-[0.32em]">THE IDEA MACHINE</p>
                <p className="mt-1 text-[11px] opacity-55">
                  {receipt.at.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  {receipt.spin > 0 && `  ·  SPIN #${receipt.spin}`}
                </p>
              </div>

              <Dashes />
              <Row k="IDEA NO." v={pad(idea.id)} />
              <Row k="BRANCH" v={branch} />
              <Row k="SIZE" v={idea.level === "mini" ? "MINI PROJECT" : "MAJOR PROJECT"} />
              <Row k="DOMAIN" v={idea.domain.toUpperCase()} />
              <Row k="BUILT WITH" v={idea.tech.toUpperCase()} />
              <Dashes />

              <h3 className="font-display text-[28px] leading-[1.04] font-extrabold tracking-tight" style={{ color: "inherit" }}>{idea.title}</h3>
              <p className="mt-2 font-sans text-[15px] leading-snug opacity-75">{idea.pitch}</p>

              <Dashes />
              <Row k="DIFFICULTY" v={<Meter n={idea.difficulty} />} />
              {idea.parts && storeOpen && (
                <div className="mt-2.5">
                  <p className="opacity-70">PARTS IN OUR STORE</p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {idea.parts.map((p) => (
                      <li key={p}>
                        <Link href={`/store?q=${encodeURIComponent(p)}`} className="inline-block px-2 py-0.5 rounded border border-current/25 font-bold hover:bg-[#1C2433] hover:text-[#FFFEF9] transition-colors">
                          {p}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tear-off stub below the perforation (height must match --perf) */}
              <div className="relative -mx-6 mt-6 h-[136px] flex flex-col items-center justify-center gap-1.5 pb-2">
                <span aria-hidden className="absolute top-0 left-[14px] right-[14px] border-t-2 border-dashed border-current opacity-30" />
                <span aria-hidden className="absolute -top-[10px] left-7 px-1 text-[13px] leading-none opacity-45 bg-[var(--paper-bottom)]">✂</span>
                <Barcode seed={idea.title} className="h-11" />
                <p className="tracking-[0.35em] text-[11px] opacity-70">IDEA-{pad(idea.id)}</p>
                <p className="text-[11px] tracking-[0.12em]">THANK YOU FOR SPINNING!</p>
              </div>
            </div>
            </div>
          </div>

          <motion.div
            ref={btnRef}
            className="w-full max-w-[360px] flex flex-col gap-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.35 }}
          >
            <Link href={buildHref} className="spin-btn h-[52px] rounded-2xl text-[var(--ink)] font-display text-lg font-extrabold grid place-items-center">
              Build this for me
            </Link>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${typeof window === "undefined" ? "" : window.location.origin}/#ideas`)}`}
                onClick={share}
                target="_blank"
                rel="noopener noreferrer"
                className="press h-11 rounded-xl bg-[#1A2740] border border-white/20 text-white text-sm font-semibold grid place-items-center hover:bg-[#243556]"
              >
                Send to my group
              </a>
              <button type="button" onClick={onSpin} className="press h-11 rounded-xl bg-[#1A2740] border border-white/20 text-white text-sm font-semibold hover:bg-[#243556]">
                Spin again
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      <button
        type="button"
        onClick={close}
        autoFocus
        aria-label="Close receipt"
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
  const [strips, setStrips] = useState<string[][]>([]);
  const [spinKey, setSpinKey] = useState(0);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [spins, setSpins] = useState(0);
  const [burst, setBurst] = useState(0);
  const [bits, setBits] = useState<Bit[]>([]);
  const [openFrom, setOpenFrom] = useState<DOMRect | null>(null); // where the receipt flies in from

  const sfx = useSfx(true);
  const leverY = useMotionValue(0);
  const leverHint = useRef<ReturnType<typeof animate> | null>(null);
  const rodScale = useTransform(leverY, (v) => (96 - v) / 96); // rod spans ball → pivot (96px)
  const pull = useTransform(leverY, [0, LEVER_PULL], [0, 1]);
  const rodTilt = useTransform(pull, [0, 1], [0, 10]); // arm tilts toward you as it is pulled
  const ballX = useTransform(leverY, (v) => (96 - v) * Math.sin(((v / LEVER_PULL) * 10 * Math.PI) / 180)); // ball swings out on the arc
  const knobScale = useTransform(leverY, [0, LEVER_PULL], [1, 1.08]); // ball comes toward you
  const pending = useRef<{ idea: Idea; golden: boolean; reelsLeft: number } | null>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const stubRef = useRef<HTMLButtonElement>(null);
  const busy = phase === "spinning" || phase === "printing";

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
    (from: DOMRect | null, celebrate: boolean, golden: boolean) => {
      setOpenFrom(from);
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
    if (reduced) {
      openReceipt(null, true, p.golden);
    } else {
      setPhase("printing");
      sfx("print");
      buzz([8, 110, 8, 110, 8, 110, 8]);
    }
  }, [branch, spins, reduced, openReceipt, sfx]);

  const onPrinted = useCallback(() => {
    openReceipt(printRef.current?.getBoundingClientRect() ?? null, true, receipt?.golden ?? false);
  }, [openReceipt, receipt]);

  // Landing hint: the lever dips a little every few seconds until the first pull
  useEffect(() => {
    if (reduced || spins > 0 || phase !== "idle") return;
    const nudge = () => {
      leverHint.current = animate(leverY, [0, 26, 0], { duration: 0.9, times: [0, 0.45, 1], ease: "easeInOut" });
    };
    const first = setTimeout(nudge, 900);
    const every = setInterval(nudge, 4500);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [reduced, spins, phase, leverY]);

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
    pending.current = { idea: next, golden: Math.random() < GOLDEN_ODDS, reelsLeft: FIELDS.length };
    setReceipt(null);

    if (reduced) {
      finish();
      return;
    }
    leverHint.current?.stop();
    animate(leverY, [0, LEVER_PULL, 0], { duration: 0.55, times: [0, 0.45, 1], ease: "easeInOut" });
    setStrips(FIELDS.map((f) => [current[f], ...randomWords(f, FILLERS), next[f]]));
    setSpinKey((k) => k + 1);
    setPhase("spinning");
  }, [busy, current, pool, history, reduced, finish, leverY, sfx]);

  const shown = phase === "spinning" ? strips : FIELDS.map((f) => [current[f]]);
  const goldNow = !!receipt?.golden && (phase === "open" || phase === "stub");

  return (
    <div className="w-full max-w-[480px]">
      {/* Right margin leaves room for the lever on the cabinet's side */}
      <div className="md:mr-11">
      {/* The machine: chrome rim → navy cabinet */}
      <div className="machine-rim relative rounded-[30px] p-[3px]">
        <div className="machine-body relative rounded-[27px] px-3.5 pt-3.5 pb-6">
          {/* Lit marquee sign with bulbs */}
          <div className="machine-marquee relative rounded-[18px] px-3 pt-2.5 pb-3 mb-3" data-on={busy ? "spin" : goldNow ? "gold" : "idle"}>
            <div className="idea-bulbs flex justify-between px-1" data-on={busy ? "spin" : goldNow ? "gold" : "idle"} aria-hidden>
              {Array.from({ length: 11 }, (_, i) => <span key={i} style={{ ["--i" as string]: i }} />)}
            </div>
            <p className="machine-title mt-2.5 text-center font-display text-[22px] font-extrabold leading-none">The Idea Machine</p>
          </div>

          {/* Reel window: chrome bezel, recessed glass, payline */}
          <div className="relative">
            <div className="machine-bezel rounded-[18px] p-[5px]">
              <div className="relative rounded-[13px] overflow-hidden grid grid-cols-[0.95fr_1fr_1.45fr] gap-[2px] bg-[#0A1120]">
                {shown.map((strip, i) => (
                  <Reel key={i} strip={strip} spinKey={spinKey} duration={DURATIONS[i]} onStop={onReelStop} wide={i === 2} />
                ))}
                <div aria-hidden className="machine-glass pointer-events-none absolute inset-0 rounded-[13px]" />
              </div>
            </div>
            <span aria-hidden className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[8px] border-y-transparent border-l-[10px] border-l-[var(--hi)] drop-shadow" />
            <span aria-hidden className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[8px] border-y-transparent border-r-[10px] border-r-[var(--hi)] drop-shadow" />
          </div>

          {/* Project size switch: mini (3rd year) or major (final year) */}
          <div role="group" aria-label="Project size" className="machine-track grid grid-cols-2 mt-3.5 p-1 rounded-full">
            {(["mini", "major"] as const).map((l) => (
              <button
                key={l}
                type="button"
                disabled={busy}
                aria-pressed={level === l}
                onClick={() => choose(branch, l)}
                className="relative z-10 h-9 rounded-full text-[13px] font-bold transition-colors disabled:cursor-wait"
                style={{ color: level === l ? "var(--ink)" : "rgb(255 255 255 / .7)" }}
              >
                {level === l && (
                  <motion.span
                    layoutId="size-thumb"
                    aria-hidden
                    className="machine-thumb absolute inset-0 -z-10 rounded-full"
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
                  />
                )}
                {l === "mini" ? "Mini Project" : "Major Project"}
              </button>
            ))}
          </div>

          {/* Branch pills: the lever is the only spin control */}
          <div role="group" aria-label="Your branch" className="mt-4 flex justify-between gap-1.5">
            {BRANCHES.map((b) => (
              <button
                key={b}
                type="button"
                disabled={busy}
                aria-pressed={branch === b}
                onClick={() => choose(b, level)}
                className="press flex-1 h-10 rounded-full text-[13px] font-bold transition-colors disabled:cursor-wait"
                style={branch === b ? { background: "var(--hi)", color: "var(--ink)", boxShadow: "inset 0 1px 0 rgb(255 255 255 / .6)" } : { background: "#fff", color: "var(--ink)" }}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Phones: a Spin button instead of the lever */}
          <button
            type="button"
            onClick={spin}
            disabled={busy}
            className="spin-btn md:hidden mt-3.5 w-full h-[52px] rounded-2xl text-[var(--ink)] font-display text-lg font-extrabold"
          >
            {phase === "spinning" ? "Spinning…" : phase === "printing" ? "Printing your idea…" : spins === 0 ? "Spin for an idea" : "Spin again"}
          </button>
        </div>

        {/* Lever: bolted to the cabinet side. Drag the ball down or tap it; the arm tilts toward you. */}
        <div className="hidden md:block absolute top-[96px] -right-[40px] w-11 h-[150px]">
          <div aria-hidden className="machine-lever-mount absolute left-[2px] top-[80px] w-[14px] h-[70px] rounded-r-[7px]">
            <span className="machine-screw absolute left-[4px] top-[6px]" />
            <span className="machine-screw absolute left-[4px] bottom-[6px]" />
          </div>
          <motion.div aria-hidden className="machine-rod absolute left-[19px] top-[19px] w-[10px] h-[96px] rounded-full origin-bottom" style={{ scaleY: rodScale, rotate: rodTilt }} />
          <div aria-hidden className="machine-pivot absolute left-[11px] top-[102px] w-[26px] h-[26px] rounded-full" />
          <motion.div
            drag={busy ? false : "y"}
            dragConstraints={{ top: 0, bottom: LEVER_PULL }}
            dragElastic={0.05}
            dragSnapToOrigin
            onDragEnd={(_, info) => info.offset.y > LEVER_PULL / 2 && spin()}
            onTapStart={() => leverHint.current?.stop()}
            onTap={spin}
            role="button"
            aria-label="Pull the lever to get an idea"
            style={{ y: leverY, x: ballX, scale: knobScale }}
            className="machine-knob absolute left-[2px] top-[-2px] w-[44px] h-[44px] rounded-full cursor-grab active:cursor-grabbing touch-none"
          />
        </div>

        {/* Receipt slot, and the paper printing out of it */}
        <div ref={slotRef} aria-hidden className="machine-slot absolute z-20 left-8 right-8 -bottom-[6px] h-[12px] rounded-full" />
        <AnimatePresence>
          {phase === "printing" && receipt && (
            <motion.div key="feed" exit={{ opacity: 0, transition: { duration: 0.05 } }}>
              <PrintingPaper receipt={receipt} paperRef={printRef} onDone={onPrinted} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Closed receipt hangs from the slot */}
      <AnimatePresence>
        {phase === "stub" && receipt && (
          <motion.div
            key={`stub-${receipt.idea.id}`}
            className="relative mx-10 -mt-[2px] origin-top"
            initial={reduced ? { opacity: 0 } : { y: -36, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1, rotate: [0, -2.5, 1.5, -0.5, 0] }}
            exit={{ y: -36, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.6 }}
          >
            <div aria-hidden className="absolute inset-x-2 top-0 bottom-0 bg-[#16233A]/25 blur-md" />
            <button
              ref={stubRef}
              type="button"
              onClick={() => openReceipt(stubRef.current?.getBoundingClientRect() ?? null, false, false)}
              aria-label={`Open receipt: ${receipt.idea.title}`}
              className={`press relative block w-full text-left receipt-paper receipt-feed px-4 pt-2.5 pb-4 mono text-[11px] ${receipt.golden ? "receipt-gold" : ""}`}
            >
              <span className="flex justify-between opacity-60">
                <span>No. {pad(receipt.idea.id)}</span>
                <span>Tap to open</span>
              </span>
              <span className="block mt-0.5 font-display text-base font-extrabold truncate">{receipt.idea.title}</span>
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
          <ReceiptOverlay
            key="receipt"
            receipt={receipt}
            from={openFrom}
            slotRef={slotRef}
            storeOpen={storeOpen}
            reduced={reduced}
            bits={bits}
            burst={burst}
            onSpin={spin}
            onClosed={() => setPhase("stub")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
