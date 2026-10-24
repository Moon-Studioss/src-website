"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminLogout } from "./login/actions";
import { SettingsModal } from "@/components/SettingsModal";
import { Menu, X } from "lucide-react";

export function AdminLayoutClient({ children, storageWidget }: { children: React.ReactNode, storageWidget?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname === "/x9/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await adminLogout();
    router.push("/x9/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b sticky top-0 z-10" style={{ borderColor: "var(--rule)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between relative">
          <div className="flex items-center z-10">
            <Link href="/x9" className="font-bold text-[var(--ink)] tracking-tight text-lg">
              SRC<span className="hidden sm:inline font-normal"> Dashboard</span>
            </Link>
          </div>
          
          <nav className="hidden sm:flex items-center gap-6 text-sm absolute left-1/2 -translate-x-1/2">
            <Link href="/x9" className={`font-medium transition-colors ${pathname === '/x9' ? 'text-[var(--ink)]' : 'text-[var(--mute)] hover:text-[var(--ink)]'}`}>
              Projects
            </Link>
            <Link href="/x9/store" className={`font-medium transition-colors ${pathname.startsWith('/x9/store') ? 'text-[var(--ink)]' : 'text-[var(--mute)] hover:text-[var(--ink)]'}`}>
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
              className="hidden sm:block text-sm font-semibold text-[var(--mute)] hover:text-[var(--ink)] transition-colors ml-1"
            >
              Logout
            </button>
            <button 
              className="sm:hidden p-1 text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="sm:hidden absolute top-14 left-0 w-full bg-white border-b shadow-md p-4 flex flex-col gap-4 z-20" style={{ borderColor: "var(--rule)" }}>
            <Link 
              href="/x9" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`font-medium transition-colors ${pathname === '/x9' ? 'text-[var(--ink)]' : 'text-[var(--mute)] hover:text-[var(--ink)]'}`}
            >
              Projects
            </Link>
            <Link 
              href="/x9/store" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`font-medium transition-colors ${pathname.startsWith('/x9/store') ? 'text-[var(--ink)]' : 'text-[var(--mute)] hover:text-[var(--ink)]'}`}
            >
              Store
            </Link>
            <hr style={{ borderColor: "var(--rule)" }} />
            <SettingsModal mode="menu-item" onClick={() => setIsMobileMenuOpen(false)} />
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="text-left font-semibold text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
