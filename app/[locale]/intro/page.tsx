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
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Epic Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/30 border border-amber-700/50 rounded-full backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-amber-400 text-sm font-medium">
                {t("badge")}
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-center mb-8">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
              {t("title")}
            </span>
          </h1>

          {/* Game Description */}
          <div className="space-y-6 text-lg md:text-xl text-gray-300 leading-relaxed mb-12">
            <p className="text-center">
              {t("description.line1")}
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 hover:border-amber-700/50 transition-all duration-300">
                <div className="text-3xl mb-3">⚔️</div>
                <h3 className="text-amber-400 font-bold mb-2">{t("features.combat.title")}</h3>
                <p className="text-gray-400 text-base">{t("features.combat.description")}</p>
              </div>

              <div className="bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 hover:border-amber-700/50 transition-all duration-300">
                <div className="text-3xl mb-3">🗣️</div>
                <h3 className="text-amber-400 font-bold mb-2">{t("features.interaction.title")}</h3>
                <p className="text-gray-400 text-base">{t("features.interaction.description")}</p>
              </div>

              <div className="bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 hover:border-amber-700/50 transition-all duration-300">
                <div className="text-3xl mb-3">🏛️</div>
                <h3 className="text-amber-400 font-bold mb-2">{t("features.management.title")}</h3>
                <p className="text-gray-400 text-base">{t("features.management.description")}</p>
              </div>

              <div className="bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 hover:border-amber-700/50 transition-all duration-300">
                <div className="text-3xl mb-3">👑</div>
                <h3 className="text-amber-400 font-bold mb-2">{t("features.glory.title")}</h3>
                <p className="text-gray-400 text-base">{t("features.glory.description")}</p>
              </div>
            </div>

            <p className="text-center text-xl">
              {t("description.line2")}
            </p>

            <p className="text-center text-2xl font-bold text-amber-400">
              {t("description.question")}
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link
              href={`/${locale}/auth`}
              className="group relative inline-block"
              data-testid="intro-ready-button"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-red-600 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <button className="relative px-12 py-5 bg-gradient-to-r from-amber-600 to-red-600 rounded-lg font-bold text-xl text-white shadow-2xl transform transition-all duration-300 hover:scale-105 active:scale-95">
                {t("readyButton")}
              </button>
            </Link>
          </div>

          {/* Epic Footer Text */}
          <p className="text-center text-gray-500 text-sm mt-12">
            {t("footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
