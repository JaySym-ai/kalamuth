"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Quest } from "@/types/quest";

interface QuestHistoryComponentProps {
  quests: Quest[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: any;
}

export default function QuestHistoryComponent({
  quests,
  translations: t,
}: QuestHistoryComponentProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Show only last 3 completed quests
  const recentQuests = quests
    .filter(q => q.status === 'completed' || q.status === 'failed' || q.status === 'cancelled')
    .slice(0, 3);

  if (recentQuests.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-900/20 border-green-600/30 text-green-300";
      case "failed":
        return "bg-orange-900/20 border-orange-600/30 text-orange-300";
      case "cancelled":
        return "bg-gray-900/20 border-gray-600/30 text-gray-300";
      default:
        return "bg-gray-900/20 border-gray-600/30 text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return t.questCompleted;
      case "failed":
        return t.questFailed;
      case "cancelled":
        return t.questCancelled;
      default:
        return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl overflow-hidden"
    >
      {/* Header with minimize/maximize button */}
      <div 
        className="flex justify-between items-center p-6 pb-4 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <h3 className="text-lg font-bold text-amber-100">{t.questHistory}</h3>
        <motion.div
          animate={{ rotate: isMinimized ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-amber-400"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </motion.div>
      </div>

      {/* Quest list with animation */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-6"
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentQuests.map((quest, index) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-black/40 border border-gray-700/30 rounded-lg p-4 space-y-2"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-amber-100">{quest.title}</h4>
                <p className="text-sm text-gray-400 mt-1">{quest.description}</p>
              </div>
              <span className={`px-3 py-1 rounded text-xs font-bold border ${getStatusColor(quest.status)}`}>
                {getStatusLabel(quest.status)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-500">{t.reward}:</span>
                <span className="text-amber-300 ml-1 font-bold">{quest.reward}</span>
              </div>
              <div>
                <span className="text-gray-500">{t.danger}:</span>
                <span className="text-amber-300 ml-1 font-bold">{quest.dangerPercentage}%</span>
              </div>
              <div>
                <span className="text-gray-500">{t.date}:</span>
                <span className="text-gray-400 ml-1">
                  {new Date(quest.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {quest.result && (
              <p className="text-sm text-gray-300 italic border-t border-gray-700/30 pt-2 mt-2">
                &quot;{quest.result}&quot;
              </p>
            )}
          </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

