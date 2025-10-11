import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export default async function IntroPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // If user is already authenticated, skip intro and go to appropriate page
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (user) {
    try {
      // Check if user has completed onboarding
      const { data: userRow } = await supabase
        .from("users")
        .select("onboardingDone")
        .eq("id", user.id)
        .maybeSingle();

      const { data: ludus } = await supabase
        .from("ludi")
        .select("id")
        .eq("userId", user.id)
        .limit(1)
        .maybeSingle();

      if (!ludus) {
        redirect(`/${locale}/server-selection`);
      } else if (userRow?.onboardingDone) {
        // Has a ludus and completed onboarding: go to dashboard
        redirect(`/${locale}/dashboard`);
      } else {
        // Has a ludus but not completed onboarding: continue to initial gladiators
        redirect(`/${locale}/initial-gladiators`);
      }
    } catch {
      redirect(`/${locale}/server-selection`);
    }
  }

  const t = await getTranslations("Intro");

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Epic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/30 to-black" />
        <div className="absolute inset-0 bg-[url('/arena-bg.svg')] opacity-5" />

        {/* Animated glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-4">
        <div className="max-w-4xl mx-auto w-full">
          {/* Epic Badge */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-900/30 border border-amber-700/50 rounded-full backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <span className="text-amber-400 text-xs font-medium">
                {t("badge")}
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-center mb-3">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
              {t("title")}
            </span>
          </h1>

          {/* Game Description */}
          <div className="space-y-3 text-sm md:text-base text-gray-300 leading-relaxed mb-4">
            <p className="text-center">
              {t("description.line1")}
            </p>

            <div className="grid md:grid-cols-3 gap-3 my-3">
              <div className="bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-lg p-3 hover:border-amber-700/50 transition-all duration-300 text-center">
                <div className="text-xl mb-1">⚔️</div>
                <h3 className="text-amber-400 font-bold mb-1 text-xs">{t("features.combat.title")}</h3>
                <p className="text-gray-400 text-xs">{t("features.combat.description")}</p>
              </div>

              <div className="bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-lg p-3 hover:border-amber-700/50 transition-all duration-300 text-center">
                <div className="text-xl mb-1">🗣️</div>
                <h3 className="text-amber-400 font-bold mb-1 text-xs">{t("features.interaction.title")}</h3>
                <p className="text-gray-400 text-xs">{t("features.interaction.description")}</p>
              </div>



              <div className="bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-lg p-3 hover:border-amber-700/50 transition-all duration-300 text-center">
                <div className="text-xl mb-1">👑</div>
                <h3 className="text-amber-400 font-bold mb-1 text-xs">{t("features.glory.title")}</h3>
                <p className="text-gray-400 text-xs">{t("features.glory.description")}</p>
              </div>
            </div>



            <p className="text-center text-lg font-bold text-amber-400">
              {t("description.question")}
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center mb-3">
            <Link
              href={`/${locale}/auth`}
              className="group relative inline-block"
              data-testid="intro-ready-button"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-red-600 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <button className="relative px-8 py-3 bg-gradient-to-r from-amber-600 to-red-600 rounded-lg font-bold text-base text-white shadow-2xl transform transition-all duration-300 hover:scale-105 active:scale-95">
                {t("readyButton")}
              </button>
            </Link>
          </div>

          {/* Epic Footer Text */}
          <p className="text-center text-gray-500 text-xs">
            {t("footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
