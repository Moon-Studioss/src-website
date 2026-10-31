import { getSettings } from "@/app/x9/settings-actions";
import { UnderConstruction } from "@/components/UnderConstruction";
import { BottomTabBar } from "@/components/BottomTabBar";
import { isStoreClosed } from "@/lib/utils/helpers";

// Force Next.js to dynamically check settings on every request (prevents the page from being stuck on cached true/false)
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  if (settings.isUnderConstruction) {
    return <UnderConstruction hideStore={isStoreClosed(settings)} />;
  }

  return (
    <>
      {children}
      <BottomTabBar hideStore={isStoreClosed(settings)} />
    </>
  );
}
