"use client";

import { Package, Plus, Minus, Star } from "lucide-react";
import type { Product } from "@/lib/db/schema";
import { formatPrice } from "@/lib/utils/helpers";
import { useStore } from "./StoreContext";
import { markHintSeen } from "./FlipHint";

export function Stepper({ qty, onQty, name, onYellow = false }: { qty: number; onQty: (delta: number) => void; name: string; onYellow?: boolean }) {
  return (
    <div className={`flex items-center h-9 rounded-full ${onYellow ? "bg-[var(--ink)] text-[var(--hi)]" : "bg-[var(--hi)] text-[var(--ink)]"}`} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => onQty(-1)} aria-label={`Remove one ${name}`} className="press grid place-items-center w-9 h-9"><Minus size={16} /></button>
      <span className="w-5 text-center text-sm font-bold tabular" aria-live="polite">{qty}</span>
      <button onClick={() => onQty(1)} aria-label={`Add one more ${name}`} className="press grid place-items-center w-9 h-9"><Plus size={16} /></button>
    </div>
  );
}

// Blue "i": opens the product popup. Stops the click so the card does not flip.
function InfoButton({ product, className }: { product: Product; className: string }) {
  const { openProduct } = useStore();
  return (
    <button
      type="button"
      aria-label={`Full details of ${product.name}`}
      onClick={(e) => { e.stopPropagation(); openProduct(product.slug ?? product.id); }}
      // before: grows the tap area to ~44px without growing the circle
      className={`press relative shrink-0 grid place-items-center w-7 h-7 rounded-full bg-[var(--cat-web)] text-white font-serif text-[16px] font-bold italic leading-none shadow-md before:content-[''] before:absolute before:-inset-2 ${className}`}
    >
      i
    </button>
  );
}

// ─── Product card: tap to flip for details, Add works on both sides ──
export function ProductCard({ product }: { product: Product }) {
  const { qtyOf, changeQty, flippedId, setFlippedId } = useStore();
  const qty = qtyOf(product.id);
  const flipped = flippedId === product.id;
  const onQty = (d: number) => changeQty(product, d);
  const onFlip = () => {
    markHintSeen();
    setFlippedId((id) => (id === product.id ? null : product.id));
  };
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
      className={`group h-full cursor-pointer [perspective:900px] rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-[var(--hi)] transition-transform duration-300 ease-out ${product.inStock ? "hover:-translate-y-1.5" : ""}`}
    >
      <div
        className="grid h-full grid-cols-[minmax(0,1fr)] transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? "rotateY(180deg)" : "none" }}
      >
        {/* Front (inert while flipped, so only the visible face is clickable/tabbable) */}
        <div inert={flipped} className={`min-w-0 [grid-area:1/1] [backface-visibility:hidden] bg-white rounded-2xl border border-[var(--rule)] p-2.5 flex flex-col transition-shadow duration-300 ${product.inStock ? "group-hover:shadow-[0_18px_30px_-14px_rgb(22_35_58/0.35)]" : "opacity-70"}`}>
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
        <div inert={!flipped} className="relative min-w-0 [grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[var(--hi)] text-[var(--ink)] rounded-2xl p-3.5 flex flex-col" style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / .55)" }}>
          <h3 className="text-sm font-bold leading-snug text-[var(--ink)] truncate">{product.name}</h3>
          <p className="mt-1.5 text-[13px] leading-snug text-[var(--ink)]/80 line-clamp-3">
            {product.description || "Ask us on WhatsApp for full specs of this part."}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs font-bold" style={{ color: product.inStock ? "var(--go)" : "#B42318" }}>
              {product.inStock ? "In stock" : "Out of stock"}
            </p>
            <InfoButton product={product} className="" />
          </div>
          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
            <p className="font-bold leading-none">{formatPrice(product.price)}</p>
            {action(true)}
          </div>
        </div>
      </div>
    </div>
  );
}
