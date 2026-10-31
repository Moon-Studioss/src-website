import Link from "next/link";

export default function CTABand() {
  return (
    <section className="py-16 md:py-20 bg-[var(--ink)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white max-w-[18ch]">Deadline coming? Start in 3 minutes.</h2>
        <p className="mt-3 mb-8 text-white/60 max-w-[48ch]">One form with your idea, deadline and budget. We read every request and reply to the ones we can take.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/submit" className="press h-12 px-6 rounded-full bg-[var(--hi)] text-[var(--ink)] font-semibold grid place-items-center">
            Submit your project
          </Link>
          <Link href="/#ideas" className="press h-12 px-6 rounded-full border border-white/25 text-white font-semibold grid place-items-center">
            Spin for an idea
          </Link>
        </div>
      </div>
    </section>
  );
}
