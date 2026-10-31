const STACK = [
  { group: "Web", techs: ["React", "Next.js", "Node.js", "Django", "PostgreSQL", "Firebase"] },
  { group: "Mobile", techs: ["Flutter", "React Native", "Kotlin", "Android Studio"] },
  { group: "ML / AI", techs: ["Python", "TensorFlow", "PyTorch", "OpenCV"] },
  { group: "Hardware", techs: ["Arduino", "ESP32", "Raspberry Pi", "NodeMCU", "8051"] },
];

export default function TechStack() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--ink)]">Tools we build with</h2>
        <p className="mt-2 mb-8 text-[var(--mute)] max-w-[52ch]">The same tools your faculty expect to see in a final review.</p>
        <div className="grid gap-5 md:grid-cols-4">
          {STACK.map(({ group, techs }) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-[var(--mute)] mb-2">{group}</h3>
              <ul className="flex flex-wrap gap-2">
                {techs.map((t) => (
                  <li key={t} className="text-sm font-medium px-3 py-1.5 rounded-full bg-white border border-[var(--rule)] text-[var(--ink)]">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
