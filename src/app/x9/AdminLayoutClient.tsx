"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminLogout } from "./login/actions";
import { SettingsModal } from "@/components/SettingsModal";
import { FolderKanban, Store, LogOut } from "lucide-react";

export function AdminLayoutClient({ children, storageWidget }: { children: React.ReactNode, storageWidget?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/x9/login") {
    return <div className="admin-theme">{children}</div>;
  }

  const handleLogout = async () => {
    await adminLogout();
    router.push("/x9/login");
  };

  return (
    <div className="admin-theme min-h-screen bg-[var(--paper-2)]">
      <header className="bg-white border-b sticky top-0 z-10" style={{ borderColor: "var(--rule)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between relative">
          <div className="flex items-center z-10">
            <Link href="/x9" className="font-bold text-[var(--ink)] tracking-tight text-lg">
              <span className="bg-[var(--hi)] px-1.5 py-0.5 rounded-md">SRC</span><span className="hidden sm:inline font-normal ml-1"> Dashboard</span>
            </Link>
          </div>
          
          <nav className="hidden sm:flex items-center gap-6 text-sm absolute left-1/2 -translate-x-1/2">
            <Link href="/x9" className={`font-medium transition-colors pb-0.5 border-b-2 ${pathname === '/x9' ? 'border-[var(--hi)] ' : 'border-transparent '}${pathname === '/x9' ? 'text-[var(--ink)]' : 'text-[var(--mute)] hover:text-[var(--ink)]'}`}>
              Projects
            </Link>
            <Link href="/x9/store" className={`font-medium transition-colors pb-0.5 border-b-2 ${pathname.startsWith('/x9/store') ? 'border-[var(--hi)] ' : 'border-transparent '}${pathname.startsWith('/x9/store') ? 'text-[var(--ink)]' : 'text-[var(--mute)] hover:text-[var(--ink)]'}`}>
              Store
            </Link>
          </nav>

          <div className="flex items-center z-10 gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <SettingsModal />
            </div>
            {storageWidget}
            <button 
              onClick={handleLogout}
              className="hidden sm:block press text-sm font-semibold text-[var(--ink)] bg-[var(--hi-soft)] hover:bg-[var(--hi)] rounded-full px-4 py-1.5 ml-1"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
      {/* Phone dock, same idea as the landing page's bottom bar */}
      <div className="sm:hidden" style={{ height: "calc(var(--tab-h) + env(safe-area-inset-bottom, 0px))" }} />
      <nav aria-label="Admin" className="sm:hidden fixed left-0 right-0 bottom-0 z-40 bg-white border-t" style={{ borderColor: "var(--rule)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <ul className="flex items-end" style={{ height: "var(--tab-h)" }}>
          {[
            { href: "/x9", label: "Projects", icon: FolderKanban, active: pathname === "/x9" || (/^\/x9\/[^/]+$/.test(pathname) && !pathname.startsWith("/x9/store")) },
            { href: "/x9/store", label: "Store", icon: Store, active: pathname.startsWith("/x9/store") },
          ].map(({ href, label, icon: Icon, active }) => (
            <li key={label} className="flex-1 h-full">
              <Link href={href} aria-current={active ? "page" : undefined} className="press flex flex-col items-center justify-end gap-1 pb-2 h-full w-full text-[11px] font-medium" style={{ color: active ? "var(--ink)" : "var(--mute)" }}>
                <span className="grid place-items-center" style={{ width: 34, height: 34 }}><Icon size={20} strokeWidth={active ? 2.4 : 2} /></span>
                <span className={active ? "hl font-semibold" : ""}>{label}</span>
              </Link>
            </li>
          ))}
          <li className="flex-1 h-full"><SettingsModal mode="tab" /></li>
          <li className="flex-1 h-full">
            <button onClick={handleLogout} className="press flex flex-col items-center justify-end gap-1 pb-2 h-full w-full text-[11px] font-medium text-[var(--mute)]">
              <span className="grid place-items-center" style={{ width: 34, height: 34 }}><LogOut size={20} /></span>
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
