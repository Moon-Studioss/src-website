"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar({ hideStore = false }: { hideStore?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
      style={{
        borderBottom: scrolled ? `1px solid var(--rule)` : "1px solid transparent",
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="flex items-baseline gap-1 select-none">
          <span
            className="text-lg tracking-tight"
            style={{ fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.03em" }}
          >
            SRC
          </span>
          <span
            className="text-base"
            style={{ fontWeight: 400, color: "var(--mute)", letterSpacing: "-0.01em" }}
          >
            e-solutions
          </span>
        </Link>

        {/* Nav links — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#work"
            className="text-sm transition-colors duration-150"
            style={{ color: "var(--mute)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--mute)")}
          >
            Our Work
          </a>
          <a
            href="#how-it-works"
            className="text-sm transition-colors duration-150"
            style={{ color: "var(--mute)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--mute)")}
          >
            How it Works
          </a>
          <Link
            href="/status"
            className="text-sm font-medium transition-colors duration-150"
            style={{ color: "var(--mute)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--mute)")}
          >
            Check Status
          </Link>
          {!hideStore && (
            <Link
              href="/store"
              className="text-sm font-medium transition-colors duration-150"
              style={{ color: "var(--mute)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--mute)")}
            >
              Store
            </Link>
          )}
        </div>

        {/* CTA */}
        <Link
          href="/submit"
          className="text-sm px-4 py-2 transition-all duration-150 font-medium"
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
            borderRadius: "var(--radius)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          Submit Project
        </Link>
      </nav>
    </header>
  );
}
