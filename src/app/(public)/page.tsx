import Link from "next/link";
import { getSettings } from "@/app/x9/settings-actions";
import Navbar from "@/components/Navbar";
import IdeaMachine from "@/components/IdeaMachine";
import HowItWorks from "@/components/HowItWorks";
import Portfolio from "@/components/Portfolio";
import PartsRow from "@/components/PartsRow";
import TechStack from "@/components/TechStack";
import Faq from "@/components/Faq";
import CTABand from "@/components/CTABand";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();

  return (
    <>
      <Navbar />
      <main>
        {/* Hero: the Idea Machine is the first thing students meet */}
        {/* Fills the first screen (above the tab bar on phones); content centred vertically */}
        <section id="ideas" className="grid-texture-faint flex flex-col min-h-[calc(100svh-var(--tab-h))] md:min-h-svh">
          <div className="w-full my-auto max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-24 pb-6 md:pb-16 grid md:grid-cols-[1fr_480px] gap-[clamp(20px,5svh,76px)] md:gap-16 items-center">
            <div>
              <h1 className="font-display text-[42px] leading-[1.02] md:text-7xl font-extrabold text-[var(--ink)]">
                No project idea?
                <br />
                <span className="hl">Here you go.</span>
              </h1>
              <p className="hidden md:block mt-5 text-lg text-[var(--mute)] max-w-[34ch]">
                Plug the wire into your branch, then press the red button. Every idea is a real project we can build for you.
              </p>
              <p className="mt-4 md:mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] text-[var(--ink)]">
                <span className="font-semibold">Have an idea already?</span>
                <Link
                  href="/submit"
                  className="press inline-flex items-center h-9 px-4 rounded-full border-2 border-[var(--ink)] font-semibold hover:bg-[var(--ink)] hover:text-white transition-colors"
                >
                  Tell us about it
                </Link>
              </p>
            </div>
            <IdeaMachine storeOpen />
          </div>
        </section>
        <HowItWorks />
        <Portfolio />
        <PartsRow />
        <TechStack />
        <Faq />
        <CTABand />
      </main>
      <Footer />
    </>
  );
}
