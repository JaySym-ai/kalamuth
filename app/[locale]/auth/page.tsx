import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import AuthClient from "./AuthClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AuthPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (user) {
    try {
      const { data: ludi } = await supabase
        .from("ludi")
        .select("id")
        .eq("userId", user.id)
        .limit(1)
        .maybeSingle();

      if (!ludi) {
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
