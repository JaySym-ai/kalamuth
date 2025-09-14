import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/server";
import AuthClient from "./AuthClient";

export const runtime = "nodejs";

export default async function AuthPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getSessionUser();
  if (user) {
    try {
      const snap = await adminDb().collection("users").doc(user.uid).get();
      const onboardingDone = Boolean(snap.exists ? (snap.data() as { onboardingDone?: boolean })?.onboardingDone : false);
      if (!onboardingDone) redirect(`/${locale}/onboarding`);
      redirect(`/${locale}`);
    } catch {
      redirect(`/${locale}`);
    }
  }
  return <AuthClient />;
}

