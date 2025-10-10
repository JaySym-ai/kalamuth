"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ArrowLeft, Loader } from "lucide-react";
import type { Ludus } from "@/types/ludus";
import { normalizeGladiator, type NormalizedGladiator } from "@/lib/gladiator/normalize";
import { useRealtimeCollection, useRealtimeRow } from "@/lib/supabase/realtime";
import GameViewport from "@/components/layout/GameViewport";

interface TavernTranslations {
  title: string;
  subtitle: string;
  availableGladiators: string;
  recruit: string;
  reroll: string;
  recruiting: string;
  rerolling: string;
  ludusFullTitle: string;
  ludusFullMessage: string;
  loadingGladiators: string;
  noGladiators: string;
  recruitSuccess: string;
  rerollSuccess: string;
  error: string;
  backToDashboard: string;
}

interface Props {
  ludus: Ludus & { id: string };
  tavernGladiators: NormalizedGladiator[];
  locale: string;
  translations: TavernTranslations;
}

export default function TavernClient({ ludus, tavernGladiators, locale, translations: t }: Props) {
  const router = useRouter();
  const currentLocale = useLocale();
  const [loading, setLoading] = useState(false);
  const [recruiting, setRecruiting] = useState<string | null>(null);
  const [rerolling, setRerolling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: currentLudus } = useRealtimeRow<Ludus & { id: string }>({
    table: "ludi",
    select: "id,userId,serverId,name,logoUrl,treasury,reputation,morale,facilities,maxGladiators,gladiatorCount,motto,locationCity,createdAt,updatedAt",
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

  const { data: realtimeTavernGladiators } = useRealtimeCollection<NormalizedGladiator>({
    table: "tavern_gladiators",
    select: "id, ludusId, serverId, name, surname, avatarUrl, birthCity, health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive",
    match: { ludusId: ludus.id },
    initialData: tavernGladiators,
    orderBy: { column: "createdAt", ascending: false },
    primaryKey: "id",
    transform: useCallback((row: Record<string, unknown>) => {
      const raw = row as Record<string, unknown> & { id?: unknown };
      const identifier = typeof raw.id === "string" ? raw.id : String(raw.id ?? "");
      return normalizeGladiator(identifier, raw, locale);
    }, [locale]),
  });

  const ludusIsFull = (currentLudus?.gladiatorCount ?? 0) >= (currentLudus?.maxGladiators ?? 0);
  const gladiators = realtimeTavernGladiators || tavernGladiators;

  // Auto-generate tavern gladiators if none exist
  useEffect(() => {
    if (gladiators.length > 0 || loading) return;

    setLoading(true);
    fetch("/api/tavern/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ludusId: ludus.id }),
    })
      .catch((err) => {
        console.error("Tavern gladiator generation failed:", err);
        setError(t.error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [gladiators.length, ludus.id, loading, t.error]);

  const handleRecruit = async (gladiatorId: string) => {
    if (ludusIsFull) {
      setError(t.ludusFullMessage);
      return;
    }

    setRecruiting(gladiatorId);
    setError(null);

    try {
      const response = await fetch("/api/tavern/recruit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ludusId: ludus.id, tavernGladiatorId: gladiatorId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t.error);
      }
    } catch (err) {
      console.error("Recruitment failed:", err);
      setError(t.error);
    } finally {
      setRecruiting(null);
    }
  };

  const handleReroll = async (gladiatorId: string) => {
    setRerolling(gladiatorId);
    setError(null);

    try {
      const response = await fetch("/api/tavern/reroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ludusId: ludus.id, tavernGladiatorId: gladiatorId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t.error);
      }
    } catch (err) {
      console.error("Reroll failed:", err);
      setError(t.error);
    } finally {
      setRerolling(null);
    }
  };

  return (
    <GameViewport>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />
      <div className="absolute inset-0 bg-[url('/images/arena-bg.jpg')] opacity-5 bg-cover bg-center" />

      {/* Scrollable Content Container */}
      <div className="relative z-10 h-full overflow-y-auto px-3 py-3" data-scrollable="true">
        {/* Header */}
        <header className="max-w-7xl mx-auto mb-3">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent"
              >
                {t.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 text-sm mt-1"
              >
                {t.subtitle}
              </motion.p>
            </div>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.push(`/${currentLocale}/dashboard`)}
              className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-lg hover:border-amber-600/60 hover:bg-amber-900/10 transition-all duration-300"
              data-testid="back-to-dashboard-button"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">{t.backToDashboard}</span>
            </motion.button>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Ludus Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3 mb-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-amber-400">{currentLudus?.name}</h2>
                <p className="text-gray-400 text-sm">
                  {currentLudus?.gladiatorCount} / {currentLudus?.maxGladiators} {t.availableGladiators.toLowerCase()}
                </p>
              </div>
              {ludusIsFull && (
                <div className="text-right">
                  <p className="text-red-400 font-bold text-sm">{t.ludusFullTitle}</p>
                  <p className="text-red-300 text-xs">{t.ludusFullMessage}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 mb-3 text-red-300 text-sm"
              data-testid="error-message"
            >
              {error}
            </motion.div>
          )}

          {/* Gladiators Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3"
          >
            <h3 className="text-lg font-bold text-amber-400 mb-3">{t.availableGladiators}</h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-amber-400 animate-spin" />
                <span className="ml-3 text-amber-400">{t.loadingGladiators}</span>
              </div>
            ) : gladiators.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">{t.noGladiators}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {gladiators.map((gladiator, index) => (
                  <motion.div
                    key={gladiator.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 rounded-lg p-3 hover:border-amber-700/50 transition-all duration-300"
                    data-testid={`tavern-gladiator-${gladiator.id}`}
                  >
                    {/* Avatar and Name */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center text-lg font-bold text-white">
                        {gladiator.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-amber-400 truncate">
                          {gladiator.name} {gladiator.surname}
                        </h4>
                        <p className="text-xs text-gray-400 truncate">{gladiator.birthCity}</p>
                      </div>
                    </div>

                    {/* Health Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Health</span>
                        <span className="text-gray-400">{gladiator.health} HP</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                          style={{ width: `${(gladiator.health / 300) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Preview */}
                    <div className="text-xs text-gray-400 mb-3 space-y-1">
                      <p><span className="text-amber-400">Personality:</span> {typeof gladiator.personality === 'string' ? gladiator.personality : gladiator.personality?.en || 'N/A'}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRecruit(gladiator.id)}
                        disabled={ludusIsFull || recruiting === gladiator.id}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-600 to-red-600 text-white text-xs font-bold rounded-lg hover:from-amber-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        data-testid={`recruit-button-${gladiator.id}`}
                      >
                        {recruiting === gladiator.id ? t.recruiting : t.recruit}
                      </button>
                      <button
                        onClick={() => handleReroll(gladiator.id)}
                        disabled={rerolling === gladiator.id}
                        className="flex-1 px-3 py-2 bg-black/60 border border-amber-900/30 text-amber-400 text-xs font-bold rounded-lg hover:border-amber-600/60 hover:bg-amber-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        data-testid={`reroll-button-${gladiator.id}`}
                      >
                        {rerolling === gladiator.id ? t.rerolling : t.reroll}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </GameViewport>
  );
}

