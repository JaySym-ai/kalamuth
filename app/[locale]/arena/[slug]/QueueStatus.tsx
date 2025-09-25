"use client";

import { motion } from "framer-motion";
import { Users, Clock, Swords, Trophy } from "lucide-react";
import type { CombatQueueEntry } from "@/types/combat";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";

interface QueueEntryWithGladiator extends CombatQueueEntry {
  gladiator?: NormalizedGladiator;
}

interface Props {
  queue: QueueEntryWithGladiator[];
  userGladiatorId: string | null;
  translations: {
    currentQueue: string;
    noGladiatorsInQueue: string;
    queuePosition: string;
    rankingPoints: string;
    queuedAt: string;
    waitingForMatch: string;
    matchmaking: string;
  };
}

export default function QueueStatus({
  queue,
  userGladiatorId,
  translations: t,
}: Props) {
  const userPosition = queue.findIndex(entry => entry.gladiatorId === userGladiatorId);
  const isUserInQueue = userPosition >= 0;

  const formatQueueTime = (queuedAt: string) => {
    const now = new Date();
    const queued = new Date(queuedAt);
    const diffMs = now.getTime() - queued.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  return (
    <div className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
          <Users className="w-6 h-6" />
          {t.currentQueue}
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-900/20 rounded-full">
          <span className="text-amber-300 font-semibold">{queue.length}</span>
          <span className="text-gray-400 text-sm">waiting</span>
        </div>
      </div>

      {/* User's Position Banner */}
      {isUserInQueue && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-600/50 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-300 font-semibold">{t.queuePosition}</p>
              <p className="text-2xl font-bold text-white">#{userPosition + 1}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">{t.waitingForMatch}</p>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 justify-end mt-1"
              >
                <Swords className="w-5 h-5 text-amber-400" />
                <span className="text-amber-300 text-sm">{t.matchmaking}</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Queue List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {queue.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t.noGladiatorsInQueue}</p>
          </div>
        ) : (
          queue.map((entry, index) => {
            const isUser = entry.gladiatorId === userGladiatorId;
            const gladiator = entry.gladiator;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isUser
                    ? "bg-amber-900/20 border-amber-600/50 shadow-md"
                    : "bg-black/40 border-gray-700/40"
                }`}
                data-testid={`queue-entry-${entry.id}`}
              >
                <div className="flex items-center gap-4">
                  {/* Position Badge */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    isUser ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300"
                  }`}>
                    {index + 1}
                  </div>

                  {/* Gladiator Info */}
                  <div className="flex-1 min-w-0">
                    {gladiator ? (
                      <>
                        <h4 className={`font-semibold truncate ${isUser ? "text-amber-200" : "text-white"}`}>
                          {gladiator.name} {gladiator.surname}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span className="text-gray-400">{entry.rankingPoints}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Heart className="w-3 h-3 text-red-400" />
                            <span className="text-gray-400">{gladiator.health}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="font-semibold text-gray-400">Unknown Gladiator</h4>
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span className="text-gray-400">{entry.rankingPoints}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Queue Time */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatQueueTime(entry.queuedAt)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
