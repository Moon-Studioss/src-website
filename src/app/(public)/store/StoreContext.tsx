"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product, ProductCategory } from "@/lib/db/schema";
import { reconcileCart, type CartLine, type SavedLine } from "@/lib/store";

// No fallback: a wrong number would send real orders to a stranger. Missing = ordering switched off.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

type Details = { name: string; address: string };
type Persisted = { cart: SavedLine[]; details: Details; ready: boolean };

type StoreCtx = {
  products: Product[];
  categories: ProductCategory[];
  ordersClosed: boolean; // admin "Can't take orders now" switch
  tileImages: Record<string, string>; // category id -> random photo of one of its own products
  lines: CartLine[];
  count: number;
  total: number;
  qtyOf: (id: string) => number;
  changeQty: (product: Product, delta: number) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  bump: number; // changes on every add, to animate the cart bar
  flippedId: string | null; // one card flipped at a time, across the whole store
  setFlippedId: (id: string | null | ((id: string | null) => string | null)) => void;
  details: Details;
  setDetails: (d: Details) => void;
  popupSlug: string | null;
  openProduct: (slug: string) => void;
  closeProduct: () => void;
};

const Ctx = createContext<StoreCtx | null>(null);
export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside <StoreProvider>");
  return c;
};

const KEY = "src-store";
const buzz = () => {
  try { navigator.vibrate?.(12); } catch {}
};

// Edits ?p=<slug> with the native History API: Next syncs useSearchParams, and there is no server round trip.
function setParam(slug: string | null, how: "pushState" | "replaceState") {
  const params = new URLSearchParams(window.location.search);
  if (slug) params.set("p", slug); else params.delete("p");
  const qs = params.toString();
  window.history[how](null, "", window.location.pathname + (qs ? `?${qs}` : ""));
}

export function StoreProvider({ products, categories, tileImages, ordersClosed, children }: { ordersClosed: boolean; products: Product[]; categories: ProductCategory[]; tileImages: Record<string, string>; children: React.ReactNode }) {
  const [saved, setSaved] = useState<Persisted>({ cart: [], details: { name: "", address: "" }, ready: false });
  const [cartOpen, setCartOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const popupSlug = useSearchParams().get("p");
  const pushed = useRef(false); // did we add a history entry for the popup? then Close = Back

  // Cart and delivery details survive a refresh. Read after hydration so server and client HTML match.
  useEffect(() => {
    let cart: SavedLine[] = [], details: Details = { name: "", address: "" };
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? "{}");
      if (Array.isArray(s.cart)) cart = s.cart.filter((l: SavedLine) => typeof l?.id === "string" && l.qty > 0);
      if (s.details) details = { name: String(s.details.name ?? ""), address: String(s.details.address ?? "") };
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of localStorage after hydration
    setSaved({ cart, details, ready: true });
  }, []);
  useEffect(() => {
    if (!saved.ready) return;
    try { localStorage.setItem(KEY, JSON.stringify({ cart: saved.cart, details: saved.details })); } catch {}
  }, [saved]);

  const lines = useMemo(() => reconcileCart(saved.cart, products), [saved.cart, products]);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0);

  const qtyOf = useCallback((id: string) => lines.find((l) => l.product.id === id)?.qty ?? 0, [lines]);

  const changeQty = useCallback((product: Product, delta: number) => {
    setSaved((s) => {
      const cur = s.cart.find((l) => l.id === product.id);
      const qty = Math.min(99, (cur?.qty ?? 0) + delta);
      const cart = cur
        ? s.cart.map((l) => (l.id === product.id ? { ...l, qty } : l)).filter((l) => l.qty > 0)
        : qty > 0 ? [...s.cart, { id: product.id, qty }] : s.cart;
      return { ...s, cart };
    });
    if (delta > 0) { buzz(); setBump((b) => b + 1); }
  }, []);

  const setDetails = useCallback((details: Details) => setSaved((s) => ({ ...s, details })), []);

  const openProduct = useCallback((slug: string) => {
    const already = new URLSearchParams(window.location.search).has("p");
    if (!already) pushed.current = true;
    setParam(slug, already ? "replaceState" : "pushState"); // swapping product inside the popup must not stack history
  }, []);
  const closeProduct = useCallback(() => {
    if (pushed.current) { pushed.current = false; window.history.back(); } else setParam(null, "replaceState");
  }, []);

  const value: StoreCtx = {
    products, categories, tileImages, ordersClosed, lines, count, total, qtyOf, changeQty, cartOpen, setCartOpen, bump,
    flippedId, setFlippedId, details: saved.details, setDetails, popupSlug, openProduct, closeProduct,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
