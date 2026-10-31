import Link from "next/link";
import { MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-10 bg-[var(--ink)] border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-baseline gap-1 select-none">
          <span className="font-display text-xl font-extrabold text-white">SRC</span>
          <span className="text-white/45">e-solutions</span>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/60">
          <li>
            <a
              href="https://maps.app.goo.gl/eCW1CFXnV53qjFi26?g_st=aw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <MapPin size={15} /> Visit our office, Vijayawada
            </a>
          </li>
          <li><Link href="/status" className="hover:text-white">Track project</Link></li>
        </ul>
        <span className="text-xs text-white/30">© {new Date().getFullYear()} SRC e-solutions</span>
      </div>
    </footer>
  );
}
