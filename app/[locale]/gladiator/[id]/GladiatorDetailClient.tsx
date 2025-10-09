"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Swords, Brain, Star, MapPin, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";
import { useRealtimeRow } from "@/lib/supabase/realtime";

interface Props {
  gladiator: NormalizedGladiator;
  locale: string;
  translations: {
    backToDashboard: string;
    from: string;
    combatStats: string;
    strength: string;
    agility: string;
    dexterity: string;
    speed: string;
    chance: string;
    intelligence: string;
    charisma: string;
    loyalty: string;
    personality: string;
    lifeGoal: string;
    personalityTrait: string;
    likes: string;
    dislikes: string;
    background: string;
    backstory: string;
    notableHistory: string;
    physicalCondition: string;
    specialTraits: string;
    weakness: string;
    fear: string;
    handicap: string;
    uniquePower: string;
  };
}

export default function GladiatorDetailClient({ gladiator, locale, translations: t }: Props) {
  const router = useRouter();

  // Real-time gladiator data updates
  const { data: realtimeGladiator } = useRealtimeRow<NormalizedGladiator>({
    table: "gladiators",
    select: "*",
    match: { id: gladiator.id },
    initialData: gladiator,
    primaryKey: "id",
  });

  const currentGladiator = realtimeGladiator ?? gladiator;

  const statIcons: Record<string, LucideIcon> = {
    strength: Swords,
    agility: Star,
    dexterity: Star,
    speed: Star,
    chance: Star,
    intelligence: Brain,
    charisma: Heart,
    loyalty: Heart,
  };

  return (
    <div className="min-h-screen pb-[max(env(safe-area-inset-bottom),24px)] pt-8 px-4 max-w-6xl mx-auto">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push(`/${locale}/dashboard`)}
        className="mb-6 flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
        data-testid="back-to-dashboard"
      >
        <ArrowLeft className="w-5 h-5" />
        {t.backToDashboard}
      </motion.button>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-r from-amber-900/20 to-red-900/20 border-b border-amber-900/30">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center text-4xl font-bold text-white">
                {currentGladiator.name.charAt(0)}
              </div>
              {!currentGladiator.alive && (
                <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                  <span className="text-red-500 text-2xl">✝</span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-black text-amber-400">
                {currentGladiator.name} {currentGladiator.surname}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{t.from} {currentGladiator.birthCity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{currentGladiator.health} HP</span>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex gap-2 mt-3">
                {currentGladiator.injury && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-orange-900/30 border border-orange-700/50 rounded-full text-orange-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{currentGladiator.injury}</span>
                  </div>
                )}
                {currentGladiator.sickness && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-yellow-900/30 border border-yellow-700/50 rounded-full text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{currentGladiator.sickness}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Combat Stats */}
          <section>
            <h2 className="text-xl font-bold text-amber-400 mb-4">{t.combatStats}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentGladiator.stats).map(([stat, description]) => {
                const Icon = statIcons[stat] || Star;
                return (
                  <div key={stat} className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-amber-400" />
                      <span className="font-semibold text-amber-400 capitalize">{t[stat as keyof typeof t] || stat}</span>
                    </div>
                    <p className="text-sm text-gray-300">{description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Personality & Background */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold text-amber-400 mb-4">{t.personality}</h2>
              <div className="space-y-3">
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">{t.lifeGoal}</h3>
                  <p className="text-sm text-gray-300">{currentGladiator.lifeGoal}</p>
                </div>
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">{t.personalityTrait}</h3>
                  <p className="text-sm text-gray-300">{currentGladiator.personality}</p>
                </div>
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">{t.likes}</h3>
                  <p className="text-sm text-gray-300">{currentGladiator.likes}</p>
                </div>
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">{t.dislikes}</h3>
                  <p className="text-sm text-gray-300">{currentGladiator.dislikes}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-amber-400 mb-4">{t.background}</h2>
              <div className="space-y-3">
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">{t.backstory}</h3>
                  <p className="text-sm text-gray-300">{currentGladiator.backstory}</p>
                </div>
                {currentGladiator.notableHistory && (
                  <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-1">{t.notableHistory}</h3>
                    <p className="text-sm text-gray-300">{currentGladiator.notableHistory}</p>
                  </div>
                )}
                {currentGladiator.physicalCondition && (
                  <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-1">{t.physicalCondition}</h3>
                    <p className="text-sm text-gray-300">{currentGladiator.physicalCondition}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Special Traits */}
          <section>
            <h2 className="text-xl font-bold text-amber-400 mb-4">{t.specialTraits}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentGladiator.weakness && (
                <div className="bg-black/40 border border-red-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-1">{t.weakness}</h3>
                  <p className="text-sm text-gray-300">{currentGladiator.weakness}</p>
                </div>
              )}
              {currentGladiator.fear && (
                <div className="bg-black/40 border border-purple-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-400 mb-1">{t.fear}</h3>
                  <p className="text-sm text-gray-300">{currentGladiator.fear}</p>
                </div>
              )}
              {currentGladiator.handicap && (
                <div className="bg-black/40 border border-orange-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-orange-400 mb-1">{t.handicap}</h3>
                  <p className="text-sm text-gray-300">{currentGladiator.handicap}</p>
                </div>
              )}
              {currentGladiator.uniquePower && (
                <div className="bg-black/40 border border-green-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-400 mb-1">{t.uniquePower}</h3>
                  <p className="text-sm text-gray-300">{currentGladiator.uniquePower}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
