"use client";

import { motion } from "framer-motion";
import type { Quest } from "@/types/quest";

interface QuestDetailsComponentProps {
  quest: Quest;
  onAccept: () => void;
  onReroll: () => void;
  translations: any;
}

export default function QuestDetailsComponent({
  quest,
  onAccept,
  onReroll,
  translations: t,
}: QuestDetailsComponentProps) {
  const getRiskColor = (percentage: number) => {
    if (percentage >= 70) return "text-red-400";
    if (percentage >= 40) return "text-yellow-400";
    return "text-green-400";
  };

  const getRiskBgColor = (percentage: number) => {
    if (percentage >= 70) return "bg-red-900/20";
    if (percentage >= 40) return "bg-yellow-900/20";
    return "bg-green-900/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Quest Title and Description */}
      <div className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 space-y-4">
        <h2 className="text-3xl font-bold text-amber-100">{quest.title}</h2>
        <p className="text-gray-300 leading-relaxed">{quest.description}</p>
      </div>

      {/* Quest Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-4"
        >
          <div className="text-sm text-gray-400 mb-2">{t.reward}</div>
          <div className="text-3xl font-bold text-amber-300">{quest.reward}</div>
          <div className="text-xs text-gray-500">{t.sestertii}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-4"
        >
          <div className="text-sm text-gray-400 mb-2">{t.dangerLevel}</div>
          <div className={`text-3xl font-bold ${getRiskColor(quest.dangerPercentage)}`}>
            {quest.dangerPercentage}%
          </div>
          <div className="text-xs text-gray-500">{t.riskOfInjury}</div>
        </motion.div>
      </div>

      {/* Risk Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${getRiskBgColor(quest.dangerPercentage)} border border-amber-900/30 rounded-lg p-3`}
        >
          <div className="text-xs text-gray-400 mb-1">{t.riskOfInjury}</div>
          <div className={`text-lg font-bold ${getRiskColor(quest.dangerPercentage)}`}>
            {quest.dangerPercentage}%
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${getRiskBgColor(quest.sicknessPercentage)} border border-amber-900/30 rounded-lg p-3`}
        >
          <div className="text-xs text-gray-400 mb-1">{t.riskOfSickness}</div>
          <div className={`text-lg font-bold ${getRiskColor(quest.sicknessPercentage)}`}>
            {quest.sicknessPercentage}%
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${getRiskBgColor(quest.deathPercentage)} border border-amber-900/30 rounded-lg p-3`}
        >
          <div className="text-xs text-gray-400 mb-1">{t.riskOfDeath}</div>
          <div className={`text-lg font-bold ${getRiskColor(quest.deathPercentage)}`}>
            {quest.deathPercentage}%
          </div>
        </motion.div>
      </div>

      {/* Volunteer Section */}
      {quest.gladiatorId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-600/30 rounded-xl p-6 space-y-3"
        >
          <h3 className="text-lg font-bold text-amber-100">{t.volunteer}</h3>
          <p className="text-gray-300 italic">"{quest.volunteerMessage}"</p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={onAccept}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
        >
          {t.acceptQuest}
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={onReroll}
          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
        >
          {t.rerollQuest}
        </motion.button>
      </div>

      <p className="text-xs text-gray-500 text-center">{t.rerollCost}</p>
    </motion.div>
  );
}

