import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentUserLudus } from "@/lib/ludus/repository";
import { getInitialGladiatorsByLudus } from "@/lib/gladiator/repository";
import { requireAuthPage } from "@/lib/auth/server";
import { debug_error } from "@/utils/debug";
import InitialGladiatorsClient from "./InitialGladiatorsClient";
import BackgroundEffects from "@/components/ui/BackgroundEffects";
import GlowOrbs from "@/components/ui/GlowOrbs";
import { SERVERS } from "@/data/servers";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export default async function InitialGladiatorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { user, supabase } = await requireAuthPage(locale);

  // Check if user has already completed onboarding
  const { data: userRow } = await supabase
    .from("users")
    .select("onboardingDone")
    .eq("id", user.id)
    .maybeSingle();
  const onboardingDone = Boolean(userRow?.onboardingDone);

  // If onboarding is already done, redirect to dashboard
  if (onboardingDone) {
    redirect(`/${locale}/dashboard`);
  }

  // Get user's ludus
  let ludusData: { id: string; name?: string; serverId?: string } | null = null;
  let gladiators: NormalizedGladiator[] = [];
  let minRequired = 3;

  try {
    // Get user's current ludus (with server isolation logic)
    const ludus = await getCurrentUserLudus(user.id, "id,name,serverId");

    if (!ludus) {
      redirect(`/${locale}/server-selection`);
    }

    ludusData = { id: ludus.id, name: ludus.name, serverId: ludus.serverId };

    // Check if gladiators already exist for this ludus
    gladiators = await getInitialGladiatorsByLudus(ludus.id, locale);

    // Determine required initial count from server config
    const server = SERVERS.find(s => s.id === (ludusData?.serverId ?? ""));
    minRequired = server ? server.config.initialGladiatorsPerLudus : 3;

    // Do not generate here anymore; generation is now async via job + Supabase listener (future)
  } catch (error) {
    debug_error("Error loading gladiators:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations("InitialGladiators");

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Epic Background */}
      <BackgroundEffects variant="arena" showArenaPattern />
      <GlowOrbs variant="diagonal" size="md" />

      {/* Content */}
      <div className="relative z-10 min-h-screen px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-full backdrop-blur-sm mb-4 sm:mb-6">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-red-500"></span>
              </span>
              <span className="text-red-400 text-xs sm:text-sm font-medium">
                {t("badge")}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                {t("title")}
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto">
              {t("subtitle", { ludusName: ludusData?.name ?? t("fallbackLudusName") })}
            </p>
          </div>

          {/* Gladiators Display */}
          <InitialGladiatorsClient
            gladiators={gladiators}
            ludusName={ludusData?.name}
            ludusId={ludusData!.id as string}
            serverId={ludusData?.serverId as string}
            minRequired={minRequired}
          />
        </div>
      </div>
    </div>
  );
}


