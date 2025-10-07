"use client";

import { motion } from "framer-motion";
import { Clock, Zap, Activity, Trophy } from "lucide-react";

interface CombatStatsProps {
  currentAction: number;
  maxActions: number;
  elapsedSeconds: number;
  isComplete: boolean;
  winnerId?: string;
  translations: {
    action: string;
    elapsed: string;
    status: string;
    statusInProgress: string;
    statusComplete: string;
    winner: string;
  };
}

export default function CombatStats({
  currentAction,
  maxActions,
  elapsedSeconds,
  isComplete,
  winnerId,
  translations: t,
}: CombatStatsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.min(100, (currentAction / maxActions) * 100);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Action counter */}
      <StatCard
        icon={<Zap className="w-5 h-5" />}
        label={t.action}
        value={`${currentAction} / ${maxActions}`}
        color="text-amber-400"
        bgColor="bg-amber-900/20"
        borderColor="border-amber-700/40"
      />

      {/* Elapsed time */}
      <StatCard
        icon={<Clock className="w-5 h-5" />}
        label={t.elapsed}
        value={formatTime(elapsedSeconds)}
        color="text-blue-400"
        bgColor="bg-blue-900/20"
        borderColor="border-blue-700/40"
      />

      {/* Status */}
      <StatCard
        icon={<Activity className="w-5 h-5" />}
        label={t.status}
        value={isComplete ? t.statusComplete : t.statusInProgress}
        color={isComplete ? "text-emerald-400" : "text-orange-400"}
        bgColor={isComplete ? "bg-emerald-900/20" : "bg-orange-900/20"}
        borderColor={isComplete ? "border-emerald-700/40" : "border-orange-700/40"}
      />

      {/* Winner (if complete) */}
      {isComplete && winnerId && (
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label={t.winner}
          value="🏆"
          color="text-yellow-400"
          bgColor="bg-yellow-900/20"
          borderColor="border-yellow-700/40"
        />
      )}

      {/* Progress bar (full width) */}
      <div className="col-span-2 sm:col-span-4">
        <div className="relative h-2 bg-black/40 rounded-full border border-amber-900/30 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600 to-red-600 shadow-lg shadow-amber-500/50"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="mt-1 text-[10px] text-center text-gray-500">
          {Math.round(progressPercent)}% complete
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

function StatCard({ icon, label, value, color, bgColor, borderColor }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg border ${bgColor} ${borderColor}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={color}>{icon}</div>
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className={`text-lg font-bold ${color}`}>
        {value}
      </div>
    </motion.div>
  );
}

