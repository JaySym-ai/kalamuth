"use client";

import { motion } from "framer-motion";
import { Heart, Skull } from "lucide-react";

interface CombatHealthBarProps {
  currentHealth: number;
  maxHealth: number;
  gladiatorName: string;
  isPlayer?: boolean;
  isDead?: boolean;
}

export default function CombatHealthBar({
  currentHealth,
  maxHealth,
  gladiatorName,
  isPlayer = false,
  isDead = false,
}: CombatHealthBarProps) {
  const healthPercent = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
  
  // Color based on health percentage
  const getHealthColor = () => {
    if (isDead || healthPercent === 0) return "bg-gray-600";
    if (healthPercent > 60) return "bg-emerald-500";
    if (healthPercent > 30) return "bg-amber-500";
    return "bg-red-500";
  };

  const getHealthGlow = () => {
    if (isDead || healthPercent === 0) return "shadow-gray-500/50";
    if (healthPercent > 60) return "shadow-emerald-500/50";
    if (healthPercent > 30) return "shadow-amber-500/50";
    return "shadow-red-500/50";
  };

  return (
    <div className={`flex flex-col gap-2 ${isPlayer ? "items-start" : "items-end"}`}>
      {/* Gladiator name */}
      <div className="flex items-center gap-2">
        {isDead && <Skull className="w-4 h-4 text-red-500" />}
        <span className="text-sm font-semibold text-amber-100">
          {gladiatorName}
        </span>
        {!isDead && <Heart className="w-4 h-4 text-red-400" />}
      </div>

      {/* Health bar container */}
      <div className="w-full max-w-[200px] sm:max-w-[280px]">
        <div className="relative h-8 bg-black/40 rounded-lg border border-amber-900/30 overflow-hidden">
          {/* Health bar fill with animation */}
          <motion.div
            className={`absolute inset-y-0 left-0 ${getHealthColor()} shadow-lg ${getHealthGlow()}`}
            initial={{ width: "100%" }}
            animate={{ width: `${healthPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          
          {/* Pulse effect for low health */}
          {!isDead && healthPercent > 0 && healthPercent < 30 && (
            <motion.div
              className="absolute inset-0 bg-red-500/20"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}

          {/* Health text */}
          <div className="relative z-10 flex items-center justify-center h-full">
            <span className="text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {isDead ? "DEFEATED" : `${currentHealth} / ${maxHealth}`}
            </span>
          </div>
        </div>

        {/* Health percentage indicator */}
        <div className="mt-1 text-[10px] text-amber-100/60 text-center">
          {isDead ? "0%" : `${Math.round(healthPercent)}%`}
        </div>
      </div>
    </div>
  );
}

