import { Suspense } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { SubmitForm } from "./SubmitForm";

export const metadata = {
  title: "Submit a Project Request — SRC e-solutions",
};

// Focus mode: no tab bar here (see BottomTabBar), just a way out.
export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-1 select-none">
          <span className="font-display text-xl font-extrabold text-[var(--ink)]">SRC</span>
          <span className="text-base text-[var(--mute)] tracking-tight">e-solutions</span>
        </Link>
        <Link href="/" aria-label="Leave the form" className="press grid place-items-center w-10 h-10 rounded-full hover:bg-[var(--paper-2)] text-[var(--ink)]">
          <X size={20} />
        </Link>
      </header>
      <div className="max-w-2xl mx-auto px-6 pt-4 pb-6 md:py-12">
        <Suspense fallback={<div className="p-8 text-center text-sm">Loading form...</div>}>
          <SubmitForm />
        </Suspense>
      </div>
    </div>
  );
}
