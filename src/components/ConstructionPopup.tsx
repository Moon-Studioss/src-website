"use client";

import { useState } from "react";
import { Wrench, X } from "lucide-react";

// Dismissible "Under Construction" notice: blurs the page behind it, nav stays in the DOM.
export function ConstructionPopup({ title = "Under Construction", text = "We are wiring things up. Some parts of the site may not work yet.", bold = false }: { title?: string; text?: string; bold?: boolean }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4 bg-[var(--ink)]/30 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm text-center bg-white rounded-2xl border-t-4 border-t-[var(--hi)] border border-[var(--rule)] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        <button onClick={() => setOpen(false)} aria-label="Close" className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--mute)] hover:bg-[var(--hi-soft)] hover:text-[var(--ink)]"><X size={18} /></button>
        <div className="mx-auto mb-4 grid place-items-center w-14 h-14 rounded-full bg-[var(--hi)] text-[var(--ink)]"><Wrench size={26} className="wrench-anim" /></div>
        <h2 className="text-2xl font-bold text-[var(--ink)] tracking-tight">{title}</h2>
        <p className={bold ? "mt-2 font-bold text-red-600" : "mt-2 text-[var(--mute)]"}>{text}</p>
        <button onClick={() => setOpen(false)} className="press mt-6 px-6 py-2.5 rounded-lg bg-[var(--hi)] text-[var(--ink)] font-bold">Got it</button>
      </div>
    </div>
  );
}
