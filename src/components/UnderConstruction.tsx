import React from "react";
import { Wrench, Cpu, Cable, CircuitBoard, Wifi } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";

interface UnderConstructionProps {
  title?: React.ReactNode;
  description?: string;
  hideStore?: boolean;
  showHomeButton?: boolean;
}

export function UnderConstruction({
  title = (
    <>
      404 <br /> Under Construction
    </>
  ),
  description = "We are currently wiring things up and performing scheduled maintenance. We'll be back online shortly!",
  hideStore = true,
  showHomeButton = false,
}: UnderConstructionProps) {
  return (
    <div className="min-h-screen flex flex-col grid-texture relative overflow-hidden bg-[var(--paper)]">
      {/* Floating background elements */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15] text-[var(--ink)]">
        <Cpu className="absolute top-[20%] left-[15%] w-16 h-16 animate-[bounce_8s_ease-in-out_infinite]" />
        <CircuitBoard className="absolute bottom-[25%] right-[20%] w-20 h-20 animate-[bounce_10s_ease-in-out_infinite_reverse]" />
        <Cable className="absolute top-[40%] right-[10%] w-12 h-12 animate-[pulse_4s_ease-in-out_infinite]" />
        <Wifi className="absolute bottom-[15%] left-[25%] w-14 h-14 animate-[bounce_6s_ease-in-out_infinite]" />
        <CircuitBoard className="absolute top-[10%] right-[40%] w-10 h-10 animate-[bounce_9s_ease-in-out_infinite]" />
        <Cable className="absolute bottom-[40%] left-[5%] w-16 h-16 animate-[pulse_5s_ease-in-out_infinite]" />
      </div>

      <main className="flex-grow flex flex-col items-center justify-center p-4 relative z-10">
        <div className="max-w-md w-full text-center space-y-6 bg-white/70 backdrop-blur-md p-10 rounded-2xl border shadow-sm">
          <div className="mx-auto w-16 h-16 bg-[var(--hi)] rounded-full flex items-center justify-center text-[var(--ink)] mb-2 shadow-[0_0_0_6px_var(--hi-soft)]">
            <Wrench size={32} className="wrench-anim" />
          </div>

          <h1 className="text-4xl font-bold text-[var(--ink)] tracking-tight leading-tight">
            {title}
          </h1>

          <p className="text-[var(--mute)] text-lg">
            {description}
          </p>

          {showHomeButton && (
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--ink)] text-white hover:opacity-90 transition-opacity"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
