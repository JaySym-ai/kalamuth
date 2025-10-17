import CTASection from "./CTASection";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export default async function CTASectionContainer() {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return <CTASection authed={false} onboardingDone={false} />;
  try {
    const { data: userRow } = await supabase
      .from("users")
      .select("onboardingDone")
      .eq("id", user.id)
      .maybeSingle();
    const onboardingDone = Boolean(userRow?.onboardingDone);
    return <CTASection authed={true} onboardingDone={onboardingDone} />;
  } catch {
    return <CTASection authed={true} onboardingDone={false} />;
  }
}
