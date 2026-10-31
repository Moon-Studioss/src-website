import { Plus } from "lucide-react";

// TODO(client): confirm each answer matches what he actually offers.
const FAQ = [
  { q: "Do I get the source code?", a: "Tell us what you need in the form: source code, report, PPT or all three. We confirm exactly what you get before we start." },
  { q: "Will you help me understand the project for my viva?", a: "Mention it in the form. We confirm what explanation and support are included when we discuss your project." },
  { q: "How much does a project cost?", a: "It depends on the project and your deadline. Pick a budget range in the form, and we tell you the final price before any work starts." },
  { q: "What if my deadline is very close?", a: "Submit anyway and set the real deadline. If we can't do it well in that time, we tell you honestly instead of rushing it." },
  { q: "How do I know what's happening with my project?", a: "You get a reference code after submitting. Enter it on the Track page any time to see where your project is." },
];

export default function Faq() {
  return (
    <section className="py-16 md:py-20 bg-[var(--paper-2)] border-y border-[var(--rule)]">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--ink)] mb-6">Questions students ask</h2>
        <div className="flex flex-col gap-2">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group bg-white rounded-2xl border border-[var(--rule)] open:border-[var(--ink)]">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 font-semibold text-[var(--ink)] [&::-webkit-details-marker]:hidden">
                {q}
                <Plus size={18} className="shrink-0 transition-transform group-open:rotate-45" />
              </summary>
              <p className="px-5 pb-5 -mt-1 text-[15px] leading-relaxed text-[var(--mute)]">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
