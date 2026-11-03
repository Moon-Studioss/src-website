"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Package, Plus, X } from "lucide-react";
import type { Product } from "@/lib/db/schema";
import { inr, percentOff, whatsappLink } from "@/lib/store";
import { useStore, WHATSAPP_NUMBER } from "./StoreContext";
import { Stepper } from "./ProductCard";

// The "product page": opens over the store with a blurred background. Driven by ?p=<slug>.
export function ProductPopup() {
  const { products, popupSlug } = useStore();
  const product = popupSlug ? products.find((p) => p.slug === popupSlug || p.id === popupSlug) : undefined;
  return <AnimatePresence>{product && <Dialog key="dialog" product={product} />}</AnimatePresence>;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

function Dialog({ product }: { product: Product }) {
  const { closeProduct } = useStore();
  const panel = useRef<HTMLDivElement>(null);

  // Lock page scroll, move focus in, and give it back to whatever opened the popup
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); closeProduct(); return; }
    if (e.key !== "Tab" || !panel.current) return;
    const els = panel.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1], active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center md:p-6">
      <motion.div
        className="absolute inset-0 bg-[var(--ink)]/35 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={closeProduct}
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="relative w-full md:max-w-4xl h-[92vh] md:h-auto md:max-h-[88vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden outline-none"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={closeProduct}
          aria-label="Close"
          className="press absolute top-3 right-3 z-10 grid place-items-center w-10 h-10 rounded-full bg-white border border-[var(--rule)] text-[var(--ink)] hover:bg-[var(--paper-2)]"
        >
          <X size={20} />
        </button>
        <Body key={product.id} product={product} />
      </motion.div>
    </div>
  );
}

function Body({ product }: { product: Product }) {
  const { products, qtyOf, changeQty, setCartOpen, closeProduct, openProduct } = useStore();
  const images = (product.images as string[] | null) ?? [];
  const specs = product.specs ?? [];
  const highlights = product.highlights ?? [];
  const tabs = [product.description && "Description", specs.length > 0 && "Specifications"].filter(Boolean) as ("Description" | "Specifications")[];
  const [shot, setShot] = useState(0);
  const [tab, setTab] = useState<"Description" | "Specifications">(tabs[0] ?? "Description");
  const qty = qtyOf(product.id);
  const off = percentOff(product.price, product.mrp);
  const related = products
    .filter((p) => p.id !== product.id && p.category && p.category === product.category)
    .sort((a, b) => Number(b.inStock) - Number(a.inStock))
    .slice(0, 4);

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid md:grid-cols-2 gap-5 md:gap-8 p-4 pt-14 md:p-8 md:pt-8">
          {/* Photos */}
          <div>
            <div className="aspect-square rounded-2xl bg-[var(--paper-2)] overflow-hidden grid place-items-center">
              {images[shot] ? <img src={images[shot]} alt={product.name} className="w-full h-full object-contain" /> : <Package size={56} className="text-[var(--rule)]" />}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setShot(i)}
                    aria-label={`Photo ${i + 1}`}
                    aria-current={i === shot}
                    className={`press shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[var(--paper-2)] border-2 ${i === shot ? "border-[var(--ink)]" : "border-transparent"}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0">
            {(product.category || product.brand) && (
              <p className="text-sm text-[var(--mute)]">{[product.category, product.brand].filter(Boolean).join(" · ")}</p>
            )}
            <h2 id="popup-title" className="mt-1 font-display text-2xl md:text-3xl font-extrabold leading-tight text-[var(--ink)]">{product.name}</h2>
            {product.sku && <p className="mt-1 text-xs text-[var(--mute)]">SKU: {product.sku}</p>}

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-3xl font-extrabold text-[var(--ink)]">{inr(product.price)}</span>
              {off > 0 && product.mrp && (
                <>
                  <span className="text-[var(--mute)] line-through">{inr(product.mrp)}</span>
                  <span className="text-sm font-bold text-[var(--go)]">{off}% off</span>
                </>
              )}
            </div>
            <p className="text-xs text-[var(--mute)]">incl. GST</p>
            <p className="mt-2 text-sm font-semibold" style={{ color: product.inStock ? "var(--go)" : "#B42318" }}>
              {product.inStock ? "In stock" : "Out of stock"}
            </p>

            {highlights.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-[15px] text-[var(--ink)] list-disc pl-5 marker:text-[var(--gold)]">
                {highlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            )}

            {WHATSAPP_NUMBER && (
              <a
                href={whatsappLink(WHATSAPP_NUMBER, `Hi! I have a question about ${product.name}${product.sku ? ` (SKU: ${product.sku})` : ""}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink)] underline underline-offset-4"
              >
                <MessageCircle size={16} /> Ask about this part
              </a>
            )}
          </div>
        </div>

        {tabs.length > 0 && (
          <div className="px-4 md:px-8 pb-6">
            <div role="tablist" className="flex gap-6 border-b border-[var(--rule)]">
              {tabs.map((t) => (
                <button
                  key={t}
                  role="tab"
                  type="button"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`pb-2 -mb-px text-sm font-semibold border-b-2 ${tab === t ? "border-[var(--ink)] text-[var(--ink)]" : "border-transparent text-[var(--mute)]"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="pt-4">
              {tab === "Description" && product.description ? (
                <p className="text-[15px] leading-relaxed text-[var(--ink)]/85 whitespace-pre-line max-w-[65ch]">{product.description}</p>
              ) : (
                <dl className="divide-y divide-[var(--rule)] max-w-xl">
                  {specs.map((s, i) => (
                    <div key={i} className="flex gap-4 py-2 text-sm">
                      <dt className="w-40 shrink-0 text-[var(--mute)]">{s.label}</dt>
                      <dd className="text-[var(--ink)]">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="px-4 md:px-8 pb-8">
            <h3 className="font-display text-lg font-extrabold text-[var(--ink)]">More in {product.category}</h3>
            <ul className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map((p) => {
                const img = (p.images as string[] | null)?.[0];
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => openProduct(p.slug ?? p.id)} className="press block w-full text-left rounded-xl border border-[var(--rule)] p-2">
                      <div className="aspect-square rounded-lg bg-[var(--paper-2)] overflow-hidden grid place-items-center">
                        {img ? <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" /> : <Package size={24} className="text-[var(--rule)]" />}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-[var(--ink)] line-clamp-2 leading-snug">{p.name}</p>
                      <p className="mt-0.5 text-xs font-bold text-[var(--ink)]">{inr(p.price)}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* One ordering path: add to cart, then send the cart on WhatsApp */}
      <div className="border-t border-[var(--rule)] px-4 md:px-8 py-3 flex items-center gap-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        {!product.inStock ? (
          <p className="flex-1 text-sm text-[var(--mute)]">Out of stock right now. Ask on WhatsApp when it is back.</p>
        ) : qty > 0 ? (
          <>
            <Stepper qty={qty} onQty={(d) => changeQty(product, d)} name={product.name} />
            <button
              type="button"
              onClick={() => { closeProduct(); setCartOpen(true); }}
              className="press flex-1 h-11 rounded-full bg-[var(--ink)] text-white font-semibold"
            >
              View cart
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => changeQty(product, 1)}
            className="press flex-1 h-11 rounded-full bg-[var(--hi)] text-[var(--ink)] font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Plus size={18} /> Add to cart
          </button>
        )}
      </div>
    </>
  );
}
