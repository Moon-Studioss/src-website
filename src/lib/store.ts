// Pure store helpers (no DB, no React) so they can be self-checked: node src/lib/store.check.ts
import type { Product } from "./db/schema.ts";

export const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

// ─── Slugs ───────────────────────────────────────────────────────
export function slugify(name: string): string {
  return name.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "item";
}

/** slugify + "-2", "-3"… until it is not in `taken`. */
export function uniqueSlug(name: string, taken: Set<string>): string {
  const base = slugify(name);
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

// ─── Admin text <-> specs ("Label: Value" per line) ──────────────
export type Spec = { label: string; value: string };

export function parseSpecs(text: string): Spec[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).flatMap((l) => {
    const i = l.indexOf(":");
    return i > 0 && l.slice(i + 1).trim() ? [{ label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() }] : [];
  });
}
export const specsToText = (specs: Spec[] | null) => (specs ?? []).map((s) => `${s.label}: ${s.value}`).join("\n");
export const parseLines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

// ─── Price ───────────────────────────────────────────────────────
/** % off, only when the owner entered a real MRP above the price. */
export function percentOff(price: number, mrp: number | null): number {
  return mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
}

// ─── Filter + sort (category page and search results) ────────────
export type Sort = "featured" | "newest" | "price-asc" | "price-desc" | "name";
export type Filters = { inStockOnly: boolean; min: number | null; max: number | null; brands: string[]; sort: Sort };
export const noFilters: Filters = { inStockOnly: false, min: null, max: null, brands: [], sort: "featured" };

const byName = (a: Product, b: Product) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

export function filterSort(items: Product[], f: Filters): Product[] {
  const min = f.min == null ? null : f.min * 100; // inputs are rupees, prices are paise
  const max = f.max == null ? null : f.max * 100;
  const out = items.filter((p) =>
    (!f.inStockOnly || p.inStock) &&
    (min == null || p.price >= min) &&
    (max == null || p.price <= max) &&
    (f.brands.length === 0 || (p.brand != null && f.brands.includes(p.brand)))
  );
  const cmp: Record<Sort, (a: Product, b: Product) => number> = {
    // featured first, then in stock, then A-Z (the order the store always used)
    featured: (a, b) => Number(b.featured) - Number(a.featured) || Number(b.inStock) - Number(a.inStock) || byName(a, b),
    newest: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    name: byName,
  };
  return out.sort(cmp[f.sort]);
}

export function searchProducts(items: Product[], q: string): Product[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((p) => {
    const hay = [p.name, p.description, p.brand, p.sku, p.category].join(" ").toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

// ─── Category tiles ──────────────────────────────────────────────
/** Cut-out artwork (public/categories) for the shop-front tiles, keyed by category slug.
 *  A category without art falls back to a product photo, then a letter. */
export const CATEGORY_ART: Record<string, string> = {
  microcontrollers: "/categories/microcontrollers.webp",
  sensors: "/categories/sensors.webp",
  accessories: "/categories/accessories.webp",
  modules: "/categories/modules.webp",
  displays: "/categories/displays.webp",
  "motors-actuators": "/categories/motors-actuators.webp",
};

/** One random product photo per category, taken only from that category's own products.
 *  Categories whose products have no photo are left out. `rand` is injectable for the check. */
export function pickTileImages(categories: { id: string; name: string }[], items: Product[], rand: () => number = Math.random): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of categories) {
    const photos = items.filter((p) => p.category === c.name).map((p) => (p.images as string[] | null)?.[0]).filter((u): u is string => !!u);
    if (photos.length) out[c.id] = photos[Math.floor(rand() * photos.length)];
  }
  return out;
}

// ─── Cart ────────────────────────────────────────────────────────
export type SavedLine = { id: string; qty: number };
export type CartLine = { product: Product; qty: number };

/** Saved ids -> lines with the CURRENT product (price, stock). Removed / out-of-stock items drop out. */
export function reconcileCart(saved: SavedLine[], products: Product[]): CartLine[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return saved.flatMap(({ id, qty }) => {
    const product = byId.get(id);
    return product?.inStock && qty > 0 ? [{ product, qty: Math.min(Math.floor(qty), 99) }] : [];
  });
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const orderCode = () => "SRC-" + Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

export function orderMessage(lines: CartLine[], who: { name: string; address: string }, code: string): string {
  const total = lines.reduce((s, { product, qty }) => s + product.price * qty, 0);
  return [
    `New order ${code}`,
    ...lines.map(({ product, qty }) => `• ${product.name} × ${qty} — ${inr(product.price * qty)}`),
    `Items total: ${inr(total)}`,
    "",
    `Name: ${who.name.trim()}`,
    `Delivery: ${who.address.trim().replace(/\s*\n\s*/g, ", ")}`,
  ].join("\n");
}

export const whatsappLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
