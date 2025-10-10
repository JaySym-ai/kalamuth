"use client";

import { motion } from "framer-motion";
import type { Quest } from "@/types/quest";

interface QuestResultsComponentProps {
  quest: Quest;
  translations: any;
}

export default function QuestResultsComponent({
  quest,
  translations: t,
}: QuestResultsComponentProps) {
  const isSuccess = !quest.questFailed && !quest.gladiatorDied;
  const statusColor = quest.gladiatorDied
    ? "from-red-900/30 to-red-800/30"
    : quest.questFailed
    ? "from-orange-900/30 to-orange-800/30"
    : "from-green-900/30 to-green-800/30";

  const statusBorder = quest.gladiatorDied
    ? "border-red-600/30"
    : quest.questFailed
    ? "border-orange-600/30"
    : "border-green-600/30";

  const statusText = quest.gladiatorDied
    ? "text-red-100"
    : quest.questFailed
    ? "text-orange-100"
    : "text-green-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Result Header */}
      <div className={`bg-gradient-to-r ${statusColor} border ${statusBorder} rounded-xl p-6 space-y-2`}>
        <h2 className={`text-2xl font-bold ${statusText}`}>
          {quest.gladiatorDied
            ? t.questFailed
            : quest.questFailed
            ? t.questFailed
            : t.questCompleted}
        </h2>
        <p className="text-gray-300">{quest.title}</p>
      </div>

      {/* Quest Narrative */}
      <div className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-amber-100">{t.whatHappened}</h3>
        <p className="text-gray-300 leading-relaxed">{quest.result}</p>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-2 gap-4">
        {quest.healthLost !== undefined && quest.healthLost > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-900/20 border border-red-600/30 rounded-lg p-4"
          >
            <div className="text-sm text-gray-400 mb-2">{t.healthLost}</div>
            <div className="text-2xl font-bold text-red-400">-{quest.healthLost}</div>
          </motion.div>
        )}

        {quest.reward !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-green-900/20 border border-green-600/30 rounded-lg p-4"
          >
            <div className="text-sm text-gray-400 mb-2">{t.rewardEarned}</div>
            <div className="text-2xl font-bold text-green-400">+{quest.reward}</div>
          </motion.div>
        )}

        {quest.injuryContracted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-4 col-span-2"
          >
            <div className="text-sm text-gray-400 mb-2">{t.injuryContracted}</div>
            <div className="text-amber-300">{quest.injuryContracted}</div>
          </motion.div>
        )}

        {quest.sicknessContracted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 col-span-2"
          >
            <div className="text-sm text-gray-400 mb-2">{t.sicknessContracted}</div>
            <div className="text-yellow-300">{quest.sicknessContracted}</div>
          </motion.div>
        )}

        {quest.gladiatorDied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-900/30 border border-red-600/30 rounded-lg p-4 col-span-2"
          >
            <div className="text-sm text-gray-400 mb-2">{t.gladiatorDied}</div>
            <div className="text-red-300 font-bold">The gladiator has fallen in battle.</div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

