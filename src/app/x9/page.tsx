import { db, withRetry } from "@/lib/db";
import { requests } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { headers } from "next/headers";
import { RequestListClient } from "./RequestListClient";

import { getSettings } from "./settings-actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Silently trigger cleanup of rejected projects older than 3 months
  try {
    const host = (await headers()).get("host") ?? "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    fetch(`${protocol}://${host}/api/cleanup`, {
      headers: { "x-cleanup-secret": process.env.CLEANUP_SECRET ?? "" },
      cache: "no-store",
    }).catch(() => {}); // fire-and-forget, ignore errors
  } catch {}

  const allRequests = await withRetry(() => db.select().from(requests).orderBy(desc(requests.createdAt)));
  const currentSettings = await getSettings();

  return <RequestListClient initialRequests={allRequests} autoDeleteTimer={currentSettings.autoDeleteTimer} />;
}
