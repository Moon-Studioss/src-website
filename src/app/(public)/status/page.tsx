"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

// Code box with "SRC-" already typed; the student only types the 4 characters.
function StatusForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromLink = (searchParams.get("code") ?? "").toUpperCase().replace(/^SRC-?/, "");
  const [code, setCode] = useState(fromLink);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase().replace(/^SRC-?/, "");
    if (!clean) {
      setError("Type the characters after SRC- from your reference code.");
      return;
    }
    router.push(`/status/SRC-${clean}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label htmlFor="code" className="text-sm font-semibold text-[var(--ink)]">Your reference code</label>
      <div className="flex items-center h-16 rounded-2xl border-2 border-[var(--ink)] bg-white px-4 focus-within:ring-4 focus-within:ring-[var(--hi-soft)]">
        <span className="mono text-2xl font-bold text-[var(--mute)] select-none">SRC-</span>
        <input
          id="code"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
            setError("");
          }}
          placeholder="7K2M"
          maxLength={10}
          className="mono flex-1 min-w-0 bg-transparent text-2xl font-bold tracking-[0.15em] text-[var(--ink)] outline-none placeholder:text-[var(--rule)]"
          aria-describedby={error ? "code-error" : "code-hint"}
        />
      </div>
      {error ? (
        <p id="code-error" className="text-sm font-medium text-[var(--flag)]">{error}</p>
      ) : (
        <p id="code-hint" className="text-sm text-[var(--mute)]">You got this code on screen after submitting your request.</p>
      )}
      <button type="submit" className="press h-12 rounded-full bg-[var(--ink)] text-white font-semibold">
        Track my project
      </button>
    </form>
  );
}

export default function StatusIndexPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] grid-texture-faint">
      <Navbar />
      <div className="max-w-md mx-auto px-4 pt-20 md:pt-32 pb-16">
        <h1 className="font-display text-4xl font-extrabold text-[var(--ink)]">Where&apos;s my project?</h1>
        <p className="mt-2 mb-8 text-[var(--mute)]">Enter your code to see which stage your project is at.</p>
        <Suspense fallback={<div className="text-sm text-[var(--mute)]">Loading…</div>}>
          <StatusForm />
        </Suspense>
      </div>
    </div>
  );
}
