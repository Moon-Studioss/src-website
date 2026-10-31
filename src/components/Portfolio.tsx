"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView, useReducedMotion, type PanInfo } from "framer-motion";
import { Code2, Smartphone, Brain, Cpu, Monitor, X, Heart, type LucideIcon } from "lucide-react";

type Category = "web" | "app" | "ml" | "iot" | "software";

// TODO(client): replace the icon panels with real photos of delivered projects.
const PROJECTS: { title: string; tag: string; category: Category; description: string }[] = [
  { title: "Smart Attendance System", tag: "IoT + Web", category: "iot", description: "RFID-based attendance with a live dashboard for college departments." },
  { title: "Crop Disease Detector", tag: "ML / AI", category: "ml", description: "Finds leaf diseases from a mobile photo with a trained CNN model." },
  { title: "College Event Portal", tag: "Web App", category: "web", description: "Event registration, scheduling and e-certificates in one place." },
  { title: "Student Fee Tracker", tag: "Desktop", category: "software", description: "Windows app for fee records, receipts and overdue alerts." },
  { title: "Traffic Flow Analyzer", tag: "ML / AI", category: "ml", description: "Counts vehicles and spots congestion from CCTV footage with OpenCV." },
  { title: "Pharmacy Inventory App", tag: "Mobile App", category: "app", description: "Android stock management with expiry alerts and billing." },
  { title: "Home Automation Controller", tag: "IoT", category: "iot", description: "ESP8266 and a phone app to switch appliances by voice or touch." },
  { title: "Library Book Recommender", tag: "ML + Web", category: "ml", description: "Suggests books students will like, with a React frontend." },
  { title: "Online Complaint Portal", tag: "Web App", category: "web", description: "Citizens report civic issues and track them until they are fixed." },
  { title: "Employee Leave Manager", tag: "Web App", category: "web", description: "Leave requests, approvals and balances with email alerts." },
];

const LOOK: Record<Category, { color: string; icon: LucideIcon; label: string }> = {
  web: { color: "var(--cat-web)", icon: Code2, label: "Web App" },
  app: { color: "var(--cat-app)", icon: Smartphone, label: "Mobile App" },
  ml: { color: "var(--cat-ml)", icon: Brain, label: "ML / AI" },
  iot: { color: "var(--cat-iot)", icon: Cpu, label: "IoT" },
  software: { color: "var(--cat-desktop)", icon: Monitor, label: "Software" },
};

function ProjectCard({ p }: { p: (typeof PROJECTS)[number] }) {
  const look = LOOK[p.category];
  const Icon = look.icon;
  return (
    <div className="h-full flex flex-col bg-white rounded-3xl border border-[var(--rule)] overflow-hidden select-none">
      <div
        className="relative h-40 grid place-items-center grid-texture"
        style={{ background: `color-mix(in srgb, ${look.color} 12%, white)` }}
      >
        <Icon size={56} strokeWidth={1.5} style={{ color: look.color }} />
      </div>
      <div className="p-5 flex flex-col gap-2">
        <span className="self-start text-[12px] font-semibold px-2 py-0.5 rounded-md" style={{ color: look.color, background: `color-mix(in srgb, ${look.color} 12%, white)` }}>
          {p.tag}
        </span>
        <h3 className="font-display text-xl font-bold leading-tight text-[var(--ink)]">{p.title}</h3>
        <p className="text-sm leading-relaxed text-[var(--mute)]">{p.description}</p>
      </div>
    </div>
  );
}

// Phones: a Tinder-style deck. Right = "I want something like this" → form.
function SwipeDeck() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [top, setTop] = useState(0);
  const [exitDir, setExitDir] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const seen = useInView(deckRef, { once: true, amount: 0.6 });

  const p = PROJECTS[top % PROJECTS.length];

  const go = (dir: 1 | -1) => {
    setExitDir(dir);
    if (dir === 1) {
      setChosen(LOOK[p.category].label);
      setTimeout(() => router.push(`/submit?category=${p.category}`), reduced ? 0 : 450);
    }
    setTop((t) => t + 1);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 90 || info.velocity.x > 500) go(1);
    else if (info.offset.x < -90 || info.velocity.x < -500) go(-1);
  };

  return (
    <div className="md:hidden">
      <div ref={deckRef} className="relative h-[330px]">
        {/* the two cards waiting underneath */}
        {[2, 1].map((k) => (
          <div
            key={`${top + k}`}
            className="absolute inset-0"
            style={{ transform: `translateY(${k * 10}px) scale(${1 - k * 0.04})`, opacity: 1 - k * 0.25 }}
            aria-hidden
          >
            <ProjectCard p={PROJECTS[(top + k) % PROJECTS.length]} />
          </div>
        ))}
        <AnimatePresence custom={exitDir}>
          <motion.div
            key={top}
            className="absolute inset-0 touch-pan-y cursor-grab active:cursor-grabbing"
            drag="x"
            dragSnapToOrigin
            onDragEnd={onDragEnd}
            whileDrag={{ rotate: 0 }}
            style={{ zIndex: 10 }}
            initial={false}
            animate={seen && top === 0 && !reduced ? { x: [0, -18, 14, 0], rotate: [0, -3, 2, 0] } : { x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            custom={exitDir}
            variants={{
              gone: (dir: number) =>
                reduced ? { opacity: 0 } : { x: dir * 420, rotate: dir * 18, opacity: 0, transition: { duration: 0.35 } },
            }}
            exit="gone"
          >
            <ProjectCard p={p} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={() => go(-1)} className="press h-12 flex-1 rounded-full border border-[var(--rule)] bg-white font-semibold inline-flex items-center justify-center gap-2">
          <X size={18} /> Next
        </button>
        <span className="text-sm tabular text-[var(--mute)] w-14 text-center">{(top % PROJECTS.length) + 1} / {PROJECTS.length}</span>
        <button type="button" onClick={() => go(1)} className="press h-12 flex-1 rounded-full bg-[var(--hi)] text-[var(--ink)] font-semibold inline-flex items-center justify-center gap-2">
          <Heart size={18} /> I want this
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-3 h-5 text-center text-sm text-[var(--mute)]">
        {chosen ? `Opening the form with ${chosen} selected…` : "Swipe right on a project you like"}
      </p>
    </div>
  );
}

export default function Portfolio() {
  return (
    <section id="work" className="py-16 md:py-24 bg-[var(--paper-2)] border-y border-[var(--rule)] scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--ink)]">Projects we&apos;ve built</h2>
        <p className="mt-2 mb-8 text-[var(--mute)] max-w-[52ch]">Like one of these? Tell us, and we&apos;ll build yours the same way.</p>
        <SwipeDeck />
        <div className="hidden md:grid grid-cols-3 gap-6">
          {PROJECTS.slice(0, 6).map((p) => (
            <a key={p.title} href={`/submit?category=${p.category}`} className="block transition-transform hover:-translate-y-1">
              <ProjectCard p={p} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
