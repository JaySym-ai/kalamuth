import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/server";
import CTASection from "./CTASection";

export default async function CTASectionContainer() {
  const user = await getSessionUser();
  if (!user) return <CTASection authed={false} onboardingDone={false} />;
  try {
    const snap = await adminDb().collection("users").doc(user.uid).get();
    const onboardingDone = Boolean(snap.exists ? (snap.data() as { onboardingDone?: boolean })?.onboardingDone : false);
    return <CTASection authed={true} onboardingDone={onboardingDone} />;
  } catch {
    return <CTASection authed={true} onboardingDone={false} />;
  }
}

