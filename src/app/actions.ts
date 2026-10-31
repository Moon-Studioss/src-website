"use server";

import { db } from "@/lib/db";
import { requests, attachments } from "@/lib/db/schema";
import { generateRefCode } from "@/lib/utils/helpers";
import { or, eq, gte, and } from "drizzle-orm";
import { after } from "next/server";
import { sendEmail, newRequestAlert, requestConfirmation } from "@/lib/email";

export type SubmitResult =
  | { success: true; refCode: string }
  | { success: false; error: string };

export async function submitProjectRequest(formData: any): Promise<SubmitResult> {
  try {
    // ── 4-month cooldown check ──────────────────────────────────────
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    const existing = await db
      .select({ id: requests.id, createdAt: requests.createdAt })
      .from(requests)
      .where(
        and(
          or(
            eq(requests.phone, formData.phone),
            eq(requests.email, formData.email.toLowerCase())
          ),
          gte(requests.createdAt, fourMonthsAgo)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const submittedAt = new Date(existing[0].createdAt);
      const canResubmitAt = new Date(submittedAt);
      canResubmitAt.setMonth(canResubmitAt.getMonth() + 4);
      const canResubmitStr = canResubmitAt.toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric"
      });
      return {
        success: false,
        error: `You have already submitted a project request recently. You can submit again after ${canResubmitStr}.`,
      };
    }
    // ───────────────────────────────────────────────────────────────

    const refCode = generateRefCode();

    const [newRequest] = await db.insert(requests).values({
      refCode,
      studentName: formData.studentName,
      college: formData.college,
      phone: formData.phone,
      whatsapp: formData.whatsapp || formData.phone,
      email: formData.email.toLowerCase(),
      category: formData.category,
      title: formData.title,
      description: formData.description,
      deliverable: formData.deliverable,
      techNotes: formData.techNotes || null,
      branchAnswers: formData.branchAnswers || {},
      deadline: formData.deadline,
      budgetBand: formData.budgetBand,
      extraNotes: formData.extraNotes || null,
    }).returning({ id: requests.id });

    if (formData.files && formData.files.length > 0) {
      await db.insert(attachments).values(
        formData.files.map((file: any) => ({
          requestId: newRequest.id,
          storageKey: file.key ?? file.url,
          fileUrl: file.url,
          fileName: file.name,
          sizeBytes: file.size,
        }))
      );
    }

    // ── Emails (Resend): alert to the owner + confirmation to the student.
    // Sent after the response so the student never waits on email.
    const email = formData.email.toLowerCase();
    after(() =>
      Promise.all([
        sendEmail({ to: process.env.OWNER_EMAIL ?? "", ...newRequestAlert({ ...formData, refCode, email }) }),
        sendEmail({ to: email, ...requestConfirmation({ refCode, studentName: formData.studentName, title: formData.title }) }),
      ])
    );

    return { success: true, refCode };
  } catch (error: any) {
    console.error("Submission failed:", error);
    console.error("Error Code:", error.code);
    console.error("Error Detail:", error.detail);
    console.error("Error Message:", error.message);
    return { success: false, error: error.message || "Failed to submit request" };
  }
}
