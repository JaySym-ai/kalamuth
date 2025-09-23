"use client";

import type { Arena } from "@/types/arena";
import { motion } from "framer-motion";
import { Swords, Lock, Skull, Shield } from "lucide-react";

interface Props {
  isOpen: boolean;
  arenas: Arena[];
  translations: {
    arena: string;
    arenaStatus: string;
    arenaClosed: string;
    arenaOpen: string;
    arenaHint: string;
    arenaCityLabel: string;
    arenaAllowsDeath: string;
    arenaNoDeath: string;
    arenaEmpty: string;
  };
}

export default function ArenaStatus({ isOpen, arenas, translations: t }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6"
      data-testid="arena-status-card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
          <Swords className="w-5 h-5" />
          {t.arena}
        </h3>
      </div>

      <div className={`p-4 rounded-lg ${isOpen ? "bg-green-900/20 border border-green-700/50" : "bg-red-900/20 border border-red-700/50"}`}>
        <div className="flex items-center gap-3">
          {isOpen ? (
            <Swords className="w-8 h-8 text-green-400" />
          ) : (
            <Lock className="w-8 h-8 text-red-400" />
          )}
          <div>
            <p className="text-sm text-gray-400">{t.arenaStatus}</p>
            <p className={`font-bold ${isOpen ? "text-green-400" : "text-red-400"}`}>
              {isOpen ? t.arenaOpen : t.arenaClosed}
            </p>
          </div>
        </div>
      </div>

      {!isOpen && (
        <div className="mt-4 rounded-lg border border-amber-700/30 bg-amber-900/10 p-3">
          <p className="text-xs text-amber-400/80">{t.arenaHint}</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {arenas.length > 0 ? (
          arenas.map((arena, index) => (
            <motion.div
              key={`${arena.name}-${arena.city}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="flex items-start justify-between rounded-xl border border-amber-900/40 bg-black/40 p-4"
            >
              <div>
                <p className="text-lg font-semibold text-white">{arena.name}</p>
                <p className="text-sm text-gray-400">
                  {t.arenaCityLabel}: <span className="text-amber-300">{arena.city}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {arena.deathEnabled ? (
                  <>
                    <Skull className="h-5 w-5 text-red-400" />
                    <span className="text-red-200">{t.arenaAllowsDeath}</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 text-emerald-300" />
                    <span className="text-emerald-200">{t.arenaNoDeath}</span>
                  </>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <p className="text-sm italic text-gray-400">{t.arenaEmpty}</p>
        )}
      </div>
    </motion.div>
  );
}
