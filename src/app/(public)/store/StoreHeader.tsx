"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Package, Search, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/db/schema";
import { inr, suggestProducts } from "@/lib/store";
import { useStore } from "./StoreContext";

// Bold the part of the name that matches what was typed
function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (!query.trim() || i < 0) return <>{text}</>;
  const n = query.trim().length;
  return <>{text.slice(0, i)}<strong className="font-extrabold">{text.slice(i, i + n)}</strong>{text.slice(i + n)}</>;
}

// Search with a suggestion list of the store's own products (the browser's own history list is turned off).
// Pick a product → its popup opens. Enter with nothing picked → full results page.
function SearchBox({ q }: { q: string }) {
  const { products, openProduct } = useStore();
  const router = useRouter();
  const [text, setText] = useState(q);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // -1 = nothing highlighted
  const hits = suggestProducts(products, text);
  const showList = open && text.trim() !== "";
  const total = hits.length + 1; // products + the "See all results" row
  const optId = (i: number) => `store-search-opt-${i}`;

  const submit = () => {
    const v = text.trim();
    setOpen(false);
    router.push(v ? `/store?q=${encodeURIComponent(v)}` : "/store");
  };
  const pick = (p: Product) => {
    setOpen(false);
    setActive(-1);
    openProduct(p.slug ?? p.id);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!text.trim()) return;
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      // -1 is the text box itself; going past either end wraps through it
      setActive((a) => { const n = a + step; return n >= total ? -1 : n < -1 ? total - 1 : n; });
    } else if (e.key === "Enter" && showList && active >= 0 && active < hits.length) {
      e.preventDefault();
      pick(hits[active]);
    } else if (e.key === "Escape" && showList) {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <form
      role="search"
      className="relative flex-1 md:w-full"
      onSubmit={(e) => { e.preventDefault(); submit(); }}
    >
      <label className="sr-only" htmlFor="store-search">Search parts</label>
      <Search size={18} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
      <input
        id="store-search"
        name="q"
        type="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls="store-search-list"
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? optId(active) : undefined}
        value={text}
        onChange={(e) => { setText(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="Search: ESP32, servo, sensor…"
        className="w-full h-11 pl-11 pr-4 rounded-full border border-[var(--rule)] bg-white text-[15px] outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)]"
      />
      {showList && (
        // onMouseDown preventDefault keeps focus in the input, so the list does not close before the click lands
        <div
          className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl border border-[var(--rule)] bg-white shadow-[0_18px_40px_-16px_rgb(22_35_58/0.35)] overflow-hidden"
          onMouseDown={(e) => e.preventDefault()}
        >
          <ul id="store-search-list" role="listbox" aria-label="Matching parts" className="py-1.5">
            {hits.map((p, i) => {
              const img = (p.images as string[] | null)?.[0];
              return (
                <li
                  key={p.id}
                  id={optId(i)}
                  role="option"
                  aria-selected={active === i}
                  onClick={() => pick(p)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${active === i ? "bg-[var(--paper-2)]" : ""}`}
                >
                  <span className="grid place-items-center w-10 h-10 shrink-0 rounded-lg bg-[var(--paper-2)] overflow-hidden">
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" /> : <Package size={18} className="text-[var(--rule)]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-[var(--ink)]"><Highlight text={p.name} query={text} /></span>
                    <span className="block text-xs text-[var(--mute)] truncate">{p.category ?? "Part"}{p.inStock ? "" : " · Out of stock"}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-[var(--ink)] tabular">{inr(p.price)}</span>
                </li>
              );
            })}
            <li
              id={optId(hits.length)}
              role="option"
              aria-selected={active === hits.length}
              onClick={submit}
              onMouseEnter={() => setActive(hits.length)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer border-t border-[var(--rule)] ${hits.length ? "mt-1" : ""} ${active === hits.length ? "bg-[var(--paper-2)]" : ""}`}
            >
              <Search size={15} aria-hidden className="text-[var(--mute)]" />
              {hits.length
                ? <span className="text-[var(--ink)]">See all results for <strong>&ldquo;{text.trim()}&rdquo;</strong></span>
                : <span className="text-[var(--mute)]">No parts match <strong className="text-[var(--ink)]">&ldquo;{text.trim()}&rdquo;</strong>. Try a shorter word.</span>}
            </li>
          </ul>
          <p className="sr-only" aria-live="polite">{hits.length ? `${hits.length} matching part${hits.length === 1 ? "" : "s"}` : "No matching parts"}</p>
        </div>
      )}
    </form>
  );
}

// Sticks under the site navbar on every store page: search, cart, and the category strip.
export function StoreHeader() {
  const { categories, products, count, setCartOpen } = useStore();
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
          <SearchBox key={q} q={q} />
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
