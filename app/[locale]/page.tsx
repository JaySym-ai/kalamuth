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
export const dynamic = "force-dynamic";


export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  // If the user is authenticated, do not show the public landing page.
  // Redirect to setup flow: server selection → ludus creation → initial gladiators → dashboard.
  const { locale } = await params;
  const user = await getSessionUser();
  if (user) {
    try {
      // Check if user has completed onboarding
      const userDoc = await adminDb().collection("users").doc(user.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      const onboardingDone = Boolean(userData?.onboardingDone);

      // Check if user has a ludus
      const ludiSnapshot = await adminDb()
        .collection("ludi")
        .where("userId", "==", user.uid)
        .limit(1)
        .get();

      if (ludiSnapshot.empty) {
        // No ludus yet: go start at server selection
        redirect(`/${locale}/server-selection`);
      } else if (onboardingDone) {
        // Has a ludus and completed onboarding: go to dashboard
        redirect(`/${locale}/dashboard`);
      } else {
        // Has a ludus but not completed onboarding: continue to initial gladiators
        redirect(`/${locale}/initial-gladiators`);
      }
    } catch {
      // If checking fails, start from server selection
      redirect(`/${locale}/server-selection`);
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
