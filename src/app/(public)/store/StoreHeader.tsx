"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingBag } from "lucide-react";
import { useStore } from "./StoreContext";

// Sticks under the site navbar on every store page: search, cart, and the category strip.
export function StoreHeader() {
  const { categories, products, count, setCartOpen } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const q = useSearchParams().get("q") ?? "";

  const inCategory = (name: string) => products.some((p) => p.category === name);
  const tabs = [{ href: "/store", label: "All parts", active: pathname === "/store" }]
    .concat(categories.filter((c) => c.slug && inCategory(c.name)).map((c) => ({ href: `/store/c/${c.slug}`, label: c.name, active: pathname === `/store/c/${c.slug}` })));

  const chip = (active: boolean) =>
    `press shrink-0 h-9 px-4 rounded-full text-sm font-semibold border grid place-items-center transition-colors ${
      active ? "bg-[var(--ink)] text-white border-[var(--ink)]" : "bg-white text-[var(--ink)] border-[var(--rule)] hover:border-[var(--ink)]"
    }`;

  // Search stays pinned under the navbar; the category strip only pins on desktop (phones need the room)
  return (
    <>
      <div className="sticky top-14 md:top-0 z-30 bg-[var(--paper)]/95 backdrop-blur border-b border-[var(--rule)]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3 md:grid md:grid-cols-[1fr_minmax(0,42rem)_1fr] md:gap-6">
          {/* Desktop: wordmark left, search centre, cart right */}
          <Link href="/" className="hidden md:flex items-baseline gap-1 select-none">
            <span className="font-display text-xl font-extrabold text-[var(--ink)]">SRC</span>
            <span className="text-base text-[var(--mute)] tracking-tight">e-solutions</span>
          </Link>
          {/* key={q} resets the box when the search changes from somewhere else */}
          <form
            key={q}
            role="search"
            className="relative flex-1 md:w-full"
            onSubmit={(e) => {
              e.preventDefault();
              const v = String(new FormData(e.currentTarget).get("q") ?? "").trim();
              router.push(v ? `/store?q=${encodeURIComponent(v)}` : "/store");
            }}
          >
            <label className="sr-only" htmlFor="store-search">Search parts</label>
            <Search size={18} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
            <input
              id="store-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search: ESP32, servo, sensor…"
              className="w-full h-11 pl-11 pr-4 rounded-full border border-[var(--rule)] bg-white text-[15px] outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)]"
            />
          </form>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            className="press relative grid place-items-center w-11 h-11 shrink-0 md:justify-self-end rounded-full border border-[var(--rule)] bg-white text-[var(--ink)] hover:border-[var(--ink)]"
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-[var(--hi)] text-[var(--ink)] text-xs font-bold">{count}</span>
            )}
          </button>
        </div>
      </div>
      {/* The shop front has its own "Shop by category" section, so the strip is only for the pages inside a category */}
      {categories.length > 0 && pathname !== "/store" && (
        <div className="md:sticky md:top-[4.25rem] md:z-30 bg-[var(--paper)] border-b border-[var(--rule)]">
          <nav aria-label="Categories" className="max-w-6xl mx-auto px-4 md:px-6 py-2.5 flex gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} aria-current={t.active ? "page" : undefined} className={chip(t.active)}>{t.label}</Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
