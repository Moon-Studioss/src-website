"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { WifiOff } from "lucide-react";

// Shown instead of a crash when a page can't load — usually the database
// (or the visitor's internet) was briefly unreachable. Lives at the app root
// so it also catches errors thrown by the (public) layout's settings check.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-svh grid-texture-faint grid place-items-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 grid place-items-center w-16 h-16 rounded-full bg-[var(--hi-soft)] text-[var(--ink)]">
          <WifiOff size={28} />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--ink)]">Can&apos;t reach the server</h1>
        <p className="mt-3 text-[var(--mute)]">
          Check your internet connection and try again. If it keeps happening, we&apos;re probably fixing it right now.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button type="button" onClick={() => retry()} className="spin-btn h-12 px-7 rounded-full text-[var(--ink)] font-semibold">
            Try again
          </button>
          <Link href="/" className="press h-12 px-7 rounded-full border border-[var(--rule)] bg-white text-[var(--ink)] font-semibold grid place-items-center">
            Go to home
          </Link>
        </div>
        {error.digest && <p className="mt-6 mono text-xs text-[var(--mute)]">Error code {error.digest}</p>}
      </div>
    </main>
  );
}
