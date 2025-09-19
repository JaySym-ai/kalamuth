"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Ludus } from "@/types/ludus";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";
import LogoutButton from "@/app/components/auth/LogoutButton";
import GladiatorDetailModal from "./GladiatorDetailModal";
import ArenaStatus from "./ArenaStatus";
import LudusStats from "./LudusStats";
import GladiatorGrid from "./GladiatorGrid";

interface DashboardTranslations {
  title: string;
  ludusOverview: string;
  arena: string;
  arenaStatus: string;
  arenaClosed: string;
  arenaOpen: string;
  arenaHint: string;
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
  const [selectedGladiator, setSelectedGladiator] = useState<NormalizedGladiator | null>(null);

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />
      <div className="fixed inset-0 bg-[url('/images/arena-bg.jpg')] opacity-5 bg-cover bg-center" />
      
      {/* Content Container */}
      <div className="relative z-10 px-4 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),24px)]">
        {/* Header */}
        <header className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent"
              >
                {ludus.name}
              </motion.h1>
              {ludus.motto && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-400 italic mt-2"
                >
                  "{ludus.motto}"
                </motion.p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Ludus Overview */}
          <div className="lg:col-span-1 space-y-6" data-testid="dashboard-left-column">
            {/* Ludus Stats Card */}
            <LudusStats
              ludus={ludus}
              translations={{
                ludusOverview: t.ludusOverview,
                treasury: t.treasury,
                reputation: t.reputation,
                morale: t.morale,
                facilities: t.facilities,
                infirmary: t.infirmary,
                trainingGround: t.trainingGround,
                quarters: t.quarters,
                kitchen: t.kitchen,
                level: t.level,
                location: t.location,
                gladiatorCount: t.gladiatorCount,
              }}
            />

            {/* Arena Status Card */}
            <ArenaStatus
              isOpen={false}
              translations={{
                arena: t.arena,
                arenaStatus: t.arenaStatus,
                arenaClosed: t.arenaClosed,
                arenaOpen: t.arenaOpen,
                arenaHint: t.arenaHint,
              }}
            />
          </div>

          {/* Right Column - Gladiators */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-amber-400">
                  {t.gladiators}
                </h2>
                <span className="text-gray-400">
                  {gladiators.length} / {ludus.maxGladiators}
                </span>
              </div>

              {gladiators.length > 0 ? (
                <GladiatorGrid 
                  gladiators={gladiators}
                  onGladiatorClick={setSelectedGladiator}
                  translations={{
                    health: t.health,
                    injured: t.injured,
                    sick: t.sick,
                    healthy: t.healthy,
                    viewDetails: t.viewDetails,
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">{t.noGladiators}</p>
                  <button className="px-6 py-3 bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold rounded-lg hover:from-amber-500 hover:to-red-500 transform hover:scale-105 transition-all duration-200">
                    {t.recruitGladiators}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Gladiator Detail Modal */}
      <AnimatePresence>
        {selectedGladiator && (
          <GladiatorDetailModal
            gladiator={selectedGladiator}
            onClose={() => setSelectedGladiator(null)}
            locale={locale}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
