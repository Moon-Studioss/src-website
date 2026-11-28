import { getSection } from "./actions";
import { StoreAdminClient } from "./StoreAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminStorePage() {
  const { products, categories } = await getSection("parts");
  return <StoreAdminClient section="parts" initialProducts={products} initialCategories={categories} />;
}
