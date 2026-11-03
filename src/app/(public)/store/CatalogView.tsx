"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/db/schema";
import { filterSort, noFilters, type Filters, type Sort } from "@/lib/store";
import { ProductCard } from "./ProductCard";

const SORTS: [Sort, string][] = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["name", "Name: A to Z"],
];

const numInput = "w-full h-10 rounded-lg border border-[var(--rule)] bg-white px-3 text-sm outline-none focus:border-[var(--ink)]";

// Product grid with filters and sort. Used by category pages and search results.
export function CatalogView({ title, crumb, products }: { title: string; crumb?: React.ReactNode; products: Product[] }) {
  const [f, setF] = useState<Filters>(noFilters);
  const [sheet, setSheet] = useState(false);
  const shown = useMemo(() => filterSort(products, f), [products, f]);

  const brands = useMemo(() => {
    const n = new Map<string, number>();
    for (const p of products) if (p.brand) n.set(p.brand, (n.get(p.brand) ?? 0) + 1);
    return [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [products]);

  const active = Number(f.inStockOnly) + Number(f.min != null || f.max != null) + f.brands.length;
  const reset = () => setF({ ...noFilters, sort: f.sort });
  const num = (v: string) => (v === "" ? null : Math.max(0, Number(v)));

  const panel = (
    <div className="space-y-6">
      <label className="flex items-center gap-2.5 text-[15px] font-semibold text-[var(--ink)] cursor-pointer">
        <input type="checkbox" className="w-4 h-4 accent-[var(--ink)]" checked={f.inStockOnly} onChange={(e) => setF({ ...f, inStockOnly: e.target.checked })} />
        In stock only
      </label>
      <fieldset>
        <legend className="text-sm font-bold text-[var(--ink)] mb-2">Price (₹)</legend>
        <div className="flex items-center gap-2">
          <label className="flex-1"><span className="sr-only">Minimum price</span>
            <input className={numInput} type="number" inputMode="numeric" min={0} placeholder="Min" value={f.min ?? ""} onChange={(e) => setF({ ...f, min: num(e.target.value) })} />
          </label>
          <span aria-hidden className="text-[var(--mute)]">to</span>
          <label className="flex-1"><span className="sr-only">Maximum price</span>
            <input className={numInput} type="number" inputMode="numeric" min={0} placeholder="Max" value={f.max ?? ""} onChange={(e) => setF({ ...f, max: num(e.target.value) })} />
          </label>
        </div>
      </fieldset>
      {brands.length > 0 && (
        <fieldset>
          <legend className="text-sm font-bold text-[var(--ink)] mb-2">Brand</legend>
          <div className="space-y-2">
            {brands.map(([b, n]) => (
              <label key={b} className="flex items-center gap-2.5 text-[15px] text-[var(--ink)] cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[var(--ink)]"
                  checked={f.brands.includes(b)}
                  onChange={(e) => setF({ ...f, brands: e.target.checked ? [...f.brands, b] : f.brands.filter((x) => x !== b) })}
                />
                {b} <span className="text-[var(--mute)]">({n})</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {active > 0 && <button type="button" onClick={reset} className="press text-sm font-semibold underline underline-offset-4">Clear filters</button>}
    </div>
  );

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
      {crumb}
      <h1 className="mt-1 font-display text-3xl md:text-5xl font-extrabold leading-[1.05] text-[var(--ink)]">{title}</h1>

      <div className="mt-6 flex gap-8 items-start">
        <aside aria-label="Filters" className="hidden lg:block w-56 shrink-0 sticky top-40 max-h-[calc(100svh-11rem)] overflow-y-auto pr-1">
          {panel}
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-[var(--mute)]">{shown.length} part{shown.length === 1 ? "" : "s"}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setSheet(true)} className="press lg:hidden h-10 px-4 rounded-full border border-[var(--rule)] bg-white text-sm font-semibold inline-flex items-center gap-2">
                <SlidersHorizontal size={16} /> Filters{active > 0 && <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-[var(--ink)] text-white text-xs">{active}</span>}
              </button>
              <label className="flex items-center gap-2 text-sm text-[var(--mute)]">
                <span className="hidden sm:inline">Sort by</span>
                <select
                  value={f.sort}
                  onChange={(e) => setF({ ...f, sort: e.target.value as Sort })}
                  className="h-10 rounded-full border border-[var(--rule)] bg-white px-3 text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                  aria-label="Sort by"
                >
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="py-20 text-center rounded-3xl border border-dashed border-[var(--rule)] bg-white">
              <Package size={40} className="mx-auto mb-3 text-[var(--rule)]" />
              <p className="font-semibold text-[var(--ink)]">{products.length === 0 ? "No parts here yet" : "Nothing matches these filters"}</p>
              {active > 0 && (
                <button onClick={reset} className="press mt-4 h-10 px-5 rounded-full border border-[var(--ink)] text-sm font-semibold">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-5">
              {shown.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* Phones: filters in a bottom sheet */}
      <AnimatePresence>
        {sheet && (
          <div className="fixed inset-0 z-[60] flex items-end lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.div className="absolute inset-0 bg-[var(--ink)]/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.div
              className="relative w-full max-h-[85vh] bg-white rounded-t-3xl flex flex-col"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--rule)]">
                <h2 className="font-display text-xl font-extrabold text-[var(--ink)]">Filters</h2>
                <button onClick={() => setSheet(false)} aria-label="Close filters" autoFocus className="press grid place-items-center w-10 h-10 rounded-full hover:bg-[var(--paper-2)]"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5">{panel}</div>
              <div className="px-5 pt-3 border-t border-[var(--rule)]" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
                <button onClick={() => setSheet(false)} className="press w-full h-12 rounded-2xl bg-[var(--ink)] text-white font-bold">Show {shown.length} part{shown.length === 1 ? "" : "s"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
