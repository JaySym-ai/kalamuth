import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/sections/HeroSection";
import FeaturesSection from "../components/sections/FeaturesSection";
import GladiatorShowcase from "../components/sections/GladiatorShowcase";
import BattlePreview from "../components/sections/BattlePreview";
import CTASection from "../components/sections/CTASection";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <GladiatorShowcase />
        <BattlePreview />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

