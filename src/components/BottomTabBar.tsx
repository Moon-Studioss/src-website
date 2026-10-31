"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, ShoppingBag, Plus, MapPin, LayoutGrid } from "lucide-react";

// App-style navigation for phones. Hides while scrolling down, returns on
// scroll up or at the page bottom. Hidden on /submit (form = focus mode), shown on /submitted.
export function BottomTabBar({ hideStore = false }: { hideStore?: boolean }) {
  const pathname = usePathname() ?? "/";
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const atBottom = y + window.innerHeight >= document.documentElement.scrollHeight - 4;
      if (atBottom || y < 120) setHidden(false);
      else if (y > lastY.current + 6) setHidden(true);
      else if (y < lastY.current - 6) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Show the bar again after navigating
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setHidden(false);
  }

  if (pathname === "/submit") return null;

  // Left and right groups flank a fixed-width centre, so + stays exactly in the
  // middle even when the Store tab is hidden.
  const left = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    ...(hideStore ? [] : [{ href: "/store", label: "Store", icon: ShoppingBag, active: pathname.startsWith("/store") }]),
  ];
  const right = [
    { href: "/status", label: "Track", icon: MapPin, active: pathname.startsWith("/status") },
    { href: "/#work", label: "Work", icon: LayoutGrid, active: false },
  ];

  const tab = ({ href, label, icon: Icon, active }: (typeof left)[number]) => (
    <li key={label} className="flex-1">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className="press flex flex-col items-center justify-end gap-1 pb-2 h-full text-[11px] font-medium"
        style={{ color: active ? "var(--ink)" : "var(--mute)" }}
      >
        <span className="grid place-items-center" style={{ width: 34, height: 34 }}>
          <Icon size={20} strokeWidth={active ? 2.4 : 2} />
        </span>
        <span className={active ? "hl font-semibold" : ""}>{label}</span>
      </Link>
    </li>
  );

  return (
    <>
      {/* Spacer so page content never sits under the bar */}
      <div className="md:hidden" style={{ height: "calc(var(--tab-h) + env(safe-area-inset-bottom, 0px))" }} />
      <nav
        aria-label="Main"
        className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-[var(--rule)] transition-transform duration-200 ease-out"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          transform: hidden ? "translateY(110%)" : "translateY(0)",
        }}
      >
        <div className="flex items-end" style={{ height: "var(--tab-h)" }}>
          <ul className="flex flex-1 h-full items-end">{left.map(tab)}</ul>
          <Link
            href="/submit"
            className="press w-[76px] shrink-0 flex flex-col items-center justify-end gap-1 pb-2 h-full text-[11px] font-medium text-[var(--ink)]"
          >
            <span
              className="grid place-items-center rounded-full bg-[var(--hi)] text-[var(--ink)] -mt-6 border-4 border-white"
              style={{ width: 52, height: 52, boxShadow: "0 6px 16px rgb(22 35 58 / 0.18)" }}
            >
              <Plus size={24} strokeWidth={2.6} />
            </span>
            Submit
          </Link>
          <ul className="flex flex-1 h-full items-end">{right.map(tab)}</ul>
        </div>
      </nav>
    </>
  );
}
