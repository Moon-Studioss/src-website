"use server";

import { db, withRetry } from "@/lib/db";
import { products, productCategories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { uniqueSlug, type Spec } from "@/lib/store";

const refresh = () => {
  revalidatePath("/x9/store");
  revalidatePath("/store");
};

// Creates the category (with its URL name) if it is new; no-op if it exists.
async function ensureCategory(name: string) {
  const n = name.trim();
  if (!n) return;
  const rows = await withRetry(() => db.select({ name: productCategories.name, slug: productCategories.slug }).from(productCategories));
  if (rows.some((r) => r.name === n)) return;
  const slug = uniqueSlug(n, new Set(rows.map((r) => r.slug ?? "")));
  const [created] = await withRetry(() => db.insert(productCategories).values({ name: n, slug }).onConflictDoNothing().returning());
  return created;
}

// ─── Category Actions ─────────────────────────────────────────────

export async function getCategories() {
  await requireAdmin();
  return withRetry(() => db.select().from(productCategories).orderBy(asc(productCategories.name)));
}

export async function addCategory(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Category name is required" };
  const category = await ensureCategory(trimmed);
  if (!category) return { error: "Category already exists" };
  refresh();
  return { success: true, category };
}

export async function setCategoryImage(id: string, image: string) {
  await requireAdmin();
  await withRetry(() => db.update(productCategories).set({ image: image || null }).where(eq(productCategories.id, id)));
  refresh();
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await withRetry(() => db.delete(productCategories).where(eq(productCategories.id, id)));
  refresh();
}

// ─── Product Actions ──────────────────────────────────────────────

export async function getProducts() {
  await requireAdmin();
  return withRetry(() => db.select().from(products).orderBy(asc(products.name)));
}

type ProductInput = {
  name: string;
  description: string;
  price: number;           // rupees, from the form
  mrp: number | null;      // rupees, optional
  category: string;
  brand: string;
  sku: string;
  images: string[];
  highlights: string[];
  specs: Spec[];
  inStock: boolean;
  featured: boolean;
};

// Everything except slug / timestamps, shaped for the table (money in paise)
const fields = (data: ProductInput) => ({
  name: data.name,
  description: data.description || null,
  price: Math.round(data.price * 100),
  mrp: data.mrp && data.mrp > data.price ? Math.round(data.mrp * 100) : null,
  category: data.category.trim() || null,
  brand: data.brand.trim() || null,
  sku: data.sku.trim() || null,
  images: JSON.stringify(data.images) as any, // existing storage format, decoded by Drizzle on read
  highlights: data.highlights,
  specs: data.specs,
  inStock: data.inStock,
  featured: data.featured,
});

const takenSlugs = async () =>
  new Set((await withRetry(() => db.select({ slug: products.slug }).from(products))).map((r) => r.slug ?? ""));

export async function addProduct(data: ProductInput) {
  await requireAdmin();
  await ensureCategory(data.category);
  await withRetry(async () => db.insert(products).values({ ...fields(data), slug: uniqueSlug(data.name, await takenSlugs()) }));
  refresh();
}

export async function updateProduct(id: string, data: ProductInput) {
  await requireAdmin();
  await ensureCategory(data.category);
  // The slug is set once so links keep working after a rename; fill it in only if missing.
  const [current] = await withRetry(() => db.select({ slug: products.slug }).from(products).where(eq(products.id, id)));
  const slug = current?.slug ?? uniqueSlug(data.name, await takenSlugs());
  await withRetry(() => db.update(products).set({ ...fields(data), slug, updatedAt: new Date() }).where(eq(products.id, id)));
  refresh();
}

export async function toggleProductStock(id: string, inStock: boolean) {
  await requireAdmin();
  await withRetry(() => db.update(products).set({ inStock, updatedAt: new Date() }).where(eq(products.id, id)));
  refresh();
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  try {
    await withRetry(() => db.delete(products).where(eq(products.id, id)));
  } catch (error: any) {
    // Re-throw with the actual underlying error message so it shows up on the screen
    throw new Error(`Delete failed: ${error.message || error.toString()}`);
  }
  refresh();
}
