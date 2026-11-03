import { db, withRetry } from "@/lib/db";
import { products, productCategories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSettings } from "@/app/x9/settings-actions";
import { pickTileImages } from "@/lib/store";
import { StoreProvider } from "./StoreContext";
import { StoreHeader } from "./StoreHeader";
import { FlipHint } from "./FlipHint";
import { Cart } from "./Cart";
import { ConstructionPopup } from "@/components/ConstructionPopup";
import { ProductPopup } from "./ProductPopup";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Store — SRC e-solutions",
  description: "Buy electronic components, microcontrollers, sensors, modules and more from SRC e-solutions.",
};

// One fetch for the whole store (a few dozen rows): every page, the popup and the cart read it from context.
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  const [allProducts, allCategories] = await Promise.all([
    withRetry(() => db.select().from(products).orderBy(asc(products.name))),
    withRetry(() => db.select().from(productCategories).orderBy(asc(productCategories.name))),
  ]);

  return (
    <div className="min-h-screen bg-[var(--paper)] pt-14 md:pt-0">
      {/* Desktop has no navbar here: the logo lives in the store header instead */}
      <div className="md:hidden"><Navbar hideStore={false} /></div>
      {/* Picked here, on the server, once per page load: a refresh re-rolls each category's tile photo, with no hydration mismatch */}
      <StoreProvider ordersClosed={settings.isStoreUnderConstruction} products={allProducts} categories={allCategories} tileImages={pickTileImages(allCategories, allProducts)}>
        <StoreHeader />
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <FlipHint />
        </div>
        <div className="pb-28 md:pb-24">{children}</div>
        <Cart />
        <ProductPopup />
        {settings.isStoreUnderConstruction && <ConstructionPopup title="Orders Paused" text="Ordering is not available right now. Please try again later." bold />}
      </StoreProvider>
      <Footer />
    </div>
  );
}
