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
      // If user already has a ludus, send them to app; otherwise, start setup
      const ludiSnapshot = await adminDb()
        .collection("ludi")
        .where("userId", "==", user.uid)
        .limit(1)
        .get();

      if (ludiSnapshot.empty) {
        redirect(`/${locale}/server-selection`);
      } else {
        redirect(`/${locale}/dashboard`);
      }
    } catch {
      redirect(`/${locale}`);
    }
  }
  return <AuthClient />;
}

