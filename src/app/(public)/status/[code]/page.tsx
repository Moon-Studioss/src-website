import { db } from "@/lib/db";
import { requests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ProjectRoute, STAGES } from "@/components/ProjectRoute";

export const metadata = {
  title: "Track Project — SRC e-solutions",
};

// Admin saves "in_progress"; older code used "in-progress".
const stageIndex = (status: string) => STAGES.findIndex((s) => s.status === status.replace("-", "_"));

export default async function StatusPage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  if (!code.startsWith("SRC-")) return notFound();

  // Only what the student needs to see. No name, college or budget:
  // anyone who guesses a code could otherwise read them.
  const [req] = await db
    .select({ refCode: requests.refCode, title: requests.title, status: requests.status, deadline: requests.deadline, createdAt: requests.createdAt })
    .from(requests)
    .where(eq(requests.refCode, code))
    .limit(1);

  return (
    <div className="min-h-screen bg-[var(--paper)] grid-texture-faint">
      <Navbar />
      <div className="max-w-md mx-auto px-4 pt-20 md:pt-32 pb-16">
        {!req ? (
          <>
            <h1 className="font-display text-3xl font-extrabold text-[var(--ink)]">We couldn&apos;t find that code</h1>
            <p className="mt-3 text-[var(--mute)]">
              No request matches <span className="mono font-bold text-[var(--ink)]">{code}</span>. Check each character and try again.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/status" className="press h-12 rounded-full bg-[var(--ink)] text-white font-semibold grid place-items-center">Try another code</Link>
              <Link href="/submit" className="press h-12 rounded-full border border-[var(--rule)] bg-white text-[var(--ink)] font-semibold grid place-items-center">Submit a new request</Link>
            </div>
          </>
        ) : (
          <>
            <p className="mono text-sm font-semibold text-[var(--mute)]">Tracking {req.refCode}</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-[var(--ink)] break-words">{req.title}</h1>
            <p className="mt-2 text-sm text-[var(--mute)]">
              Sent {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              {", due "}{new Date(req.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>

            {req.status === "rejected" ? (
              <div className="mt-8 rounded-3xl border border-[var(--rule)] bg-white p-6">
                <h2 className="font-display text-2xl font-extrabold text-[var(--ink)]">Not this time</h2>
                <p className="mt-2 text-[var(--mute)]">
                  We couldn&apos;t take this project. We may be fully booked, or it wasn&apos;t the right fit. You&apos;re welcome to try again.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link href="/#ideas" className="press h-12 rounded-full bg-[var(--hi)] text-[var(--ink)] font-semibold grid place-items-center">Spin for another idea</Link>
                  <Link href="/submit" className="press h-12 rounded-full border border-[var(--rule)] text-[var(--ink)] font-semibold grid place-items-center">Submit a new request</Link>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-3xl border border-[var(--rule)] bg-white p-6">
                <ProjectRoute current={Math.max(0, stageIndex(req.status))} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
