"use client";

import { motion } from "framer-motion";
import { Swords, Lock } from "lucide-react";

interface Props {
  isOpen: boolean;
  translations: {
    arena: string;
    arenaStatus: string;
    arenaClosed: string;
    arenaOpen: string;
    arenaHint: string;
  };
}

export default function ArenaStatus({ isOpen, translations: t }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
          <Swords className="w-5 h-5" />
          {t.arena}
        </h3>
      </div>

      <div className={`p-4 rounded-lg ${isOpen ? 'bg-green-900/20 border border-green-700/50' : 'bg-red-900/20 border border-red-700/50'}`}>
        <div className="flex items-center gap-3">
          {isOpen ? (
            <Swords className="w-8 h-8 text-green-400" />
          ) : (
            <Lock className="w-8 h-8 text-red-400" />
          )}
          <div>
            <p className="text-sm text-gray-400">{t.arenaStatus}</p>
            <p className={`font-bold ${isOpen ? 'text-green-400' : 'text-red-400'}`}>
              {isOpen ? t.arenaOpen : t.arenaClosed}
            </p>
          </div>
        </div>
      </div>

      {!isOpen && (
        <div className="mt-4 p-3 bg-amber-900/10 border border-amber-700/30 rounded-lg">
          <p className="text-xs text-amber-400/80">
            {t.arenaHint}
          </p>
        </div>
      )}
    </motion.div>
  );
}
