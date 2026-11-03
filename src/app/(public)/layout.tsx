import { getSettings } from "@/app/x9/settings-actions";
import { UnderConstruction } from "@/components/UnderConstruction";
import { BottomTabBar } from "@/components/BottomTabBar";

// Force Next.js to dynamically check settings on every request (prevents the page from being stuck on cached true/false)
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  // Site-wide switch: the whole public site is replaced by the error page
  if (settings.isUnderConstruction) {
    return <UnderConstruction hideStore={false} />;
  }

  return (
    <>
      {children}
      <BottomTabBar />
    </>
  );
}
