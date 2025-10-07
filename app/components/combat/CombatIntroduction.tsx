"use client";

import { motion } from "framer-motion";
import { Swords, MapPin, Heart } from "lucide-react";
import Image from "next/image";
import type { CombatGladiator } from "@/types/combat";

interface CombatIntroductionProps {
  gladiator1: CombatGladiator;
  gladiator2: CombatGladiator;
  arenaName: string;
  translations: {
    versus: string;
    arena: string;
    health: string;
    ranking: string;
    birthplace: string;
    personality: string;
    weakness: string;
  };
}

export default function CombatIntroduction({
  gladiator1,
  gladiator2,
  arenaName,
  translations: t,
}: CombatIntroductionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative p-6 rounded-xl bg-gradient-to-b from-amber-950/40 to-black/60 border border-amber-900/30 overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.3),transparent_50%)]" />
      </div>

      {/* Arena name */}
      <div className="relative z-10 text-center mb-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-amber-700/40"
        >
          <MapPin className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-100">{t.arena}</span>
          <span className="text-sm text-gray-300">{arenaName}</span>
        </motion.div>
      </div>

      {/* Gladiators */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        {/* Gladiator 1 */}
        <GladiatorCard gladiator={gladiator1} translations={t} delay={0.3} />

        {/* VS Divider */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
          className="flex items-center justify-center"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-amber-500/20 rounded-full blur-xl"
            />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-amber-600 border-2 border-amber-400 shadow-lg shadow-amber-500/50">
              <Swords className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Gladiator 2 */}
        <GladiatorCard gladiator={gladiator2} translations={t} delay={0.4} isRight />
      </div>
    </motion.div>
  );
}

interface GladiatorCardProps {
  gladiator: CombatGladiator;
  translations: {
    health: string;
    ranking: string;
    birthplace: string;
    personality: string;
    weakness: string;
  };
  delay: number;
  isRight?: boolean;
}

function GladiatorCard({ gladiator, translations: t, delay, isRight = false }: GladiatorCardProps) {
  return (
    <motion.div
      initial={{ x: isRight ? 50 : -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center gap-3"
    >
      {/* Avatar */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-red-500/30 rounded-full blur-lg"
        />
        <div className="relative w-24 h-24 rounded-full border-4 border-amber-600 overflow-hidden bg-black/40 shadow-xl">
          {gladiator.avatarUrl ? (
            <Image
              src={gladiator.avatarUrl}
              alt={`${gladiator.name} ${gladiator.surname}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-amber-400">
              ⚔️
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-amber-100">
          {gladiator.name}
        </h3>
        <p className="text-sm text-gray-400">
          {gladiator.surname}
        </p>
      </div>

      {/* Stats */}
      <div className="w-full space-y-2 text-xs">
        <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-black/30 border border-amber-900/20">
          <span className="text-gray-400">{t.health}</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {gladiator.health}
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-black/30 border border-amber-900/20">
          <span className="text-gray-400">{t.ranking}</span>
          <span className="font-semibold text-amber-400">
            {gladiator.rankingPoints}
          </span>
        </div>
      </div>

      {/* Traits preview */}
      <div className="w-full space-y-1 text-[10px] text-gray-500">
        <div className="truncate">
          <span className="text-gray-600">{t.birthplace}:</span> {gladiator.birthCity}
        </div>
        <div className="truncate">
          <span className="text-gray-600">{t.personality}:</span> {gladiator.personality.slice(0, 40)}...
        </div>
        <div className="truncate">
          <span className="text-gray-600">{t.weakness}:</span> {gladiator.weakness.slice(0, 40)}...
        </div>
      </div>
    </motion.div>
  );
}

