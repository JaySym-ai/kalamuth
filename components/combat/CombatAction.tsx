"use client";

import { motion } from "framer-motion";
import { Swords, Shield, Heart, Skull, AlertTriangle, Trophy } from "lucide-react";
import type { CombatLogType } from "@/types/combat";

interface CombatActionProps {
  actionNumber: number;
  message: string;
  type: CombatLogType;
  isNew?: boolean;
  gladiator1Health?: number;
  gladiator2Health?: number;
}

const typeConfig: Record<CombatLogType, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  introduction: {
    icon: <Trophy className="w-5 h-5" />,
    color: "text-amber-400",
    bgColor: "bg-amber-900/20",
    borderColor: "border-amber-700/40",
  },
  action: {
    icon: <Swords className="w-5 h-5" />,
    color: "text-red-400",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-700/40",
  },
  injury: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: "text-orange-400",
    bgColor: "bg-orange-900/20",
    borderColor: "border-orange-700/40",
  },
  death: {
    icon: <Skull className="w-5 h-5" />,
    color: "text-gray-400",
    bgColor: "bg-gray-900/40",
    borderColor: "border-gray-700/60",
  },
  victory: {
    icon: <Trophy className="w-5 h-5" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-900/20",
    borderColor: "border-emerald-700/40",
  },
  system: {
    icon: <Shield className="w-5 h-5" />,
    color: "text-blue-400",
    bgColor: "bg-blue-900/20",
    borderColor: "border-blue-700/40",
  },
};

export default function CombatAction({
  actionNumber,
  message,
  type,
  isNew = false,
  gladiator1Health,
  gladiator2Health,
}: CombatActionProps) {
  const config = typeConfig[type] || typeConfig.system;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`
        relative p-4 rounded-lg border
        ${config.bgColor} ${config.borderColor}
        ${isNew ? "ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20" : ""}
      `}
    >
      {/* New indicator pulse */}
      {isNew && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${config.color}`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Action number badge */}
          {actionNumber > 0 && type === "action" && (
            <div className="inline-block mb-2 px-2 py-0.5 rounded-full bg-black/30 border border-amber-900/30">
              <span className="text-[10px] font-mono text-amber-400">
                ACTION #{actionNumber}
              </span>
            </div>
          )}

          {/* Message */}
          <p className="text-sm leading-relaxed text-gray-100">
            {message}
          </p>

          {/* Health indicators (if provided) */}
          {(gladiator1Health !== undefined || gladiator2Health !== undefined) && (
            <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-400">
              {gladiator1Health !== undefined && (
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400" />
                  <span>G1: {gladiator1Health}</span>
                </div>
              )}
              {gladiator2Health !== undefined && (
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400" />
                  <span>G2: {gladiator2Health}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Special effects for critical types */}
      {type === "death" && (
        <motion.div
          className="absolute inset-0 bg-red-500/10 rounded-lg pointer-events-none"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: 2 }}
        />
      )}

      {type === "victory" && (
        <motion.div
          className="absolute inset-0 bg-emerald-500/10 rounded-lg pointer-events-none"
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 1.5, repeat: 3 }}
        />
      )}
    </motion.div>
  );
}

