import { getSettings } from "@/app/x9/settings-actions";
import Navbar from "@/components/Navbar";
import HeroStepOne from "@/components/HeroStepOne";
import TechStack from "@/components/TechStack";
import HowItWorks from "@/components/HowItWorks";
import Portfolio from "@/components/Portfolio";
import CTABand from "@/components/CTABand";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();

  return (
    <>
      <Navbar hideStore={settings.isStoreUnderConstruction} />
      <main>
        <HeroStepOne />
        <TechStack />
        <HowItWorks />
        <Portfolio />
        <CTABand />
      </main>
      <Footer />
    </>
  );
}
