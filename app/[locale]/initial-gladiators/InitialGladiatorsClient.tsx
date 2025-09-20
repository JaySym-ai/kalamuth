"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeGladiator, type NormalizedGladiator } from "@/lib/gladiator/normalize";

interface Props {
  gladiators: NormalizedGladiator[];
  ludusName?: string;
  ludusId: string;
  serverId?: string;
  minRequired: number;
}

export default function InitialGladiatorsClient({ gladiators, ludusId, minRequired }: Props) {
  const t = useTranslations("InitialGladiators");
  const locale = useLocale();
  const router = useRouter();
  const [selectedGladiator, setSelectedGladiator] = useState<NormalizedGladiator | null>(null);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<NormalizedGladiator[]>(gladiators || []);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);


  const currentCount = list.length;

  async function handleGenerateMissing() {
    try {
      setGenerating(true);
      setGenError(null);
      const missing = Math.max(0, minRequired - currentCount) || 1;
      await fetch("/api/gladiators/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ludusId, count: missing })
      });
    } catch {
      setGenError("error");
    } finally {
      setGenerating(false);
    }
  }


  const handleContinue = async () => {
    setLoading(true);

    try {
      // Mark onboarding as complete
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingDone: true }),
      });

      // Navigate to dashboard
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setLoading(false);
    }
  };


  return (
    <div>
      {/* Generation Indicator */}
      {currentCount < minRequired && (
        <div
          className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 max-w-screen-sm mx-auto mb-6 bg-amber-900/10 border border-amber-700/30 rounded-lg"
          data-testid="generating-indicator"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-300 font-medium flex items-center gap-2" role="status" aria-live="polite">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {t("generatingWaiting")}
              </p>
              <p className="text-xs text-amber-200/80 mt-1">{t("stillNeed", { count: Math.max(0, minRequired - currentCount) })}</p>
              {jobStatus === 'pending' && (
                <p className="text-xs text-amber-200/90 mt-1" data-testid="job-status-pending">{t("jobInProgress")}</p>
              )}
              {jobStatus === 'completed_with_errors' && (
                <p className="text-xs text-red-400 mt-1" data-testid="job-status-error">{t("jobError")}</p>
              )}
              {genError && (
                <p className="text-xs text-red-400 mt-1">{t("startFailed")}</p>
              )}
            </div>
            <button
              onClick={handleGenerateMissing}
              disabled={generating || jobStatus === 'pending'}
              className="h-12 px-4 rounded-md bg-gradient-to-r from-amber-600 to-red-600 text-white text-sm font-semibold disabled:opacity-60"
              data-testid="generate-remaining"
            >
              {t("generateRemaining")}
            </button>
          </div>
        </div>
      )}

      {/* Unified Gladiators Grid (stable 3 slots) */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" data-testid="gladiators-grid">
        {Array.from({ length: minRequired }).map((_, idx) => {
          const gladiator = list[idx];
          if (!gladiator) {
            // Placeholder skeleton for empty slot
            return (
              <div key={`slot-skeleton-${idx}`} className="relative" aria-hidden="true" data-testid="gladiator-skeleton">
                <div className="bg-black/40 backdrop-blur-sm border border-red-900/30 rounded-xl p-6 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="h-5 w-40 bg-amber-700/30 rounded mb-2"></div>
                      <div className="h-3 w-24 bg-amber-700/20 rounded"></div>
                    </div>
                    <div className="h-10 w-10 bg-amber-700/20 rounded-full"></div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <div className="h-3 w-16 bg-red-700/20 rounded"></div>
                      <div className="h-3 w-10 bg-red-700/30 rounded"></div>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-gradient-to-r from-red-600/60 to-red-400/60"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="h-3 w-20 bg-amber-700/20 rounded"></div>
                    <div className="h-3 w-12 bg-amber-700/30 rounded"></div>
                    <div className="h-3 w-16 bg-amber-700/20 rounded"></div>
                    <div className="h-3 w-10 bg-amber-700/30 rounded"></div>
                  </div>
                  <div className="h-3 w-48 bg-amber-700/20 rounded"></div>
                </div>
              </div>
            );
          }

          // Render gladiator card for filled slot
          return (
            <motion.div
              key={gladiator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="relative"
            >
              <button
                onClick={() => setSelectedGladiator(gladiator)}
                className="w-full text-left group"
                data-testid={`gladiator-${gladiator.id}`}
              >
                <div className="bg-gradient-to-b from-zinc-900/90 to-black/90 backdrop-blur-sm border border-red-900/30 rounded-xl overflow-hidden hover:border-amber-600/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-900/20">
                  {/* Card Header with Avatar */}
                  <div className="relative bg-gradient-to-r from-red-900/20 to-amber-900/20 p-4 border-b border-red-900/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                          {gladiator.name} {gladiator.surname}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {gladiator.birthCity}
                        </p>
                      </div>
                      <div className="text-3xl filter drop-shadow-lg">{gladiator.avatarUrl}</div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Health Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 uppercase tracking-wider">{t("health")}</span>
                        <span className="text-red-400 font-bold">{gladiator.health}/{300}</span>
                      </div>
                      <div className="h-2 bg-black/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 animate-pulse"
                          style={{ width: `${(gladiator.health / 300) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex flex-wrap gap-2">
                      {gladiator.injury && (
                        <span className="px-2 py-1 text-xs bg-red-900/30 border border-red-700/30 rounded-full text-red-400">
                          🩹 {gladiator.injury}
                        </span>
                      )}
                      {gladiator.sickness && (
                        <span className="px-2 py-1 text-xs bg-yellow-900/30 border border-yellow-700/30 rounded-full text-yellow-400">
                          🤒 {gladiator.sickness}
                        </span>
                      )}
                      {gladiator.uniquePower && (
                        <span className="px-2 py-1 text-xs bg-purple-900/30 border border-purple-700/30 rounded-full text-purple-400">
                          ⚡ {t("hasPower")}
                        </span>
                      )}
                      {gladiator.handicap && (
                        <span className="px-2 py-1 text-xs bg-gray-900/30 border border-gray-700/30 rounded-full text-gray-400">
                          ♿ {t("hasHandicap")}
                        </span>
                      )}
                    </div>

                    {/* Key Stats Preview - Show 2 most important */}
                    <div className="space-y-2">
                      <div className="bg-black/30 rounded-lg p-2">
                        <div className="text-xs text-amber-500 uppercase tracking-wider mb-1">{t("stats.strength")}</div>
                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{gladiator.stats.strength}</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-2">
                        <div className="text-xs text-amber-500 uppercase tracking-wider mb-1">{t("stats.speed")}</div>
                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{gladiator.stats.speed}</p>
                      </div>
                    </div>

                    {/* Personality Teaser */}
                    <div className="border-t border-red-900/20 pt-3">
                      <p className="text-xs text-gray-400 italic line-clamp-2 leading-relaxed">
                        &ldquo;{gladiator.personality}&rdquo;
                      </p>
                    </div>

                    {/* View More Indicator */}
                    <div className="flex items-center justify-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-amber-500 flex items-center gap-1">
                        {t("clickToViewDetails")}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          disabled={loading || currentCount < minRequired}
          className="relative px-12 py-5 bg-gradient-to-r from-amber-600 to-red-600 rounded-lg font-bold text-xl text-white shadow-2xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50"
          data-testid="continue-to-dashboard"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t("loading")}
            </span>
          ) : (
            t("continueButton")
          )}
        </button>
      </div>

      {/* Gladiator Detail Modal */}
      <AnimatePresence>
        {selectedGladiator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedGladiator(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-black border border-red-900/50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Background */}
              <div className="relative bg-gradient-to-r from-red-900/30 via-amber-900/30 to-red-900/30 p-6 border-b border-red-900/30">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <span className="text-5xl filter drop-shadow-xl">{selectedGladiator.avatarUrl}</span>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                        {selectedGladiator.name} {selectedGladiator.surname}
                      </h2>
                      <p className="text-gray-400 flex items-center gap-1 mt-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {t("from")} {selectedGladiator.birthCity}
                      </p>
                      {/* Health Bar in Header */}
                      <div className="mt-3 w-64">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">{t("health")}</span>
                          <span className="text-red-400 font-bold">{selectedGladiator.health}/300 HP</span>
                        </div>
                        <div className="h-2 bg-black/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500"
                            style={{ width: `${(selectedGladiator.health / 300) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedGladiator(null)}
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                    data-testid="close-modal"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body with Scrollable Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Status & Conditions */}
                {(selectedGladiator.injury || selectedGladiator.sickness || selectedGladiator.handicap || selectedGladiator.uniquePower) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-amber-400 mb-3">{t("details.conditions")}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedGladiator.injury && (
                        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                          <div className="text-xs text-red-500 uppercase tracking-wider mb-1">🩹 {t("details.injury")}</div>
                          <p className="text-sm text-red-300">{selectedGladiator.injury}</p>
                          {selectedGladiator.injuryTimeLeftHours && (
                            <p className="text-xs text-red-400 mt-1">{t("details.recoveryTime", { hours: selectedGladiator.injuryTimeLeftHours })}</p>
                          )}
                        </div>
                      )}
                      {selectedGladiator.sickness && (
                        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
                          <div className="text-xs text-yellow-500 uppercase tracking-wider mb-1">🤒 {t("details.sickness")}</div>
                          <p className="text-sm text-yellow-300">{selectedGladiator.sickness}</p>
                        </div>
                      )}
                      {selectedGladiator.handicap && (
                        <div className="bg-gray-900/20 border border-gray-700/30 rounded-lg p-3">
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">♿ {t("details.handicap")}</div>
                          <p className="text-sm text-gray-300">{selectedGladiator.handicap}</p>
                        </div>
                      )}
                      {selectedGladiator.uniquePower && (
                        <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-3">
                          <div className="text-xs text-purple-500 uppercase tracking-wider mb-1">⚡ {t("details.uniquePower")}</div>
                          <p className="text-sm text-purple-300">{selectedGladiator.uniquePower}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Combat Statistics */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-amber-400 mb-3">{t("combatStats")}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedGladiator.stats).map(([stat, value]) => (
                      <div key={stat} className="bg-black/30 rounded-lg p-3 border border-red-900/20">
                        <div className="text-xs text-amber-500 uppercase tracking-wider mb-1">{t(`stats.${stat}`)}</div>
                        <p className="text-sm text-gray-300 leading-relaxed">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Physical & Historical Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-amber-400 mb-3">{t("details.physicalHistory")}</h3>
                  <div className="space-y-3">
                    {selectedGladiator.physicalCondition && (
                      <div className="bg-black/30 rounded-lg p-3 border border-red-900/20">
                        <div className="text-xs text-amber-500 uppercase tracking-wider mb-1">{t("details.physicalCondition")}</div>
                        <p className="text-sm text-gray-300">{selectedGladiator.physicalCondition}</p>
                      </div>
                    )}
                    {selectedGladiator.notableHistory && (
                      <div className="bg-black/30 rounded-lg p-3 border border-red-900/20">
                        <div className="text-xs text-amber-500 uppercase tracking-wider mb-1">{t("details.notableHistory")}</div>
                        <p className="text-sm text-gray-300">{selectedGladiator.notableHistory}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Character & Personality */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-amber-400 mb-3">{t("details.character")}</h3>
                  <div className="space-y-3">
                    <div className="bg-black/30 rounded-lg p-3 border border-red-900/20">
                      <div className="text-xs text-amber-500 uppercase tracking-wider mb-1">{t("details.backstory")}</div>
                      <p className="text-sm text-gray-300 leading-relaxed">{selectedGladiator.backstory}</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-red-900/20">
                      <div className="text-xs text-amber-500 uppercase tracking-wider mb-1">{t("details.personality")}</div>
                      <p className="text-sm text-gray-300 leading-relaxed">{selectedGladiator.personality}</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-red-900/20">
                      <div className="text-xs text-amber-500 uppercase tracking-wider mb-1">{t("details.lifeGoal")}</div>
                      <p className="text-sm text-gray-300 leading-relaxed">{selectedGladiator.lifeGoal}</p>
                    </div>
                  </div>
                </div>

                {/* Preferences & Traits */}
                <div>
                  <h3 className="text-lg font-bold text-amber-400 mb-3">{t("details.preferences")}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                      <div className="text-xs text-green-500 uppercase tracking-wider mb-1">👍 {t("details.likes")}</div>
                      <p className="text-sm text-green-300">{selectedGladiator.likes}</p>
                    </div>
                    <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                      <div className="text-xs text-red-500 uppercase tracking-wider mb-1">👎 {t("details.dislikes")}</div>
                      <p className="text-sm text-red-300">{selectedGladiator.dislikes}</p>
                    </div>
                    <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-3">
                      <div className="text-xs text-orange-500 uppercase tracking-wider mb-1">⚠️ {t("details.weakness")}</div>
                      <p className="text-sm text-orange-300">{selectedGladiator.weakness}</p>
                    </div>
                    <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-3">
                      <div className="text-xs text-purple-500 uppercase tracking-wider mb-1">😨 {t("details.fear")}</div>
                      <p className="text-sm text-purple-300">{selectedGladiator.fear}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
