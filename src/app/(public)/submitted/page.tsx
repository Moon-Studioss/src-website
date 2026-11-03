import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { ConfettiOnMount } from "@/components/Confetti";

export const metadata = {
  title: "Request Submitted — SRC e-solutions",
};

export default async function SubmittedPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: rawCode } = await searchParams;
  const code = rawCode || "SRC-XXXX";

  return (
    <div className="min-h-screen bg-[var(--paper)] grid-texture-faint px-4 pt-16 md:pt-28 pb-16">
      <div className="relative max-w-md mx-auto">
        <ConfettiOnMount />
        <div className="rounded-3xl bg-white border border-[var(--rule)] overflow-hidden" style={{ boxShadow: "0 24px 48px -28px rgb(22 35 58 / .5)" }}>
          <div className="bg-[var(--hi)] px-6 py-5 flex items-center gap-3">
            <CircleCheck size={28} className="text-[var(--ink)]" />
            <h1 className="font-display text-2xl font-extrabold text-[var(--ink)]">Request sent!</h1>
          </div>
          <div className="p-6">
            <p className="text-sm font-semibold text-[var(--ink)]">Your reference code</p>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[var(--rule)] px-4 py-3">
              <span className="mono text-2xl font-bold tracking-[0.12em] text-[var(--ink)]">{code}</span>
              <CopyButton text={code} />
            </div>
            <p className="mt-3 text-sm text-[var(--mute)]">Take a screenshot or copy the code. You need it to track your project.</p>

            <div className="mt-6 pt-6 border-t border-dashed border-[var(--rule)] text-sm text-[var(--mute)] space-y-2">
              <p className="font-semibold text-[var(--ink)]">What happens next</p>
              <p>We read your request, usually within 2–3 working days. If we can take it, we call or WhatsApp you on the number you gave.</p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link href={`/status/${code}`} className="press h-12 rounded-full bg-[var(--ink)] text-white font-semibold grid place-items-center">
                Track my project
              </Link>
              <Link href="/store" className="press h-12 rounded-full border border-[var(--rule)] text-[var(--ink)] font-semibold grid place-items-center">
                Need parts while you wait? Visit the store
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
