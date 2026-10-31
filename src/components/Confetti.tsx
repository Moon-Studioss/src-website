"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Small celebratory burst: golden idea, request sent. Never on its own.
export type Bit = { x: number; y: number; r: number; c: string; w: number };
export const makeBits = (): Bit[] =>
  Array.from({ length: 28 }, (_, i) => ({
    x: (Math.random() - 0.5) * 340,
    y: -60 - Math.random() * 140,
    r: Math.random() * 540 - 270,
    c: ["var(--hi)", "var(--gold)", "var(--ink)", "var(--go)"][i % 4],
    w: 6 + Math.random() * 6,
  }));

export function Confetti({ bits, burst }: { bits: Bit[]; burst: number }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-20" aria-hidden>
      {bits.map((b, i) => (
        <motion.span
          key={`${burst}-${i}`}
          className="absolute block rounded-[2px]"
          style={{ width: b.w, height: b.w * 0.45, background: b.c }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 220], rotate: b.r, opacity: [1, 1, 0] }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// Fires once when mounted (e.g. on the "request sent" screen)
export function ConfettiOnMount() {
  const reduced = useReducedMotion();
  const [bits, setBits] = useState<Bit[]>([]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- random values must be made on the client, after hydration
  useEffect(() => setBits(makeBits()), []);
  if (reduced || bits.length === 0) return null;
  return <Confetti bits={bits} burst={1} />;
}
