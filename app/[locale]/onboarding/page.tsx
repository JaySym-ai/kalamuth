import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequestUser } from "@/lib/firebase/request-auth";
import { adminDb } from "@/lib/firebase/server";
import LogoutButton from "./LogoutButton";

export const runtime = "nodejs";

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getRequestUser();
  if (!user) redirect(`/${locale}/auth`);
  // If onboarding already completed, send user home
  try {
    const snap = await adminDb().collection("users").doc(user.uid).get();
    const onboardingDone = Boolean(snap.exists ? (snap.data() as { onboardingDone?: boolean })?.onboardingDone : false);
    if (onboardingDone) redirect(`/${locale}`);
  } catch {}

  const t = await getTranslations("Onboarding");
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl text-center relative">
        {/* Logout button in top-right corner */}
        <div className="absolute top-0 right-0">
          <LogoutButton />
        </div>

        <h1 className="text-3xl font-semibold mb-3">{t("title")}</h1>
        <p className="text-zinc-400 mb-6">{t("desc")}</p>
        <div className="grid gap-3">
          <Link href=".." className="py-3 rounded-xl bg-indigo-600 font-medium inline-block">{t("cta.start")}</Link>
        </div>
      </div>
    </div>
  );
}
