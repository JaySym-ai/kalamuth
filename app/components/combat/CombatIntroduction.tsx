"use client";

import { motion } from "framer-motion";
import { Swords, MapPin, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CombatGladiator } from "@/types/combat";

interface CombatIntroductionProps {
  gladiator1: CombatGladiator;
  gladiator2: CombatGladiator;
  arenaName: string;
  maxHealth1?: number;
  maxHealth2?: number;
  locale: string;
  arenaSlug: string;
  backToArenaText: string;
  translations: {
    versus: string;
    arena: string;
  };
}

export default function CombatIntroduction({
  gladiator1,
  gladiator2,
  arenaName,
  maxHealth1,
  maxHealth2,
  locale,
  arenaSlug,
  backToArenaText,
  translations: t,
}: CombatIntroductionProps) {
  console.log("CombatIntroduction props:", { locale, arenaSlug, backToArenaText });
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
      <div className="relative z-10 text-center mb-4 sm:mb-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-black/40 border border-amber-700/40"
        >
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
          <span className="text-xs sm:text-sm font-semibold text-amber-100">{t.arena}</span>
          <span className="text-xs sm:text-sm text-gray-300">{arenaName}</span>
        </motion.div>
      </div>

      {/* Gladiators */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        {/* Gladiator 1 */}
        <GladiatorCard gladiator={gladiator1} maxHealth={maxHealth1 || gladiator1.health} delay={0.3} />

        {/* VS Divider */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
          className="flex flex-col items-center justify-center gap-3 sm:gap-4"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-amber-500/20 rounded-full blur-xl"
            />
            <div className="relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-600 to-amber-600 border-2 border-amber-400 shadow-lg shadow-amber-500/50">
              <Swords className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>

          {/* Back to Arena Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-2"
           >
             <Link
              href={`/${locale}/arena/${arenaSlug}`}
              className="inline-flex items-center gap-1 px-3 sm:px-4 py-2 text-xs sm:text-sm text-amber-400 hover:text-amber-300 transition-colors border border-amber-700/40 rounded-full bg-black/40 hover:bg-black/60 shadow-lg shadow-amber-500/20"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              {backToArenaText}
            </Link>
          </motion.div>
        </motion.div>

        {/* Gladiator 2 */}
        <GladiatorCard gladiator={gladiator2} maxHealth={maxHealth2 || gladiator2.health} delay={0.4} isRight />
      </div>
    </motion.div>
  );
}

interface GladiatorCardProps {
  gladiator: CombatGladiator;
  maxHealth: number;
  delay: number;
  isRight?: boolean;
}

function GladiatorCard({ gladiator, maxHealth, delay, isRight = false }: GladiatorCardProps) {
  const healthPercent = Math.max(0, Math.min(100, (gladiator.health / maxHealth) * 100));

  const getHealthColor = () => {
    if (healthPercent > 60) return "bg-emerald-500";
    if (healthPercent > 30) return "bg-amber-500";
    return "bg-red-500";
  };

  const getHealthGlow = () => {
    if (healthPercent > 60) return "shadow-emerald-500/50";
    if (healthPercent > 30) return "shadow-amber-500/50";
    return "shadow-red-500/50";
  };

  return (
    <motion.div
      initial={{ x: isRight ? 50 : -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center gap-2"
    >
      {/* Avatar */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-red-500/30 rounded-full blur-lg"
        />
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-3 sm:border-4 border-amber-600 overflow-hidden bg-black/40 shadow-xl">
          {gladiator.avatarUrl ? (
            <Image
              src={gladiator.avatarUrl}
              alt={`${gladiator.name} ${gladiator.surname}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl md:text-4xl text-amber-400">
              ⚔️
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="text-center">
        <h3 className="text-sm sm:text-base md:text-lg font-bold text-amber-100">
          {gladiator.name} {gladiator.surname}
        </h3>
      </div>

      {/* Health Bar */}
      <div className="w-full max-w-[140px] sm:max-w-[160px]">
        <div className="relative h-5 sm:h-6 bg-black/40 rounded-lg border border-amber-900/30 overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 ${getHealthColor()} shadow-lg ${getHealthGlow()}`}
            initial={{ width: "100%" }}
            animate={{ width: `${healthPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <div className="relative z-10 flex items-center justify-center h-full">
            <span className="text-[0.65rem] sm:text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {Math.round(healthPercent)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

