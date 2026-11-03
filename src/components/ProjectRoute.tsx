import type { CSSProperties } from "react";
import { Inbox, Eye, CircleCheck, CookingPot, GraduationCap, Check, ArrowDown } from "lucide-react";

// The delivery-style route a project travels. Used twice so it feels familiar:
//   - home page "How it works" (no `current`): every stage explained
//   - status page (with `current`): done / now / next, Swiggy-tracker style; only the current stage plays its icon animation
export const STAGES = [
  { status: "new", label: "Received", icon: Inbox,
    explain: "Fill the 3-minute form with your idea, deadline and contact. Attach your synopsis if you have one.",
    now: "We got your request. It's in the queue." },
  { status: "reviewing", label: "Reviewing", icon: Eye,
    explain: "We read every request ourselves and check that we can build it well and on time.",
    now: "We're reading your idea right now." },
  { status: "accepted", label: "Accepted", icon: CircleCheck,
    explain: "If it's a fit, we call or WhatsApp you to agree the details and price.",
    now: "You're in! Expect a call or WhatsApp from us soon." },
  { status: "in_progress", label: "Building", icon: CookingPot,
    explain: "We build your project and keep you posted along the way.",
    now: "Your project is in the oven." },
  { status: "completed", label: "Delivered", icon: GraduationCap,
    explain: "You get a working project before your deadline.",
    now: "Delivered. All the best for your review!" },
] as const;

export function ProjectRoute({ current }: { current?: number }) {
  const tracking = current !== undefined;
  return (
    <ol className={`relative grid gap-0 route-play ${tracking ? "route-track" : "md:grid-cols-5 md:gap-6"}`}>
      {STAGES.map((s, i) => {
        const state = !tracking ? "info" : i < current ? "done" : i === current ? "now" : "next";
        const Icon = state === "done" ? Check : s.icon;
        const last = i === STAGES.length - 1;
        return (
          <li
            key={s.status}
            style={{ "--i": tracking ? 0 : i } as CSSProperties}
            className={`relative flex gap-4 ${!tracking || state === "now" ? `route-s${i}` : ""} ${tracking ? "pb-7" : "pb-8 md:pb-0 md:flex-col md:gap-3"} last:pb-0`}
          >
            {/* connector line */}
            {!last && (
              <span
                aria-hidden
                className={`route-line absolute left-[19px] top-10 bottom-0 w-[2px] ${tracking ? "" : "md:left-10 md:right-[-24px] md:top-[19px] md:bottom-auto md:w-auto md:h-[2px]"}`}
                style={{
                  background: state === "done" ? "var(--go)" : "transparent",
                  backgroundImage: state === "done" ? undefined : "repeating-linear-gradient(var(--rule) 0 6px, transparent 6px 11px)",
                }}
              >
                {!tracking && <span className="route-streak" />}
              </span>
            )}
            <span
              className={`route-dot relative z-10 grid place-items-center shrink-0 w-10 h-10 rounded-full ${state === "now" ? "route-now" : ""}`}
              style={{
                background: state === "done" ? "var(--go)" : state === "now" ? "var(--hi)" : state === "next" ? "var(--paper-2)" : "#fff",
                color: state === "done" ? "#fff" : state === "next" ? "var(--mute)" : "var(--ink)",
                border: state === "info" ? "2px solid var(--ink)" : state === "next" ? "1px solid var(--rule)" : "none",
              }}
            >
              <Icon size={18} strokeWidth={2.2} className="route-ic" />
              {(!tracking || state === "now") && <StageFx i={i} />}
            </span>
            <div className="min-w-0 pt-1.5 md:pt-0">
              <p className={`font-semibold ${state === "next" ? "text-[var(--mute)]" : "text-[var(--ink)]"}`}>{s.label}</p>
              {state === "info" && <p className="mt-1 text-sm leading-relaxed text-[var(--mute)] max-w-[40ch]">{s.explain}</p>}
              {state === "now" && (
                <p className="mt-2 inline-block rounded-xl rounded-tl-sm bg-[var(--hi-soft)] px-3 py-2 text-sm font-medium text-[var(--ink)]">
                  {s.now}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Decorative extras for the home-page animation (see .route-play in globals.css)
function StageFx({ i }: { i: number }) {
  if (i === 0) return <ArrowDown aria-hidden size={11} strokeWidth={3} className="route-arrow" />;
  if (i === 3) return (<><span aria-hidden className="route-steam" /><span aria-hidden className="route-steam" /></>);
  if (i === 4) return (<>{[0, 1, 2, 3].map((k) => <span aria-hidden key={k} className="route-conf" />)}</>);
  return null;
}
