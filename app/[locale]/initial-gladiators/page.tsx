import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import InitialGladiatorsClient from "./InitialGladiatorsClient";
import { SERVERS } from "@/data/servers";
import { normalizeGladiator, type NormalizedGladiator } from "@/lib/gladiator/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export default async function InitialGladiatorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // Must be authenticated
  if (!user) redirect(`/${locale}/auth`);

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
    const { data: ludus } = await supabase
      .from("ludi")
      .select("id,name,serverId")
      .eq("userId", user.id)
      .limit(1)
      .maybeSingle();

    if (!ludus) {
      // No ludus found, redirect to server selection
      redirect(`/${locale}/server-selection`);
    }

    ludusData = { id: ludus.id, name: ludus.name, serverId: ludus.serverId };

    // Check if gladiators already exist for this ludus
    const { data: glads } = await supabase
      .from("gladiators")
      .select("id, name, surname, avatarUrl, birthCity, health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt")
      .eq("ludusId", ludus.id);

    // Determine required initial count from server config
    const server = SERVERS.find(s => s.id === (ludusData?.serverId ?? ""));
    minRequired = server ? server.config.initialGladiatorsPerLudus : 3;

    if (glads && glads.length) {
      gladiators = glads.map(doc =>
        normalizeGladiator(doc.id as string, doc as unknown as Record<string, unknown>, locale)
      );
    }

    // Do not generate here anymore; generation is now async via job + Supabase listener (future)
  } catch (error) {
    console.error("Error loading gladiators:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations("InitialGladiators");

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Epic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black" />
        <div className="absolute inset-0 bg-[url('/arena-bg.svg')] opacity-5" />

        {/* Animated glows */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-full backdrop-blur-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-red-400 text-sm font-medium">
                {t("badge")}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                {t("title")}
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
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


