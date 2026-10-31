import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { count, desc, eq } from "drizzle-orm";
import { db, withRetry } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { formatPrice } from "@/lib/utils/helpers";

const DESKTOP_COUNT = 10; // products shown on desktop
const MOBILE_COUNT = 5;   // products shown on phones (the rest are hidden below md)

// Home page teaser for the component store: a sideways-scrolling row
// ending with a "View more" card that opens the full store.
export default async function PartsRow() {
  const [items, [{ total }]] = await Promise.all([
    withRetry(() =>
      db.select().from(products).where(eq(products.inStock, true)).orderBy(desc(products.featured), desc(products.createdAt)).limit(DESKTOP_COUNT)
    ),
    withRetry(() => db.select({ total: count() }).from(products).where(eq(products.inStock, true))),
  ]);
  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--ink)]">Need parts?</h2>
            <p className="mt-2 text-xl md:text-2xl font-bold text-[var(--ink)]"><span className="hl">Do It Yourself</span></p>
          </div>
          <Link href="/store" className="shrink-0 text-sm font-semibold text-[var(--ink)] underline underline-offset-4">Open store</Link>
        </div>
        <ul className="flex gap-3 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 md:mx-0 md:px-0 pb-1">
          {items.map((p, i) => {
            const img = (p.images as string[] | null)?.[0];
            return (
              <li key={p.id} className={`snap-start shrink-0 w-40 ${i >= MOBILE_COUNT ? "hidden md:block" : ""}`}>
                <Link href={`/store?q=${encodeURIComponent(p.name)}`} className="press block bg-white rounded-2xl border border-[var(--rule)] p-3 h-full">
                  <div className="aspect-square rounded-xl bg-[var(--paper-2)] overflow-hidden grid place-items-center mb-2">
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="text-xs text-[var(--mute)]">No photo</span>}
                  </div>
                  <p className="text-sm font-semibold text-[var(--ink)] line-clamp-2 leading-snug">{p.name}</p>
                  <p className="mt-1 text-sm font-bold text-[var(--ink)]">{formatPrice(p.price)}</p>
                </Link>
              </li>
            );
          })}
          <li className="snap-start shrink-0 w-40">
            <Link
              href="/store"
              className="press group h-full min-h-[220px] flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--hi)] text-[var(--ink)] p-3 text-center"
            >
              <span className="grid place-items-center w-12 h-12 rounded-full bg-[var(--ink)] text-[var(--hi)] transition-transform group-hover:translate-x-1">
                <ArrowRight size={22} />
              </span>
              <span className="font-display text-lg font-extrabold leading-tight">View more</span>
              <span className="text-xs font-semibold opacity-75">All {total} parts in the store</span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
