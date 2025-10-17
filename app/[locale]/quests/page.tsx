import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getQuestDurationMinutes, getCurrentUserLudusTransformed } from "@/lib/ludus/repository";
import { requireAuthPage } from "@/lib/auth/server";
import { debug_error } from "@/utils/debug";
import QuestsClient from "./QuestsClient";
import type { Ludus } from "@/types/ludus";
import type { Quest } from "@/types/quest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function QuestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { user, supabase } = await requireAuthPage(locale);

  // Fetch user's ludus
  let ludusData: (Ludus & { id: string }) | null = null;
  let quests: Quest[] = [];

  try {
    // Get user's current ludus with full transformation
    ludusData = await getCurrentUserLudusTransformed(user.id);

    if (!ludusData) {
      redirect(`/${locale}/server-selection`);
    }

    // Fetch quests for this ludus
    const { data: questsData } = await supabase
      .from("quests")
      .select("*")
      .eq("ludusId", ludusData.id)
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
    debug_error("Error loading quests data:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations("Quests");
  const questDurationMinutes = getQuestDurationMinutes(ludusData!.serverId);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <QuestsClient
        ludus={ludusData!}
        initialQuests={quests}
        locale={locale}
        questDurationMinutes={questDurationMinutes}
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
          rerollConfirm: t("rerollConfirm"),
          rerollConfirmMessage: t("rerollConfirmMessage"),
          cancel: t("cancel"),
          cancelQuest: t("cancelQuest"),
          cancelCost: t("cancelCost"),
          questAccepted: t("questAccepted"),
          questInProgress: t("questInProgress"),
          timeRemaining: t("timeRemaining"),
          questOngoing: t("questOngoing"),
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

