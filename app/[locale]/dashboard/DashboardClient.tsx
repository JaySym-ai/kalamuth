"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import type { Ludus } from "@/types/ludus";
import { normalizeGladiator, type NormalizedGladiator } from "@/lib/gladiator/normalize";
import { useRealtimeCollection, useRealtimeRow } from "@/lib/supabase/realtime";

import LogoutButton from "@/app/components/auth/LogoutButton";
import LudusStats from "./LudusStats";
import GladiatorGrid from "./GladiatorGrid";
import GameViewport from "@/components/layout/GameViewport";

interface DashboardTranslations {
  title: string;
  ludusOverview: string;
  arena: string;
  arenaCityLabel: string;
  arenaAllowsDeath: string;
  arenaNoDeath: string;
  arenaEmpty: string;
  viewArena: string;
  treasury: string;
  reputation: string;
  morale: string;
  facilities: string;
  infirmary: string;
  trainingGround: string;
  quarters: string;
  kitchen: string;
  level: string;
  gladiators: string;
  gladiatorCount: string;
  viewDetails: string;
  health: string;
  injured: string;
  sick: string;
  healthy: string;
  noGladiators: string;
  recruitGladiators: string;
  location: string;
  motto: string;
  createdAt: string;
}

interface Props {
  ludus: Ludus & { id: string };
  gladiators: NormalizedGladiator[];
  locale: string;
  translations: DashboardTranslations;
}

export default function DashboardClient({ ludus, gladiators, locale, translations: t }: Props) {
  const router = useRouter();
  const currentLocale = useLocale();

  const { data: realtimeLudus } = useRealtimeRow<Ludus & { id: string }>({
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

  const { data: realtimeGladiators } = useRealtimeCollection<NormalizedGladiator>({
    table: "gladiators",
    select:
      "id, ludusId, serverId, name, surname, avatarUrl, birthCity, health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive",
    match: { ludusId: ludus.id },
    initialData: gladiators,
    orderBy: { column: "createdAt", ascending: true },
    primaryKey: "id",
    transform: useCallback((row: Record<string, unknown>) => {
      const raw = row as Record<string, unknown> & { id?: unknown };
      const identifier = typeof raw.id === "string" ? raw.id : String(raw.id ?? "");
      return normalizeGladiator(identifier, raw, locale);
    }, [locale]),
  });

  const currentLudus = realtimeLudus ?? ludus;
  const currentGladiators = realtimeGladiators;


  return (
    <GameViewport>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />
      <div className="absolute inset-0 bg-[url('/images/arena-bg.jpg')] opacity-5 bg-cover bg-center" />

      {/* Scrollable Content Container */}
      <div
        className="relative z-10 h-full overflow-y-auto px-3 py-3"
        data-scrollable="true"
      >
        {/* Header */}
        <header className="max-w-7xl mx-auto mb-3">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent"
              >
                {currentLudus.name}
              </motion.h1>
              {currentLudus.motto && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-400 italic mt-1 text-xs"
                >
                  &ldquo;{currentLudus.motto}&rdquo;
                </motion.p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-3 pb-3">
          {/* Left Column - Ludus Overview */}
          <div className="lg:col-span-1 space-y-3" data-testid="dashboard-left-column">
            {/* Ludus Stats Card */}
            <LudusStats
              ludus={currentLudus}
              translations={{
                ludusOverview: t.ludusOverview,
                treasury: t.treasury,
                reputation: t.reputation,
                morale: t.morale,
                gladiatorCount: t.gladiatorCount,
              }}
            />

            {/* Arena Button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.push(`/${currentLocale}/arena`)}
              className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3 hover:border-amber-600/60 hover:bg-amber-900/10 transition-all duration-300 hover:scale-[1.02] group"
              data-testid="arena-button"
            >
              <div className="flex items-center justify-center gap-2">
                <Swords className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
                <span className="text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                  {t.arena}
                </span>
              </div>
            </motion.button>
          </div>

          {/* Right Column - Gladiators */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-amber-400">
                  {t.gladiators}
                </h2>
                <span className="text-gray-400 text-xs">
                  {currentGladiators.length} / {currentLudus.maxGladiators}
                </span>
              </div>

              {currentGladiators.length > 0 ? (
                <GladiatorGrid
                  gladiators={currentGladiators}
                  locale={locale}
                  translations={{
                    health: t.health,
                    injured: t.injured,
                    sick: t.sick,
                    healthy: t.healthy,
                    viewDetails: t.viewDetails,
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-3 text-sm">{t.noGladiators}</p>
                  <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-red-600 text-white text-sm font-bold rounded-lg hover:from-amber-500 hover:to-red-500 transform hover:scale-105 transition-all duration-200">
                    {t.recruitGladiators}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </GameViewport>
  );
}
