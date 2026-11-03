"use client";

import Link from "next/link";
import { useStore } from "./StoreContext";
import { CatalogView } from "./CatalogView";

export function CategoryView({ slug }: { slug: string }) {
  const { categories, products } = useStore();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return (
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-extrabold text-[var(--ink)]">We couldn&apos;t find that category</h1>
        <Link href="/store" className="press mt-5 inline-grid place-items-center h-11 px-6 rounded-full border border-[var(--ink)] font-semibold">See all parts</Link>
      </section>
    );
  }

  return (
    <CatalogView
      title={category.name}
      crumb={
        <nav aria-label="Breadcrumb" className="text-sm text-[var(--mute)]">
          <Link href="/store" className="font-semibold hover:text-[var(--ink)]">Store</Link> <span aria-hidden>›</span> <span>{category.name}</span>
        </nav>
      }
      products={products.filter((p) => p.category === category.name)}
    />
  );
}
