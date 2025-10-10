"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Quest } from "@/types/quest";

interface QuestOngoingComponentProps {
  quest: Quest;
  onCancel: () => void;
  translations: any;
}

export default function QuestOngoingComponent({
  quest,
  onCancel,
  translations: t,
}: QuestOngoingComponentProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("1:00:00");
  const [progress, setProgress] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!quest.startedAt) return;

    const interval = setInterval(() => {
      const startTime = new Date(quest.startedAt!).getTime();
      const now = new Date().getTime();
      const elapsed = now - startTime;
      const totalDuration = 3600000; // 1 hour in milliseconds
      const remaining = Math.max(0, totalDuration - elapsed);

      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      setTimeRemaining(`${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
      setProgress(Math.min(100, (elapsed / totalDuration) * 100));

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quest.startedAt]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Quest In Progress Header */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-600/30 rounded-xl p-6 space-y-4">
        <h2 className="text-2xl font-bold text-blue-100">{t.questInProgress}</h2>
        <p className="text-gray-300">{quest.title}</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">{t.timeRemaining}</span>
          <span className="text-2xl font-bold text-amber-300">{timeRemaining}</span>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>

        <p className="text-sm text-gray-400 text-center">
          {t.questOngoing}
        </p>
      </div>

      {/* Quest Details */}
      <div className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-amber-100">{t.questDetails}</h3>
        <p className="text-gray-300">{quest.description}</p>
      </div>

      {/* Cancel Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowCancelConfirm(true)}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
      >
        {t.cancelQuest}
      </motion.button>

      <p className="text-xs text-gray-500 text-center">{t.cancelCost}</p>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black/90 border border-red-900/50 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl shadow-red-900/20"
          >
            <h3 className="text-xl font-bold text-red-100">{t.cancelQuest}</h3>
            <div className="space-y-2">
              <p className="text-red-200 font-medium">
                {t.cancelCost}
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                {t.cancelConfirmMessage}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-[1.02] border border-gray-500/50"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  onCancel();
                }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-[1.02] border border-red-500/50"
              >
                {t.cancelConfirm}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

