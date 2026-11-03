import { db, withRetry } from "@/lib/db";
import { requests, attachments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatDaysLeft, CATEGORY_LABELS, BUDGET_LABELS } from "@/lib/utils/helpers";
import { RequestDetailClient } from "./RequestDetailClient";
import { getSettings } from "../settings-actions";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const reqId = resolvedParams.id;
  
  const reqs = await withRetry(() => db.select().from(requests).where(eq(requests.id, reqId)).limit(1));
  if (reqs.length === 0) {
    return notFound();
  }
  
  const req = reqs[0];

  if (req.status === "new") {
    await withRetry(() => db.update(requests).set({ status: "reviewing" }).where(eq(requests.id, req.id)));
    req.status = "reviewing";
  }

  const reqAttachments = await withRetry(() => db.select().from(attachments).where(eq(attachments.requestId, reqId)).orderBy(desc(attachments.createdAt)));

  const currentSettings = await getSettings();

  return (
    <div className="min-h-screen bg-[var(--paper-2)] pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:p-6 lg:p-8 pt-6 sm:pt-8">
        
        <div className="bg-white border-t-4 border-t-[var(--hi)] border rounded-2xl p-5 sm:p-10 shadow-sm relative overflow-hidden" style={{ borderColor: "var(--rule)", borderTopColor: "var(--hi)" }}>
          <RequestDetailClient request={req} attachments={reqAttachments} whatsappTemplate={currentSettings.whatsappTemplate} />
        </div>
      </div>
    </div>
  );
}
