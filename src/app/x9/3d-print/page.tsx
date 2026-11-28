import { getSection } from "../store/actions";
import { StoreAdminClient } from "../store/StoreAdminClient";

export const dynamic = "force-dynamic";

// Same manager as /x9/store, scoped to the 3D Print tab of the store
export default async function Admin3dPrintPage() {
  const { products, categories } = await getSection("3d");
  return <StoreAdminClient section="3d" initialProducts={products} initialCategories={categories} />;
}
