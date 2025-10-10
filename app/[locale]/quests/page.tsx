import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import QuestsClient from "./QuestsClient";
import type { Ludus } from "@/types/ludus";
import type { Quest } from "@/types/quest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function QuestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect(`/${locale}/auth`);

  // Fetch user's ludus
  let ludusData: (Ludus & { id: string }) | null = null;
  let quests: Quest[] = [];

  try {
    const { data: ludus } = await supabase
      .from("ludi")
      .select(
        "id,userId,serverId,name,logoUrl,treasury,reputation,morale,facilities,maxGladiators,gladiatorCount,motto,locationCity,createdAt,updatedAt"
      )
      .eq("userId", user.id)
      .limit(1)
      .maybeSingle();

    if (!ludus) {
      redirect(`/${locale}/server-selection`);
    }

    const treasurySource = (ludus.treasury as { currency?: string; amount?: unknown } | null) ?? {};
    const facilitiesSource = (ludus.facilities as Record<string, unknown> | null) ?? {};

    const parseNumber = (value: unknown, fallback: number) =>
      typeof value === "number"
        ? value
        : Number.parseInt(typeof value === "string" ? value : `${fallback}`, 10) || fallback;

    const currency =
      treasurySource.currency === "denarii" || treasurySource.currency === "sestertii"
        ? (treasurySource.currency as "denarii" | "sestertii")
        : "sestertii";

    ludusData = {
      id: (ludus.id as string) ?? "",
      userId: (ludus.userId as string) ?? user.id,
      serverId: (ludus.serverId as string) ?? "",
      name: (ludus.name as string) ?? "Ludus",
      logoUrl: (ludus.logoUrl as string) ?? "🏛️",
      treasury: {
        currency,
        amount: parseNumber(treasurySource.amount, 0),
      },
      reputation: parseNumber(ludus.reputation, 0),
      morale: parseNumber(ludus.morale, 50),
      facilities: {
        infirmaryLevel: parseNumber(facilitiesSource.infirmaryLevel, 1),
        trainingGroundLevel: parseNumber(facilitiesSource.trainingGroundLevel, 1),
        quartersLevel: parseNumber(facilitiesSource.quartersLevel, 1),
        kitchenLevel: parseNumber(facilitiesSource.kitchenLevel, 1),
      },
      maxGladiators: parseNumber(ludus.maxGladiators, 0),
      gladiatorCount: parseNumber(ludus.gladiatorCount, 0),
      motto: typeof ludus.motto === "string" ? ludus.motto : undefined,
      locationCity: typeof ludus.locationCity === "string" ? ludus.locationCity : undefined,
      createdAt: typeof ludus.createdAt === "string" ? ludus.createdAt : new Date().toISOString(),
      updatedAt: typeof ludus.updatedAt === "string" ? ludus.updatedAt : new Date().toISOString(),
    } as Ludus & { id: string };

    // Fetch quests for this ludus
    const { data: questsData } = await supabase
      .from("quests")
      .select("*")
      .eq("ludusId", ludus.id)
      .order("createdAt", { ascending: false });

    if (questsData) {
      quests = questsData.map(q => ({
        id: q.id,
        userId: q.userId,
        ludusId: q.ludusId,
        serverId: q.serverId,
        gladiatorId: q.gladiatorId,
        title: q.title,
        description: q.description,
        volunteerMessage: q.volunteerMessage,
        reward: q.reward,
        dangerPercentage: q.dangerPercentage,
        sicknessPercentage: q.sicknessPercentage,
        deathPercentage: q.deathPercentage,
        status: q.status,
        startedAt: q.startedAt,
        completedAt: q.completedAt,
        result: q.result,
        healthLost: q.healthLost,
        sicknessContracted: q.sicknessContracted,
        injuryContracted: q.injuryContracted,
        questFailed: q.questFailed,
        gladiatorDied: q.gladiatorDied,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      }));
    }
  } catch (error) {
    console.error("Error loading quests data:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations("Quests");

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <QuestsClient
        ludus={ludusData!}
        initialQuests={quests}
        locale={locale}
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          readyForAdventure: t("readyForAdventure"),
          generateQuestDescription: t("generateQuestDescription"),
          generateQuest: t("generateQuest"),
          generating: t("generating"),
          loadingVolunteer: t("loadingVolunteer"),
          questDetails: t("questDetails"),
          reward: t("reward"),
          sestertii: t("sestertii"),
          dangerLevel: t("dangerLevel"),
          riskOfInjury: t("riskOfInjury"),
          riskOfSickness: t("riskOfSickness"),
          riskOfDeath: t("riskOfDeath"),
          volunteer: t("volunteer"),
          volunteerMessage: t("volunteerMessage"),
          acceptQuest: t("acceptQuest"),
          rerollQuest: t("rerollQuest"),
          rerollCost: t("rerollCost"),
          cancelQuest: t("cancelQuest"),
          cancelCost: t("cancelCost"),
          questAccepted: t("questAccepted"),
          questInProgress: t("questInProgress"),
          timeRemaining: t("timeRemaining"),
          questResult: t("questResult"),
          questCompleted: t("questCompleted"),
          questFailed: t("questFailed"),
          questCancelled: t("questCancelled"),
          whatHappened: t("whatHappened"),
          healthLost: t("healthLost"),
          injuryContracted: t("injuryContracted"),
          sicknessContracted: t("sicknessContracted"),
          gladiatorDied: t("gladiatorDied"),
          rewardEarned: t("rewardEarned"),
          backToDashboard: t("backToDashboard"),
          noGladiators: t("noGladiators"),
          insufficientFunds: t("insufficientFunds"),
          error: t("error"),
          questHistory: t("questHistory"),
          noQuestHistory: t("noQuestHistory"),
          status: t("status"),
          date: t("date"),
          gladiator: t("gladiator"),
          treasury: t("treasury"),
          reputation: t("reputation"),
          morale: t("morale"),
          gladiators: t("gladiators"),
        }}
      />
    </main>
  );
}

