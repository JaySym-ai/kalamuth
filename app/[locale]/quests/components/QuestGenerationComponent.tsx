"use client";

import { motion } from "framer-motion";

interface QuestGenerationComponentProps {
  isGenerating: boolean;
  onGenerate: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: any;
}

export default function QuestGenerationComponent({
  isGenerating,
  onGenerate,
  translations: t,
}: QuestGenerationComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 space-y-4"
    >
      {isGenerating ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
          <p className="text-center text-amber-200">{t.generating}</p>
          <p className="text-center text-gray-400 text-sm">{t.loadingVolunteer}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-amber-100">{t.readyForAdventure}</h2>
          <p className="text-gray-300">
            {t.generateQuestDescription}
          </p>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
          >
            {t.generateQuest}
          </button>
        </div>
      )}
    </motion.div>
  );
}

