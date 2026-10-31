"use client";

import { useRef } from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";

// Drag for "days left"; the face and message react honestly to the time.
const MOODS = [
  { min: 30, face: "😎", text: "Plenty of time. A complete project with report fits easily." },
  { min: 15, face: "🙂", text: "Comfortable. A complete project fits." },
  { min: 7, face: "😅", text: "Doable. Usually enough for a solid working prototype." },
  { min: 1, face: "😱", text: "Panic mode. We'll tell you honestly what's possible, maybe a demo version." },
];
const MAX_DAYS = 60;

export const moodFor = (days: number) => MOODS.find((m) => days >= m.min) ?? MOODS[MOODS.length - 1];

export function DeadlineSlider({ deadline, onChange }: { deadline: string; onChange: (iso: string) => void }) {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const realDays = deadline ? differenceInCalendarDays(new Date(deadline), today) : null;
  const days = realDays === null ? 21 : Math.min(MAX_DAYS, Math.max(1, realDays));
  const mood = realDays === null ? { face: "🗓️", text: "Drag to set how many days you have left." } : moodFor(days);
  const lastFace = useRef(mood.face);

  const set = (d: number) => {
    const next = moodFor(d).face;
    if (next !== lastFace.current) {
      lastFace.current = next;
      try { navigator.vibrate?.(10); } catch {}
    }
    onChange(format(addDays(today, d), "yyyy-MM-dd"));
  };

  return (
    <div className="rounded-2xl border border-[var(--rule)] bg-white p-5">
      <div className="flex items-center gap-4">
        <span className="text-5xl leading-none select-none" aria-hidden>{mood.face}</span>
        <p aria-live="polite" className="font-semibold text-[var(--ink)] leading-snug">{mood.text}</p>
      </div>
      <input
        id="deadline-days"
        type="range"
        min={1}
        max={MAX_DAYS}
        value={days}
        onChange={(e) => set(Number(e.target.value))}
        aria-valuetext={realDays === null ? "Not set" : `${days} days left`}
        className="mt-5 w-full accent-[var(--ink)] h-8 cursor-pointer"
      />
      <div className="flex justify-between text-sm">
        <label htmlFor="deadline-days" className="font-semibold text-[var(--ink)] tabular">
          {realDays === null ? "Days left" : realDays > MAX_DAYS ? `${MAX_DAYS}+ days left` : `${days} ${days === 1 ? "day" : "days"} left`}
        </label>
        {deadline && <span className="text-[var(--mute)]">Due {format(new Date(deadline), "EEE, d MMM")}</span>}
      </div>
    </div>
  );
}
