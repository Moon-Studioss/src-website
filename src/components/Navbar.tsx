"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// Fixed top bar. Desktop: links + CTA. Mobile: just the wordmark —
// navigation lives in the bottom tab bar (BottomTabBar.tsx).
export default function Navbar({ hideStore = false }: { hideStore?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#work", label: "Our work" },
    ...(hideStore ? [] : [{ href: "/store", label: "Store" }]),
    { href: "/status", label: "Track project" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 border-b ${
        scrolled ? "bg-white border-[var(--rule)]" : "border-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-1 select-none">
          <span className="font-display text-xl font-extrabold text-[var(--ink)]">SRC</span>
          <span className="text-base text-[var(--mute)] tracking-tight">e-solutions</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <Link
          href="/submit"
          className="hidden md:inline-flex paper-btn text-sm font-bold px-5 py-2.5 tracking-tight"
        >
          Submit project
        </Link>
      </nav>
    </header>
  );
}
