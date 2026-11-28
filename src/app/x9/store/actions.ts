"use server";

import { db, withRetry } from "@/lib/db";
import { products, productCategories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { isDocLink, sectionOf, uniqueSlug, type Section, type Spec } from "@/lib/store";

const refresh = () => {
  revalidatePath("/x9/store");
  revalidatePath("/x9/3d-print");
  revalidatePath("/store");
};

const SECTION_NAME: Record<Section, string> = { parts: "Components", "3d": "3D Print" };

// Creates the category (with its URL name) in this section if it is new; no-op if it exists here.
// A name taken by the other tab is refused, or the product would silently land in that tab.
async function ensureCategory(name: string, section: Section) {
  const n = name.trim();
  if (!n) return;
  const rows = await withRetry(() => db.select({ name: productCategories.name, slug: productCategories.slug, section: productCategories.section }).from(productCategories));
  const existing = rows.find((r) => r.name === n);
  if (existing) {
    if (sectionOf({ category: n }, rows) !== section) throw new Error(`"${n}" is a ${SECTION_NAME[section === "3d" ? "parts" : "3d"]} category. Pick another name.`);
    return;
  }
  const slug = uniqueSlug(n, new Set(rows.map((r) => r.slug ?? "")));
  const [created] = await withRetry(() => db.insert(productCategories).values({ name: n, slug, section }).onConflictDoNothing().returning());
  return created;
}

/** Products and categories of one store tab, for that tab's admin page. */
export async function getSection(section: Section) {
  await requireAdmin();
  const [allProducts, allCategories] = await Promise.all([
    withRetry(() => db.select().from(products).orderBy(asc(products.name))),
    withRetry(() => db.select().from(productCategories).orderBy(asc(productCategories.name))),
  ]);
  return {
    products: allProducts.filter((p) => sectionOf(p, allCategories) === section),
    categories: allCategories.filter((c) => c.section === section),
  };
}

// ─── Category Actions ─────────────────────────────────────────────

export async function addCategory(name: string, section: Section) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Category name is required" };
  const category = await ensureCategory(trimmed, section);
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
  docUrl: string;          // Google Drive link, or ""
};

// Everything except slug / timestamps, shaped for the table (money in paise)
const fields = (data: ProductInput) => {
  const docUrl = data.docUrl.trim();
  if (!isDocLink(docUrl)) throw new Error("Document link must be a Google Drive or Google Docs link (https://drive.google.com/...)");
  return {
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
  docUrl: docUrl || null,
  };
};

const takenSlugs = async () =>
  new Set((await withRetry(() => db.select({ slug: products.slug }).from(products))).map((r) => r.slug ?? ""));

export async function addProduct(data: ProductInput, section: Section) {
  await requireAdmin();
  await ensureCategory(data.category, section);
  await withRetry(async () => db.insert(products).values({ ...fields(data), slug: uniqueSlug(data.name, await takenSlugs()) }));
  refresh();
}

export async function updateProduct(id: string, data: ProductInput, section: Section) {
  await requireAdmin();
  await ensureCategory(data.category, section);
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
