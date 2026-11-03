"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "./StoreContext";

const HINT_KEY = "src-store-hint-seen";
export const markHintSeen = () => {
  try { localStorage.setItem(HINT_KEY, "1"); } catch {}
};

// First visit only: "Tap a card to see details", shown briefly, then faded out.
// Marked as seen once it has really been shown (fade-out or first card tap).
export function FlipHint() {
  const { flippedId } = useStore();
  const [hint, setHint] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_KEY)) return;
    } catch {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of localStorage after hydration
    setHint(true);
    const t = setTimeout(() => {
      setHint(false);
      markHintSeen();
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {hint && flippedId === null && (
        <motion.p
          key="hint"
          className="pt-4 text-[15px] font-bold text-[var(--ink)] overflow-hidden"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
          transition={{ duration: 0.35 }}
        >
          <span className="hl">Tap a card to see details</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}
