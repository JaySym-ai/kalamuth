"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, AlertCircle, Activity } from "lucide-react";
import type { Ludus } from "@/types/ludus";
import { GLADIATOR_HEALTH_MAX } from "@/types/gladiator";
import { normalizeGladiator, type NormalizedGladiator } from "@/lib/gladiator/normalize";
import { useRealtimeCollection, useRealtimeRow } from "@/lib/supabase/realtime";
import GameViewport from "@/components/layout/GameViewport";

interface GladiatorsTranslations {
  title: string;
  gladiators: string;
  gladiatorCount: string;
  viewDetails: string;
  health: string;
  injured: string;
  sick: string;
  healthy: string;
  noGladiators: string;
  recruitGladiators: string;
  backToDashboard: string;
}

interface Props {
  ludus: Ludus & { id: string };
  gladiators: NormalizedGladiator[];
  locale: string;
  translations: GladiatorsTranslations;
}

function GladiatorCard({ gladiator, locale, translations: t }: { 
  gladiator: NormalizedGladiator; 
  locale: string; 
  translations: Pick<GladiatorsTranslations, 'viewDetails' | 'health' | 'injured' | 'sick' | 'healthy'>;
}) {
  const router = useRouter();

  const getHealthStatus = (gladiator: NormalizedGladiator) => {
    if (gladiator.injury) return { label: t.injured, color: 'text-orange-400', icon: AlertCircle };
    if (gladiator.sickness) return { label: t.sick, color: 'text-yellow-400', icon: Activity };
    return { label: t.healthy, color: 'text-green-400', icon: Heart };
  };

  const healthStatus = getHealthStatus(gladiator);
  const StatusIcon = healthStatus.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => router.push(`/${locale}/gladiator/${gladiator.id}`)}
      className="group cursor-pointer"
      data-testid={`gladiator-${gladiator.id}`}
    >
      <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 rounded-xl p-4 hover:border-amber-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/20">
        {/* Avatar and Basic Info */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center text-2xl font-bold text-white">
              {gladiator.name.charAt(0)}
            </div>
            {!gladiator.alive && (
              <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-lg">✝</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-bold text-amber-400 truncate">
              {gladiator.name} {gladiator.surname}
            </h4>
            <p className="text-sm text-gray-400 truncate">
              {gladiator.birthCity}
            </p>

            {/* Health Status */}
            <div className="flex items-center gap-2 mt-2">
              <StatusIcon className={`w-4 h-4 ${healthStatus.color}`} />
              <span className={`text-sm ${healthStatus.color}`}>
                {healthStatus.label}
              </span>
              {gladiator.injuryTimeLeftHours && (
                <span className="text-sm text-gray-500">
                  ({gladiator.injuryTimeLeftHours}h)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Health Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">{t.health}</span>
            <span className="text-gray-400">{gladiator.currentHealth} / {gladiator.health} HP</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                gladiator.currentHealth === gladiator.health 
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : gladiator.currentHealth > gladiator.health * 0.5
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}
              style={{ width: `${(gladiator.currentHealth / gladiator.health) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round((gladiator.currentHealth / gladiator.health) * 100)}% health
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />

        {/* View Details Button (appears on hover) */}
        <button
          className="absolute bottom-3 right-3 px-3 py-1 bg-amber-600/80 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-label={t.viewDetails}
        >
          {t.viewDetails}
        </button>
      </div>
    </motion.div>
  );
}

export default function GladiatorsClient({ ludus, gladiators, locale, translations: t }: Props) {
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
      "id, ludusId, serverId, name, surname, avatarUrl, birthCity, health, current_health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive",
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
        <header className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => router.push(`/${currentLocale}/dashboard`)}
                className="p-2 bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-lg hover:border-amber-600/60 hover:bg-amber-900/10 transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5 text-amber-400" />
              </motion.button>
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
                  {currentLudus.name} • {currentGladiators.length} / {currentLudus.maxGladiators} {t.gladiatorCount}
                </motion.p>
              </div>
            </div>
          </div>
        </header>

        {/* Gladiators Grid */}
        <div className="max-w-7xl mx-auto">
          {currentGladiators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentGladiators.map((gladiator, index) => (
                <motion.div
                  key={gladiator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GladiatorCard
                    gladiator={gladiator}
                    locale={locale}
                    translations={{
                      viewDetails: t.viewDetails,
                      health: t.health,
                      injured: t.injured,
                      sick: t.sick,
                      healthy: t.healthy,
                    }}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-8">
                <h3 className="text-xl font-bold text-amber-400 mb-4">{t.noGladiators}</h3>
                <button 
                  onClick={() => router.push(`/${currentLocale}/tavern`)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold rounded-lg hover:from-amber-500 hover:to-red-500 transform hover:scale-105 transition-all duration-200"
                >
                  {t.recruitGladiators}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </GameViewport>
  );
}