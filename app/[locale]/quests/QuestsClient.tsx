"use client";

import { debug_error } from "@/utils/debug";
import { useCallback, useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import type { Ludus } from "@/types/ludus";
import type { Quest } from "@/types/quest";
import { QuestStatus } from "@/types/quest";
import { useRealtimeRow, useRealtimeCollection } from "@/lib/supabase/realtime";

import LogoutButton from "@/app/components/auth/LogoutButton";
import PageLayout from "@/components/layout/PageLayout";
import QuestGenerationComponent from "./components/QuestGenerationComponent";
import QuestDetailsComponent from "./components/QuestDetailsComponent";
import QuestOngoingComponent from "./components/QuestOngoingComponent";
import QuestResultsComponent from "./components/QuestResultsComponent";
import QuestHistoryComponent from "./components/QuestHistoryComponent";

interface QuestsTranslations {
  title: string;
  subtitle: string;
  readyForAdventure: string;
  generateQuestDescription: string;
  generateQuest: string;
  generating: string;
  loadingVolunteer: string;
  questDetails: string;
  reward: string;
  sestertii: string;
  dangerLevel: string;
  riskOfInjury: string;
  riskOfSickness: string;
  riskOfDeath: string;
  volunteer: string;
  volunteerMessage: string;
  acceptQuest: string;
  rerollQuest: string;
  rerollCost: string;
  rerollConfirm: string;
  rerollConfirmMessage: string;
  cancel: string;
  cancelQuest: string;
  cancelCost: string;
  questAccepted: string;
  questInProgress: string;
  timeRemaining: string;
  questOngoing: string;
  questResult: string;
  questCompleted: string;
  questFailed: string;
  questCancelled: string;
  whatHappened: string;
  healthLost: string;
  injuryContracted: string;
  sicknessContracted: string;
  gladiatorDied: string;
  rewardEarned: string;
  backToDashboard: string;
  noGladiators: string;
  insufficientFunds: string;
  error: string;
  questHistory: string;
  noQuestHistory: string;
  status: string;
  date: string;
  gladiator: string;
  treasury: string;
  reputation: string;
  morale: string;
  gladiators: string;
}

interface Props {
  ludus: Ludus & { id: string };
  initialQuests: Quest[];
  locale: string;
  questDurationMinutes: number;
  translations: QuestsTranslations;
}

export default function QuestsClient({ ludus, initialQuests, questDurationMinutes, translations: t }: Props) {
  const currentLocale = useLocale();
  const [currentQuest, setCurrentQuest] = useState<Quest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current ludus data
  useRealtimeRow<Ludus & { id: string }>({
    table: "ludi",
    select:
      "id,userId,serverId,name,logoUrl,treasury,reputation,morale,facilities,maxGladiators,gladiatorCount,motto,locationCity,createdAt,updatedAt",
    match: { id: ludus.id },
    initialData: ludus,
    primaryKey: "id",
    transform: useCallback((row: Record<string, unknown>) => {
      const record = row as Record<string, unknown>;
      return {
        ...(ludus as Ludus & { id: string }),
        ...(record as Partial<Ludus>),
        id: String(record.id ?? ludus.id),
      } as Ludus & { id: string };
    }, [ludus]),
  });

  // Real-time quests subscription
  const { data: realtimeQuests } = useRealtimeCollection<Quest>({
    table: "quests",
    select: "id, userId, ludusId, serverId, gladiatorId, gladiatorName, title, description, volunteerMessage, reward, dangerPercentage, sicknessPercentage, deathPercentage, status, startedAt, completedAt, result, healthLost, sicknessContracted, injuryContracted, questFailed, gladiatorDied, createdAt, updatedAt",
    match: { ludusId: ludus.id },
    initialData: initialQuests,
    orderBy: { column: "createdAt", ascending: false },
    primaryKey: "id",
  });

  const quests = realtimeQuests;

  const questDurationMs = questDurationMinutes * 60 * 1000;

  const completeQuest = useCallback(async (questId: string) => {
    try {
      const response = await fetch("/api/quests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId, locale: currentLocale }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete quest");
      }

      // Real-time subscription will automatically update the UI
      // No need to manually update state
    } catch (err) {
      debug_error("Quest completion error:", err);
      setError(err instanceof Error ? err.message : "Failed to complete quest");
    }
  }, [currentLocale]);

  // Check for active quest and handle completion
  useEffect(() => {
    const activeQuest = quests.find(q => q.status === 'active');
    setCurrentQuest(activeQuest || null);

    // Check if quest should be completed
    if (activeQuest && activeQuest.startedAt) {
      const startTime = new Date(activeQuest.startedAt).getTime();
      const now = new Date().getTime();
      const elapsed = now - startTime;

      if (elapsed >= questDurationMs) {
        // Quest duration has passed, complete it
        completeQuest(activeQuest.id);
      } else {
        // Set a timer to complete the quest when time is up
        const remainingTime = questDurationMs - elapsed;
        const timer = setTimeout(() => {
          completeQuest(activeQuest.id);
        }, remainingTime);

        return () => clearTimeout(timer);
      }
    }
  }, [quests, questDurationMs, completeQuest]);

  const handleGenerateQuest = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/quests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ludusId: ludus.id, locale: currentLocale }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate quest");
      }

      // Real-time subscription will automatically add the new quest
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptQuest = async (questId: string) => {
    try {
      const response = await fetch("/api/quests/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to accept quest");
      }

      // Real-time subscription will automatically update the quest status
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleCancelQuest = async (questId: string) => {
    try {
      const response = await fetch("/api/quests/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel quest");
      }

      // Real-time subscription will automatically update the quest status
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleRerollQuest = async (questId: string) => {
    if (!confirm("Reroll this quest? It will cost 1 sesterce.")) return;

    try {
      const response = await fetch("/api/quests/reroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reroll quest");
      }

      // Real-time subscription will automatically remove the old quest and add the new one
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const pendingQuest = quests.find(q => q.status === 'pending');

  return (
    <PageLayout
      title={t.title}
      subtitle={t.subtitle}
      background="arena"
      rightActions={<LogoutButton />}
      backHref={`/${currentLocale}/dashboard`}
    >
      <div className="pb-6">
        {/* Main Content */}
        <div className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 text-red-200"
            >
              {error}
            </motion.div>
          )}

          {/* Quest Generation or Current Quest */}
          {!currentQuest && !pendingQuest && (
            <QuestGenerationComponent
              isGenerating={isGenerating}
              onGenerate={handleGenerateQuest}
              translations={t}
            />
          )}

          {pendingQuest && !currentQuest && (
            <QuestDetailsComponent
              quest={pendingQuest}
              onAccept={() => handleAcceptQuest(pendingQuest.id)}
              onReroll={() => handleRerollQuest(pendingQuest.id)}
              translations={t}
            />
          )}

          {currentQuest && currentQuest.status === 'active' && (
            <QuestOngoingComponent
              quest={currentQuest}
              onCancel={() => handleCancelQuest(currentQuest.id)}
              questDurationMinutes={questDurationMinutes}
              translations={t}
            />
          )}

          {currentQuest && (currentQuest.status === 'completed' || currentQuest.status === 'failed') && (
            <QuestResultsComponent
              quest={currentQuest}
              translations={t}
            />
          )}

          {/* Quest History */}
          <QuestHistoryComponent
            quests={quests.filter(q => q.status !== 'pending' && q.status !== 'active')}
            translations={t}
          />
        </div>
      </div>
    </PageLayout>
  );
}

