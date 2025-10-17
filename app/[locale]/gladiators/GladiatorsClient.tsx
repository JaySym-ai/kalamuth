"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { Ludus } from "@/types/ludus";
import { normalizeGladiator, type NormalizedGladiator } from "@/lib/gladiator/normalize";
import { useRealtimeCollection } from "@/lib/supabase/realtime";
import { useLudusRealtime } from "@/lib/ludus/hooks";
import PageLayout from "@/components/layout/PageLayout";
import GladiatorCard from "@/components/gladiator/GladiatorCard";

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

export default function GladiatorsClient({ ludus, gladiators, locale, translations: t }: Props) {
  const router = useRouter();
  const currentLocale = useLocale();

  useLudusRealtime(ludus);

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

  const currentGladiators = realtimeGladiators;

  return (
    <PageLayout
      title={t.title}
      backHref={`/${currentLocale}/dashboard`}
      icon="/assets/icon/gladiators.png"
      background="arena"
    >
      {/* Gladiators Grid */}
      {currentGladiators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[clamp(1rem,2vw,1.5rem)]">
          {currentGladiators.map((gladiator, index) => (
            <GladiatorCard
              key={gladiator.id}
              gladiator={gladiator}
              locale={locale}
              translations={{
                health: t.health,
                injured: t.injured,
                sick: t.sick,
                healthy: t.healthy,
              }}
              variant="full"
              animationIndex={index}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-[clamp(2rem,8vw,4rem)]">
          <div className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-[clamp(0.75rem,2vw,1rem)] p-[clamp(2rem,5vw,3rem)]">
            <h3 className="text-[clamp(1.125rem,3vw,1.5rem)] font-bold text-amber-400 mb-[clamp(1rem,2vw,1.5rem)]">{t.noGladiators}</h3>
            <button
              onClick={() => router.push(`/${currentLocale}/tavern`)}
              className="px-[clamp(1.5rem,3vw,2rem)] py-[clamp(0.75rem,2vw,1rem)] bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold text-[clamp(0.875rem,2vw,1rem)] rounded-lg hover:from-amber-500 hover:to-red-500 transform hover:scale-105 transition-all duration-200"
            >
              {t.recruitGladiators}
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}