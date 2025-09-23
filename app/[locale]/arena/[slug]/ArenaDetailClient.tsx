"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Swords, Skull, Shield, Users, MapPin, Scroll } from "lucide-react";

interface Props {
  arenaName: string;
  cityName: string;
  cityDescription: string;
  cityHistoricEvent: string;
  cityInhabitants: number;
  deathEnabled: boolean;
  locale: string;
  translations: {
    backToDashboard: string;
    arenaDetails: string;
    city: string;
    population: string;
    description: string;
    historicEvent: string;
    combatRules: string;
    deathEnabled: string;
    deathDisabled: string;
    deathEnabledDesc: string;
    deathDisabledDesc: string;
    enterArena: string;
    comingSoon: string;
  };
}

export default function ArenaDetailClient({
  arenaName,
  cityName,
  cityDescription,
  cityHistoricEvent,
  cityInhabitants,
  deathEnabled,
  locale,
  translations: t
}: Props) {
  const router = useRouter();

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

      {/* Arena Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
            {arenaName}
          </span>
        </h1>
        <div className="flex items-center gap-4 text-gray-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{cityName}</span>
          </div>
          {cityInhabitants > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{cityInhabitants.toLocaleString()} {t.population}</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* City Description */}
          {cityDescription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                <Scroll className="w-6 h-6" />
                {t.description}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-6">{cityDescription}</p>

              <h3 className="text-xl font-semibold text-amber-300 mb-3">{t.historicEvent}</h3>
              <p className="text-gray-400 leading-relaxed">{cityHistoricEvent}</p>
            </motion.div>
          )}

          {/* Combat Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6"
          >
            <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Swords className="w-6 h-6" />
              {t.combatRules}
            </h2>
            
            <div className={`p-6 rounded-xl border-2 ${
              deathEnabled
                ? 'bg-red-900/20 border-red-700/50'
                : 'bg-emerald-900/20 border-emerald-700/50'
            }`}>
              <div className="flex items-start gap-4">
                {deathEnabled ? (
                  <Skull className="w-12 h-12 text-red-400 flex-shrink-0" />
                ) : (
                  <Shield className="w-12 h-12 text-emerald-400 flex-shrink-0" />
                )}
                <div>
                  <h3 className={`text-xl font-bold mb-2 ${
                    deathEnabled ? 'text-red-300' : 'text-emerald-300'
                  }`}>
                    {deathEnabled ? t.deathEnabled : t.deathDisabled}
                  </h3>
                  <p className={`leading-relaxed ${
                    deathEnabled ? 'text-red-200/80' : 'text-emerald-200/80'
                  }`}>
                    {deathEnabled ? t.deathEnabledDesc : t.deathDisabledDesc}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6 sticky top-8"
          >
            <h2 className="text-xl font-bold text-amber-400 mb-6">{t.arenaDetails}</h2>
            
            {/* Arena Image Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-amber-900/30 to-red-900/30 rounded-xl mb-6 flex items-center justify-center border border-amber-700/30">
              <Swords className="w-16 h-16 text-amber-600/50" />
            </div>

            {/* Enter Arena Button */}
            <button
              disabled
              className="w-full py-4 rounded-lg font-bold text-lg bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 mb-3"
              data-testid="enter-arena-button"
            >
              {t.enterArena}
            </button>
            <p className="text-xs text-center text-gray-500 italic">{t.comingSoon}</p>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-amber-900/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{t.city}</span>
                <span className="text-amber-300 font-semibold">{cityName}</span>
              </div>
              {cityInhabitants > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{t.population}</span>
                  <span className="text-amber-300 font-semibold">{cityInhabitants.toLocaleString()}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
