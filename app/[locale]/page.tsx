import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/sections/HeroSection";
import FeaturesSection from "../components/sections/FeaturesSection";
import GladiatorShowcase from "../components/sections/GladiatorShowcase";
import BattlePreview from "../components/sections/BattlePreview";
import CTASection from "../components/sections/CTASectionContainer";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/server";

export const runtime = "nodejs";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  // If the user is authenticated, do not show the public landing page.
  // Redirect to onboarding (if not completed) or dashboard (if completed).
  const { locale } = await params;
  const user = await getSessionUser();
  if (user) {
    try {
      const snap = await adminDb().collection("users").doc(user.uid).get();
      const onboardingDone = Boolean(snap.exists ? (snap.data() as { onboardingDone?: boolean })?.onboardingDone : false);
      if (!onboardingDone) redirect(`/${locale}/onboarding`);
      redirect(`/${locale}/dashboard`);
    } catch {
      // If checking onboarding fails, be conservative and send to onboarding
      redirect(`/${locale}/onboarding`);
    }
  }

  // Not authenticated: render marketing homepage
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
