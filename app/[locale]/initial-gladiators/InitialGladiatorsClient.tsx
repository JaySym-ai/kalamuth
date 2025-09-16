"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot, query, where, orderBy, limit as fbLimit } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";

interface GladiatorStats {
  strength: number;
  agility: number;
  dexterity: number;
  speed: number;
  chance: number;
  intelligence: number;
  charisma: number;
  loyalty: number;
}

interface Gladiator {
  id: string;
  name: string;
  surname: string;
  avatarUrl: string;
  health: number;
  alive: boolean;
  stats: GladiatorStats;
  lifeGoal: string;
  personality: string;
  backstory: string;
  weakness: string;
  fear: string;
  likes: string;
  dislikes: string;
  birthCity: string;
  physicalCondition: string;
  notableHistory: string;
}

interface Props {
  gladiators: Gladiator[];
  ludusName?: string;
  ludusId: string;
  serverId?: string;
  minRequired: number;
}

export default function InitialGladiatorsClient({ gladiators, ludusName, ludusId, minRequired }: Props) {
  const t = useTranslations("InitialGladiators");
  const locale = useLocale();
  const router = useRouter();
  const [selectedGladiator, setSelectedGladiator] = useState<Gladiator | null>(null);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Gladiator[]>(gladiators || []);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);

  // Live Firestore subscription for gladiators of this ludus
  useEffect(() => {
    if (!ludusId) return;
    const db = getClientDb();
    const q = query(collection(db, "gladiators"), where("ludusId", "==", ludusId));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as unknown as Gladiator[];
      setList(items);
    });
    return () => unsub();
  }, [ludusId]);

  const currentCount = list.length;
  const missingCount = Math.max(0, minRequired - currentCount);

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
    } catch (e) {
      setGenError("error");
    } finally {
      setGenerating(false);
    }
  }

  // Watch latest generation job for this ludus for better error/progress messaging
  useEffect(() => {
    if (!ludusId) return;
    const db = getClientDb();
    const jobsCol = collection(db, "jobs");
    const q = query(
      jobsCol,
      where("ludusId", "==", ludusId),
      where("type", "==", "generateInitialGladiators"),
      orderBy("createdAt", "desc"),
      fbLimit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const j = snap.docs[0].data() as any;
        setJobStatus(j.status ?? null);
      }
    });
    return () => unsub();
  }, [ludusId]);

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

  const getStatColor = (value: number) => {
    if (value >= 80) return "text-green-400";
    if (value >= 60) return "text-yellow-400";
    if (value >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getStatBarWidth = (value: number) => `${value}%`;

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

      {missingCount > 0 && (
        <div aria-hidden="true" data-testid="gladiator-skeletons" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {Array.from({ length: missingCount }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="relative">
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
          ))}
        </div>
      )}


      {/* Gladiators Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {list.map((gladiator, index) => (
          <motion.div
            key={gladiator.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="relative"
          >
            <button
              onClick={() => setSelectedGladiator(gladiator)}
              className="w-full text-left group"
              data-testid={`gladiator-${gladiator.id}`}
            >
              <div className="bg-black/40 backdrop-blur-sm border border-red-900/30 rounded-xl p-6 hover:border-red-700/50 transition-all duration-300 transform hover:scale-105">
                {/* Gladiator Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-amber-400">
                      {gladiator.name} {gladiator.surname}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {t("from")} {gladiator.birthCity}
                    </p>
                  </div>
                  <span className="text-4xl">{gladiator.avatarUrl}</span>
                </div>

                {/* Health Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{t("health")}</span>
                    <span className="text-red-400">{gladiator.health} HP</span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-red-400"
                      style={{ width: `${(gladiator.health / 300) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Key Stats Preview */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t("stats.strength")}</span>
                    <span className={getStatColor(gladiator.stats.strength)}>
                      {gladiator.stats.strength}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t("stats.speed")}</span>
                    <span className={getStatColor(gladiator.stats.speed)}>
                      {gladiator.stats.speed}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t("stats.agility")}</span>
                    <span className={getStatColor(gladiator.stats.agility)}>
                      {gladiator.stats.agility}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t("stats.loyalty")}</span>
                    <span className={getStatColor(gladiator.stats.loyalty)}>
                      {gladiator.stats.loyalty}
                    </span>
                  </div>
                </div>

                {/* Personality Preview */}
                <p className="text-sm text-gray-300 italic line-clamp-2">
                  "{gladiator.personality}"
                </p>

                {/* View Details Hint */}
                <div className="mt-4 text-center text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t("clickToViewDetails")}
                </div>
              </div>
            </button>
          </motion.div>
        ))}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedGladiator(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-zinc-900 to-black border border-red-900/50 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-amber-400">
                    {selectedGladiator.name} {selectedGladiator.surname}
                  </h2>
                  <p className="text-gray-400">{t("from")} {selectedGladiator.birthCity}</p>
                </div>
                <button
                  onClick={() => setSelectedGladiator(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                  data-testid="close-modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* All Stats */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-red-400 mb-3">{t("combatStats")}</h3>
                <div className="space-y-2">
                  {Object.entries(selectedGladiator.stats).map(([stat, value]) => (
                    <div key={stat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400 capitalize">{t(`stats.${stat}`)}</span>
                        <span className={getStatColor(value as number)}>{value}</span>
                      </div>
                      <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-red-600 transition-all duration-300"
                          style={{ width: getStatBarWidth(value as number) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Character Details */}
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="text-amber-400 font-semibold mb-1">{t("details.backstory")}</h4>
                  <p className="text-gray-300">{selectedGladiator.backstory}</p>
                </div>
                <div>
                  <h4 className="text-amber-400 font-semibold mb-1">{t("details.personality")}</h4>
                  <p className="text-gray-300">{selectedGladiator.personality}</p>
                </div>
                <div>
                  <h4 className="text-amber-400 font-semibold mb-1">{t("details.lifeGoal")}</h4>
                  <p className="text-gray-300">{selectedGladiator.lifeGoal}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-amber-400 font-semibold mb-1">{t("details.likes")}</h4>
                    <p className="text-gray-300">{selectedGladiator.likes}</p>
                  </div>
                  <div>
                    <h4 className="text-amber-400 font-semibold mb-1">{t("details.dislikes")}</h4>
                    <p className="text-gray-300">{selectedGladiator.dislikes}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-amber-400 font-semibold mb-1">{t("details.weakness")}</h4>
                    <p className="text-gray-300">{selectedGladiator.weakness}</p>
                  </div>
                  <div>
                    <h4 className="text-amber-400 font-semibold mb-1">{t("details.fear")}</h4>
                    <p className="text-gray-300">{selectedGladiator.fear}</p>
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
