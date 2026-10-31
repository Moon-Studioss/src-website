import { ProjectRoute } from "./ProjectRoute";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--ink)]">How it works</h2>
        <p className="mt-2 mb-10 text-[var(--mute)] max-w-[52ch]">
          Your project travels this route. Track it anytime with your reference code.
          We take only projects we can deliver well, so not every request is accepted.
        </p>
        <ProjectRoute />
      </div>
    </section>
  );
}
