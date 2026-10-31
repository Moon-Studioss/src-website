"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Package, Search, X, Plus, Minus, Star } from "lucide-react";
import type { Product, ProductCategory } from "@/lib/db/schema";
import { formatPrice } from "@/lib/utils/helpers";

type CartItem = { product: Product; qty: number };

type Props = {
  products: Product[];
  categories: ProductCategory[];
  initialQuery?: string;
};

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999";

function buildWhatsAppMessage(items: CartItem[]): string {
  const lines = items.map(({ product, qty }) => `• ${product.name} × ${qty} — ${formatPrice(product.price * qty)}`);
  const total = items.reduce((sum, { product, qty }) => sum + product.price * qty, 0);
  return encodeURIComponent(
    `Hi! I'd like to order the following components from SRC e-solutions:\n\n${lines.join("\n")}\n\nTotal: ${formatPrice(total)}\n\nPlease confirm availability and delivery details. Thank you!`
  );
}

const HINT_KEY = "src-store-hint-seen";
const markHintSeen = () => {
  try { localStorage.setItem(HINT_KEY, "1"); } catch {}
};

const buzz = () => {
  try { navigator.vibrate?.(12); } catch {}
};

export function StoreClient({ products, categories, initialQuery = "" }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState(initialQuery);
  const [selectedCat, setSelectedCat] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [bump, setBump] = useState(0);
  const [flippedId, setFlippedId] = useState<string | null>(null); // only one card flipped at a time

  // First visit only: show "Tap a card to see details" briefly, then fade it out.
  // Marked as seen only once it has really been shown (fade-out or first card tap).
  const [hint, setHint] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(HINT_KEY)) return;
    } catch {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of localStorage after hydration
    setHint(true);
    const t = setTimeout(() => {
      setHint(false);
      markHintSeen();
    }, 3500);
    return () => clearTimeout(t);
  }, []);
  const showHint = hint && flippedId === null; // tapping a card means they got it

  // ─── Cart helpers ─────────────────────────────────────────────────
  const qtyOf = (id: string) => cart.find((i) => i.product.id === id)?.qty ?? 0;

  const changeQty = (product: Product, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (!existing) return delta > 0 ? [...prev, { product, qty: 1 }] : prev;
      return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0);
    });
    if (delta > 0) {
      buzz();
      setBump((b) => b + 1);
    }
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const sheetOpen = cartOpen && cartCount > 0;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(cart)}`, "_blank");
  };

  // ─── Filtering ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => {
        if (selectedCat !== "all" && p.category !== selectedCat) return false;
        if (inStockOnly && !p.inStock) return false;
        if (q && !p.name.toLowerCase().includes(q) && !(p.description ?? "").toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
      });
  }, [products, selectedCat, inStockOnly, search]);

  const chip = (active: boolean) =>
    `press shrink-0 h-9 px-4 rounded-full text-sm font-semibold border transition-colors ${
      active ? "bg-[var(--ink)] text-white border-[var(--ink)]" : "bg-white text-[var(--ink)] border-[var(--rule)]"
    }`;

  return (
    <div className="pt-14 pb-24 md:pb-28">
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-12 pb-4">
        <h1 className="font-display text-4xl md:text-6xl font-extrabold text-[var(--ink)] leading-[1.05]">Parts for your project</h1>
        <p className="mt-2 text-[var(--mute)] max-w-[44ch]">Sensors, boards and modules. Add what you need and send the order on <span className="hl font-semibold text-[var(--ink)]">WhatsApp</span>.</p>
      </section>

      {/* Search + categories stay reachable while scrolling */}
      <div className="sticky top-0 md:top-14 z-30 bg-[var(--paper)]/95 border-b border-[var(--rule)]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex flex-col gap-3">
          <label className="relative block">
            <span className="sr-only">Search components</span>
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
            <input
              type="search"
              placeholder="Search: ESP32, servo, sensor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-full border border-[var(--rule)] bg-white text-[15px] outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)]"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <button onClick={() => setInStockOnly((v) => !v)} aria-pressed={inStockOnly} className={chip(inStockOnly)}>
              In stock only
            </button>
            <span className="w-px shrink-0 bg-[var(--rule)] my-1" aria-hidden />
            <button onClick={() => setSelectedCat("all")} aria-pressed={selectedCat === "all"} className={chip(selectedCat === "all")}>All</button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setSelectedCat(c.name)} aria-pressed={selectedCat === c.name} className={chip(selectedCat === c.name)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6">
        {filtered.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-[var(--rule)] bg-white">
            <Package size={40} className="mx-auto mb-3 text-[var(--rule)]" />
            <p className="font-semibold text-[var(--ink)]">Nothing matches {search ? `“${search}”` : "these filters"}</p>
            <button
              onClick={() => { setSearch(""); setSelectedCat("all"); setInStockOnly(false); }}
              className="press mt-4 h-10 px-5 rounded-full border border-[var(--ink)] text-sm font-semibold"
            >
              Show all parts
            </button>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {showHint && (
                <motion.p
                  key="hint"
                  className="text-[15px] font-bold text-[var(--ink)] overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 14 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
                  transition={{ duration: 0.35 }}
                >
                  <span className="hl">Tap a card to see details</span>
                </motion.p>
              )}
            </AnimatePresence>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {filtered.map((p) => (
                <FlipCard key={p.id} product={p} qty={qtyOf(p.id)} onQty={(d) => changeQty(p, d)} flipped={flippedId === p.id} onFlip={() => {
                  markHintSeen();
                  setFlippedId((id) => (id === p.id ? null : p.id));
                }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Cart bar: sits just above the bottom tab bar on phones */}
      <AnimatePresence>
        {cartCount > 0 && !sheetOpen && (
          <motion.button
            key="cartbar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed z-40 left-4 right-4 md:left-auto md:right-6 md:w-96 bottom-[calc(var(--tab-h)+env(safe-area-inset-bottom,0px)+12px)] md:bottom-6 h-14 rounded-2xl bg-[var(--ink)] text-white px-5 flex items-center justify-between font-semibold"
            style={{ boxShadow: "0 16px 32px -16px rgb(22 35 58 / .7)" }}
          >
            <span className="flex items-center gap-3">
              <motion.span key={bump} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="grid place-items-center w-8 h-8 rounded-full bg-[var(--hi)] text-[var(--ink)] text-sm font-bold">
                {cartCount}
              </motion.span>
              {formatPrice(cartTotal)}
            </span>
            <span className="inline-flex items-center gap-1.5">View cart <ShoppingBag size={18} /></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart sheet: slides up on phones, from the right on desktop */}
      <AnimatePresence>
        {sheetOpen && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-stretch md:justify-end" role="dialog" aria-modal="true" aria-label="Your cart">
            <motion.div
              className="absolute inset-0 bg-[var(--ink)]/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              className="relative w-full md:max-w-sm max-h-[85vh] md:max-h-none md:h-full bg-white rounded-t-3xl md:rounded-none flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="md:hidden mx-auto mt-2 w-10 h-1.5 rounded-full bg-[var(--rule)]" aria-hidden />
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--rule)]">
                <h2 className="font-display text-xl font-extrabold text-[var(--ink)]">Your cart ({cartCount})</h2>
                <button onClick={() => setCartOpen(false)} aria-label="Close cart" autoFocus className="press grid place-items-center w-10 h-10 rounded-full hover:bg-[var(--paper-2)]">
                  <X size={20} />
                </button>
              </div>
              <ul className="flex-1 overflow-y-auto divide-y divide-[var(--rule)]">
                {cart.map(({ product, qty }) => {
                  const img = (product.images as string[] | null)?.[0];
                  return (
                    <li key={product.id} className="flex gap-4 px-5 py-4 items-center">
                      <div className="w-14 h-14 rounded-xl bg-[var(--paper-2)] overflow-hidden grid place-items-center shrink-0">
                        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Package size={22} className="text-[var(--mute)]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--ink)] truncate">{product.name}</p>
                        <p className="text-sm text-[var(--mute)]">{formatPrice(product.price * qty)}</p>
                      </div>
                      <Stepper qty={qty} onQty={(d) => changeQty(product, d)} name={product.name} />
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-[var(--rule)] px-5 pt-4 space-y-3" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
                <div className="flex justify-between items-baseline">
                  <span className="text-[var(--mute)]">Total</span>
                  <span className="font-display text-2xl font-extrabold text-[var(--ink)]">{formatPrice(cartTotal)}</span>
                </div>
                <button onClick={handleWhatsApp} className="press w-full h-13 py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-base">
                  Send order on WhatsApp
                </button>
                <p className="text-xs text-center text-[var(--mute)]">WhatsApp opens with your order typed in. We confirm stock and delivery there.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stepper({ qty, onQty, name, onYellow = false }: { qty: number; onQty: (delta: number) => void; name: string; onYellow?: boolean }) {
  return (
    <div className={`flex items-center h-9 rounded-full ${onYellow ? "bg-[var(--ink)] text-[var(--hi)]" : "bg-[var(--hi)] text-[var(--ink)]"}`} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => onQty(-1)} aria-label={`Remove one ${name}`} className="press grid place-items-center w-9 h-9"><Minus size={16} /></button>
      <span className="w-5 text-center text-sm font-bold tabular" aria-live="polite">{qty}</span>
      <button onClick={() => onQty(1)} aria-label={`Add one more ${name}`} className="press grid place-items-center w-9 h-9"><Plus size={16} /></button>
    </div>
  );
}

// ─── Product card: tap to flip for details, Add works on both sides ──
function FlipCard({ product, qty, onQty, flipped, onFlip }: {
  product: Product; qty: number; onQty: (delta: number) => void; flipped: boolean; onFlip: () => void;
}) {
  const img = (product.images as string[] | null)?.[0];

  const action = (onYellow = false) => product.inStock ? (
    qty > 0 ? (
      <Stepper qty={qty} onQty={onQty} name={product.name} onYellow={onYellow} />
    ) : (
      <button
        onClick={(e) => { e.stopPropagation(); onQty(1); }}
        aria-label={`Add ${product.name} to cart`}
        className={`press h-9 px-3 rounded-full text-sm font-bold inline-flex items-center gap-1 ${onYellow ? "bg-[var(--ink)] text-[var(--hi)]" : "bg-[var(--hi)] text-[var(--ink)]"}`}
      >
        <Plus size={16} /> Add
      </button>
    )
  ) : (
    <span className="text-xs font-semibold text-[var(--mute)]">Out of stock</span>
  );

  const priceRow = (
    <div className="mt-auto pt-2 flex items-center justify-between gap-2">
      <div>
        <p className="font-bold text-[var(--ink)] leading-none">{formatPrice(product.price)}</p>
        <p className="text-[10px] text-[var(--mute)] mt-0.5">incl. GST</p>
      </div>
      {action()}
    </div>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${product.name}. ${flipped ? "Showing details" : "Tap for details"}`}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onFlip();
        }
      }}
      className={`group cursor-pointer [perspective:900px] rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-[var(--hi)] transition-transform duration-300 ease-out ${product.inStock ? "hover:-translate-y-1.5" : ""}`}
    >
      <div
        className="grid transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? "rotateY(180deg)" : "none" }}
      >
        {/* Front (inert while flipped, so only the visible face is clickable/tabbable) */}
        <div inert={flipped} className={`[grid-area:1/1] [backface-visibility:hidden] bg-white rounded-2xl border border-[var(--rule)] p-2.5 flex flex-col transition-shadow duration-300 ${product.inStock ? "group-hover:shadow-[0_18px_30px_-14px_rgb(22_35_58/0.35)]" : "opacity-70"}`}>
          <div className="relative aspect-square rounded-xl bg-[var(--paper-2)] overflow-hidden grid place-items-center">
            {img ? <img src={img} alt="" className={`w-full h-full object-cover transition-transform duration-500 ease-out ${product.inStock ? "group-hover:scale-110" : "grayscale"}`} loading="lazy" /> : <Package size={32} className="text-[var(--rule)]" />}
            {product.featured && (
              <span className="absolute top-2 left-2 grid place-items-center w-7 h-7 rounded-full bg-white border border-[var(--rule)]" title="Popular">
                <Star size={13} className="text-[var(--gold)] fill-[var(--gold)]" />
              </span>
            )}
          </div>
          <h3 className="mt-2.5 text-sm font-semibold text-[var(--ink)] leading-snug line-clamp-2 min-h-[2.5em]">{product.name}</h3>
          {priceRow}
        </div>

        {/* Back */}
        <div inert={!flipped} className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[var(--hi)] text-[var(--ink)] rounded-2xl p-3.5 flex flex-col" style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / .55)" }}>
          <div className="flex flex-col items-start gap-1.5">
            <h3 className="text-sm font-bold leading-snug text-[var(--ink)]">{product.name}</h3>
            {product.category && (
              <span className="px-2.5 py-0.5 rounded-full bg-white text-black text-[11px] font-bold leading-relaxed">{product.category}</span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-[var(--ink)]/80 line-clamp-[7] overflow-hidden">
            {product.description || "Ask us on WhatsApp for full specs of this part."}
          </p>
          <p className="mt-2 text-xs font-semibold" style={{ color: product.inStock ? "var(--go)" : "#B42318" }}>
            {product.inStock ? "In stock" : "Out of stock"}
          </p>
          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
            <p className="font-bold leading-none">{formatPrice(product.price)}</p>
            {action(true)}
          </div>
        </div>
      </div>
    </div>
  );
}
