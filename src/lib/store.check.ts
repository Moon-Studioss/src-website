// Self-check for the store helpers. Run: node src/lib/store.check.ts
import assert from "node:assert/strict";
import type { Product } from "./db/schema.ts";
import { filterSort, noFilters, orderMessage, parseSpecs, percentOff, pickTileImages, reconcileCart, searchProducts, slugify, uniqueSlug, whatsappLink } from "./store.ts";

const P = (o: Partial<Product>): Product => ({
  id: "x", name: "Item", description: null, price: 10000, category: null, images: [], inStock: true, featured: false,
  slug: null, sku: null, brand: null, mrp: null, highlights: [], specs: [], createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"), ...o,
});

// Slugs: readable, and clashes get a number
assert.equal(slugify("Motors & Actuators"), "motors-actuators");
assert.equal(slugify("16x2 LCD Display (Blue/Green)"), "16x2-lcd-display-blue-green");
assert.equal(slugify("!!!"), "item");
assert.equal(uniqueSlug("Servo", new Set(["servo", "servo-2"])), "servo-3");

// Specs text: lines without "Label: Value" are skipped; value may contain colons
assert.deepEqual(parseSpecs("Voltage: 5V\nbad line\nTime: 10:30\n: x"), [{ label: "Voltage", value: "5V" }, { label: "Time", value: "10:30" }]);

// Discount only with a real MRP above the price
assert.equal(percentOff(7500, 10000), 25);
assert.equal(percentOff(10000, 10000), 0);
assert.equal(percentOff(10000, null), 0);

// Filter + sort (price filter is in rupees, prices are paise)
const a = P({ id: "a", name: "Alpha", price: 5000, brand: "Arduino", featured: true });
const b = P({ id: "b", name: "Beta", price: 20000, brand: "Generic", inStock: false });
const c = P({ id: "c", name: "Gamma", price: 30000, brand: "Arduino", createdAt: new Date("2026-06-01") });
const all = [c, b, a];
assert.deepEqual(filterSort(all, noFilters).map((p) => p.id), ["a", "c", "b"]); // featured, in stock, then out of stock
assert.deepEqual(filterSort(all, { ...noFilters, inStockOnly: true }).map((p) => p.id), ["a", "c"]);
assert.deepEqual(filterSort(all, { ...noFilters, min: 40, max: 250, sort: "price-desc" }).map((p) => p.id), ["b", "a"]);
assert.deepEqual(filterSort(all, { ...noFilters, min: 100 }).map((p) => p.id), ["c", "b"]); // a is ₹50
assert.deepEqual(filterSort(all, { ...noFilters, brands: ["Arduino"], sort: "newest" }).map((p) => p.id), ["c", "a"]);

// Search needs every word, across name / brand / sku
assert.deepEqual(searchProducts([P({ name: "ESP32 Board", brand: "Espressif" }), a], "esp32 espressif").length, 1);
assert.equal(searchProducts(all, "  ").length, 3);

// Cart: always current price, drops removed and out-of-stock lines, clamps the quantity
const lines = reconcileCart([{ id: "a", qty: 2 }, { id: "b", qty: 1 }, { id: "gone", qty: 1 }, { id: "c", qty: 500 }], all);
assert.deepEqual(lines.map((l) => [l.product.id, l.qty]), [["a", 2], ["c", 99]]);

// Message
const msg = orderMessage([{ product: a, qty: 2 }], { name: " Rahul ", address: "12 MG Road\nVijayawada 520010" }, "SRC-A7K2");
assert.equal(msg, "New order SRC-A7K2\n• Alpha × 2 — ₹100\nItems total: ₹100\n\nName: Rahul\nDelivery: 12 MG Road, Vijayawada 520010");
assert.ok(whatsappLink("919876543210", msg).startsWith("https://wa.me/919876543210?text=New%20order%20SRC-A7K2"));

// Category tile photo: random, but only ever from that category's own products
const cats = [{ id: "c1", name: "Sensors" }, { id: "c2", name: "Modules" }, { id: "c3", name: "Empty" }, { id: "c4", name: "NoPhotos" }];
const shop = [
  P({ id: "1", category: "Sensors", images: ["s1.jpg", "s1b.jpg"] }), P({ id: "2", category: "Sensors", images: ["s2.jpg"] }),
  P({ id: "3", category: "Modules", images: ["m1.jpg"] }), P({ id: "4", category: "NoPhotos", images: [] }), P({ id: "5", category: "NoPhotos", images: null }),
];
assert.deepEqual(pickTileImages(cats, shop, () => 0), { c1: "s1.jpg", c2: "m1.jpg" }); // main photo only; Empty and NoPhotos are left out
assert.equal(pickTileImages(cats, shop, () => 0.99).c1, "s2.jpg");
for (let i = 0; i < 200; i++) { // never a photo from another category, and every photo gets picked eventually
  const t = pickTileImages(cats, shop);
  assert.ok(["s1.jpg", "s2.jpg"].includes(t.c1) && t.c2 === "m1.jpg");
}
assert.equal(new Set(Array.from({ length: 200 }, () => pickTileImages(cats, shop).c1)).size, 2);

console.log("store.check: ok");
