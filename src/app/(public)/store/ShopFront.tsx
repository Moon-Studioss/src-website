"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Cpu, IndianRupee, MessageCircle, PackageCheck, ShoppingCart } from "lucide-react";
import type { Product, ProductCategory } from "@/lib/db/schema";
import { CATEGORY_ART, filterSort, noFilters, searchProducts, sectionOf, type Section } from "@/lib/store";
import { PrintIcon } from "@/components/PrintIcon";
import { useStore } from "./StoreContext";
import { CatalogView } from "./CatalogView";
import { ProductCard } from "./ProductCard";

// The order route, same visual language as the landing page's project tracker.
// Step 2 is the one that matters (it is where the order happens), so it alone is yellow.
const STEPS = [
  { icon: ShoppingCart, title: "Add parts to your cart", sub: "Pick what you need" },
  { icon: MessageCircle, title: "Send the order on WhatsApp", sub: "Your cart is typed in for you", key: true },
  { icon: PackageCheck, title: "We confirm stock and delivery", sub: "Cost is shared in the chat" },
  { icon: IndianRupee, title: "Pay in the chat", sub: "We dispatch after payment" },
];

// The two store tabs. Each swaps the heading and line under it; products are split by their category's section.
const SECTIONS: { id: Section; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }>; title: string; sub: string }[] = [
  { id: "parts", label: "Components", icon: Cpu, title: "Parts for your project", sub: "Sensors, boards and modules." },
  { id: "3d", label: "3D Print", icon: PrintIcon, title: "3D printing for your project", sub: "Printers, filament and printed parts." },
];

// Pill switch above the heading. ?s=3d keeps the tab in the URL (shareable, survives refresh);
// the native History API swaps it with no server round trip, like the product popup's ?p=.
function SectionToggle({ section }: { section: Section }) {
  const pick = (id: Section) => {
    const params = new URLSearchParams(window.location.search);
    if (id === "3d") params.set("s", "3d"); else params.delete("s");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  };
  return (
    <div role="group" aria-label="Store section" className="relative grid grid-cols-2 w-full md:w-[24rem] h-12 md:h-14 p-1 rounded-full border border-[var(--rule)] bg-white shadow-[0_10px_30px_-22px_rgb(22_35_58/.5)]">
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-[var(--hi)] transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
        style={{ transform: section === "3d" ? "translateX(100%)" : "none" }}
      />
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={section === id}
          onClick={() => pick(id)}
          className={`press relative z-10 flex items-center justify-center gap-2 rounded-full text-sm md:text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] transition-colors ${section === id ? "text-[var(--ink)]" : "text-[var(--mute)] hover:text-[var(--ink)]"}`}
        >
          <Icon size={18} strokeWidth={2.2} />{label}
        </button>
      ))}
    </div>
  );
}

function Row({ title, items, href }: { title: string; items: Product[]; href?: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4 mb-3">
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-[var(--ink)]">{title}</h2>
        {href && <Link href={href} className="shrink-0 text-sm font-semibold text-[var(--ink)] underline underline-offset-4">See all</Link>}
      </div>
      {/* padding gives the hover lift and card shadow room inside the scroller */}
      <ul className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 md:mx-0 md:px-0 pt-2 pb-6 -mb-2">
        {items.map((p) => (
          <li key={p.id} className="snap-start shrink-0 w-44 md:w-48"><ProductCard product={p} /></li>
        ))}
        {href && (
          <li className="snap-start shrink-0 w-44 md:w-48">
            <Link href={href} className="press group h-full min-h-[200px] flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--hi)] text-[var(--ink)] p-3 text-center">
              <span className="grid place-items-center w-12 h-12 rounded-full bg-[var(--ink)] text-[var(--hi)] transition-transform group-hover:translate-x-1"><ArrowRight size={22} /></span>
              <span className="font-display text-lg font-extrabold leading-tight">See all</span>
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}

function CategoryTile({ c, count, photo }: { c: ProductCategory; count: number; photo?: string }) {
  const art = !c.image && c.slug ? CATEGORY_ART[c.slug] : undefined;
  const label = (
    <>
      <p className="mt-1.5 md:mt-2 text-[13px] md:text-sm font-semibold text-[var(--ink)] leading-tight">{c.name}</p>
      <p className="hidden md:block text-xs text-[var(--mute)]">{count} part{count === 1 ? "" : "s"}</p>
    </>
  );

  // Cut-out art floats above the name: no box. On hover (or keyboard focus) a soft yellow glow
  // blooms behind it and the part lifts and grows a little.
  if (art) {
    return (
      <Link href={`/store/c/${c.slug}`} className="press group block text-center outline-none">
        <div className="relative aspect-[16/10] md:aspect-[4/3]">
          <span
            aria-hidden
            className="absolute -inset-x-[12%] -inset-y-[8%] rounded-full opacity-0 scale-75 transition duration-300 ease-out group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100"
            style={{ background: "radial-gradient(closest-side, rgb(255 212 59 / .85), rgb(255 226 110 / .45) 55%, transparent)", filter: "blur(6px)" }}
          />
          <img
            src={art}
            alt=""
            loading="lazy"
            className="relative h-full w-full object-contain p-[5%] drop-shadow-[0_10px_8px_rgb(22_35_58/.22)] transition duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.1] group-hover:drop-shadow-[0_18px_12px_rgb(22_35_58/.26)] group-focus-visible:-translate-y-1.5 group-focus-visible:scale-[1.1]"
          />
        </div>
        {label}
      </Link>
    );
  }

  // No art for this category (e.g. one the owner just added): boxed product photo, or a letter
  const boxed = c.image ?? photo;
  return (
    <Link href={`/store/c/${c.slug}`} className="press group block">
      <div className="aspect-[16/10] md:aspect-[4/3] rounded-2xl bg-[var(--paper-2)] border border-[var(--rule)] overflow-hidden grid place-items-center">
        {boxed
          ? <img src={boxed} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          : <span aria-hidden className="font-display text-4xl md:text-5xl font-extrabold text-[var(--rule)]">{c.name.slice(0, 1)}</span>}
      </div>
      {label}
    </Link>
  );
}


// Phones only: a one-row carousel. The tile in the middle pops up on a soft yellow glow,
// the others shrink and blur. Tapping a side tile centres it; tapping the centred one opens it.
function CategoryCarousel({ items, tileImages }: { items: { c: ProductCategory }[]; tileImages: Record<string, string> }) {
  const ref = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = 0; // starts on the first category
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = el.scrollLeft + el.clientWidth / 2;
        let best = 0, d = Infinity;
        Array.from(el.children).forEach((li, i) => {
          const o = li as HTMLElement;
          const dist = Math.abs(o.offsetLeft + o.offsetWidth / 2 - mid);
          if (dist < d) { d = dist; best = i; }
        });
        setActive(best);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const centre = (i: number) => {
    const el = ref.current, li = el?.children[i] as HTMLElement | undefined;
    if (el && li) el.scrollTo({ left: li.offsetLeft + li.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" });
  };

  return (
    <ul ref={ref} className="md:hidden flex items-center overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 py-5" style={{ paddingInline: "calc(50% - 4.5rem)" }}>
      {items.map(({ c }, i) => {
        const on = i === active;
        const src = c.image ?? (c.slug ? CATEGORY_ART[c.slug] : undefined) ?? tileImages[c.id];
        return (
          <li key={c.id} className="snap-center shrink-0 w-36">
            <Link
              href={`/store/c/${c.slug}`}
              onClick={(e) => { if (!on) { e.preventDefault(); centre(i); } }}
              className="relative block text-center outline-none transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform"
              style={{ transform: on ? "translateY(-6px) scale(1.12)" : "scale(.78)", opacity: on ? 1 : .6, filter: on ? "none" : "blur(1.5px)" }}
            >
              <span
                aria-hidden
                className="absolute inset-x-[-10%] top-[-12%] h-[70%] rounded-full transition-opacity duration-500 ease-out"
                style={{ opacity: on ? 1 : 0, background: "radial-gradient(closest-side, rgb(255 226 110 / .9), rgb(255 238 160 / .45) 60%, transparent)", filter: "blur(8px)" }}
              />
              <div className="relative aspect-[4/3]">
                {src
                  ? <img src={src} alt="" loading="lazy" className="h-full w-full object-contain p-[4%] drop-shadow-[0_10px_8px_rgb(22_35_58/.22)]" />
                  : <span aria-hidden className="grid h-full place-items-center font-display text-4xl font-extrabold text-[var(--rule)]">{c.name.slice(0, 1)}</span>}
              </div>
              <p className="relative mt-1 text-[13px] font-semibold text-[var(--ink)] leading-tight">{c.name}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// /store: the shop front. With ?q= it shows search results instead.
export function ShopFront() {
  const { products: allProducts, categories, tileImages } = useStore();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const section: Section = params.get("s") === "3d" ? "3d" : "parts";
  const copy = SECTIONS.find((s) => s.id === section)!;

  if (q) {
    return (
      <CatalogView
        key={q}
        title={`Results for “${q}”`}
        crumb={<Link href="/store" className="text-sm font-semibold text-[var(--mute)] hover:text-[var(--ink)]">← All parts</Link>}
        products={searchProducts(allProducts, q)}
      />
    );
  }

  // Everything below shows only this tab's products (search above covers both tabs)
  const products = allProducts.filter((p) => sectionOf(p, categories) === section);

  const inStock = products.filter((p) => p.inStock);
  const featured = filterSort(inStock.filter((p) => p.featured), noFilters).slice(0, 8);
  const newest = filterSort(inStock, { ...noFilters, sort: "newest" }).slice(0, 8);
  const counted = categories
    .filter((c) => c.slug)
    .map((c) => ({ c, items: products.filter((p) => p.category === c.name) }))
    .filter((x) => x.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length);

  const picker = counted.length > 1;

  // Phones start the carousel on Microcontrollers
  const ordered = [...counted].sort((a, b) => Number(/^microcontroller/i.test(b.c.name)) - Number(/^microcontroller/i.test(a.c.name)));

  return (
    <>
      {/* First screen: everything a new visitor needs, filling the space under the sticky header
          (navbar 3.5rem + search 4.3rem = 7.8rem; phones also lose the tab bar).
          The product rows below are what they scroll to. */}
      {/* Top-aligned so the tab switch stays put when the other tab is shorter. A tab with only one
          category has no picker, so it drops the full-screen height and its rows follow straight on. */}
      <section className={`grid-texture-faint ${picker ? "min-h-[calc(100svh-var(--tab-h)-7.85rem)] md:min-h-[calc(100svh-4.3rem)]" : ""}`}>
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-10">
          <SectionToggle section={section} />
          <h1 className="mt-5 md:mt-8 font-display text-4xl md:text-6xl font-extrabold text-[var(--ink)] leading-[1.02]">{copy.title}</h1>
          <p className="mt-2 md:mt-3 text-[15px] text-[var(--mute)] md:text-lg max-w-[44ch]">{copy.sub} Add what you need and send the order on <span className="hl font-semibold text-[var(--ink)]">WhatsApp</span>.</p>

          <ol className="relative mt-4 md:mt-8 grid grid-cols-4 gap-2 md:gap-6 rounded-3xl border border-[var(--rule)] bg-white/90 px-2 py-4 md:px-8 md:py-7 shadow-[0_18px_40px_-28px_rgb(22_35_58/.45)]">
            {/* dashed route through the centres of the four nodes */}
            <span
              aria-hidden
              className="absolute left-[12.5%] right-[12.5%] top-[35px] md:top-[55px] h-[2px]"
              style={{ backgroundImage: "repeating-linear-gradient(90deg, color-mix(in srgb, var(--ink) 35%, transparent) 0 6px, transparent 6px 12px)" }}
            />
            {STEPS.map(({ icon: Icon, title, sub, key }, i) => (
              <li key={title} className="relative flex flex-col items-center text-center">
                <span
                  className={`relative grid place-items-center w-10 h-10 md:w-14 md:h-14 rounded-full ${key ? "route-now" : ""}`}
                  style={{ background: key ? "var(--hi)" : "#fff", border: key ? "none" : "2px solid var(--ink)", color: "var(--ink)" }}
                >
                  <Icon className="w-[18px] h-[18px] md:w-6 md:h-6" strokeWidth={2.2} />
                  <span aria-hidden className="absolute -top-1 -right-1 grid place-items-center w-[18px] h-[18px] md:w-6 md:h-6 rounded-full bg-[var(--ink)] text-[var(--hi)] text-[10px] md:text-xs font-bold ring-2 ring-white">{i + 1}</span>
                </span>
                <span className="sr-only">Step {i + 1}: </span>
                <p className="mt-2 md:mt-3 text-[12px] md:text-base font-semibold text-[var(--ink)] leading-tight">{title}</p>
                <p className="hidden md:block mt-1 text-sm text-[var(--mute)] leading-snug">{sub}</p>
              </li>
            ))}
          </ol>

          {/* One category alone needs no picker: its row below already shows everything */}
          {picker && (
            <div className="mt-4 md:mt-8">
              <h2 className="font-display text-2xl md:text-4xl font-extrabold text-[var(--ink)] mb-3 md:mb-5"><span className="hl">Shop by category</span></h2>
              <CategoryCarousel items={ordered} tileImages={tileImages} />
              {/* One column per category (max 8 a row), so an added category does not wrap alone */}
              <div className="hidden md:grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(counted.length, 8)}, minmax(0, 1fr))` }}>
                {counted.map(({ c, items }) => <CategoryTile key={c.id} c={c} count={items.length} photo={tileImages[c.id]} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {products.length === 0 ? (
          <p className="mt-16 text-center text-[var(--mute)]">{section === "3d" ? "No 3D Print items yet." : "No parts yet."} Check back soon.</p>
        ) : (
          <>
            <Row title="Popular right now" items={featured} />
            {/* With one category its own row already lists every item, newest included */}
            {picker && <Row title="New arrivals" items={newest} />}
            {counted.slice(0, 6).map(({ c, items }) => (
              <Row key={c.id} title={c.name} items={filterSort(items, noFilters).slice(0, 8)} href={`/store/c/${c.slug}`} />
            ))}
          </>
        )}
      </div>
    </>
  );
}
