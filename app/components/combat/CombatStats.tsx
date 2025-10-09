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



  return (
    <div className="space-y-1">
      {/* Stats row - horizontal on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
        {/* Action counter */}
        <StatCard
          icon={<Zap className="w-4 h-4" />}
          label={t.action}
          value={`${currentAction} / ${maxActions}`}
          color="text-amber-400"
          bgColor="bg-amber-900/20"
          borderColor="border-amber-700/40"
        />

        {/* Elapsed time */}
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label={t.elapsed}
          value={formatTime(elapsedSeconds)}
          color="text-blue-400"
          bgColor="bg-blue-900/20"
          borderColor="border-blue-700/40"
        />

        {/* Status */}
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label={t.status}
          value={isComplete ? t.statusComplete : t.statusInProgress}
          color={isComplete ? "text-emerald-400" : "text-orange-400"}
          bgColor={isComplete ? "bg-emerald-900/20" : "bg-orange-900/20"}
          borderColor={isComplete ? "border-emerald-700/40" : "border-orange-700/40"}
        />

        {/* Winner (if complete) */}
        {isComplete && winnerId && (
          <StatCard
            icon={<Trophy className="w-4 h-4" />}
            label={t.winner}
            value="🏆"
            color="text-yellow-400"
            bgColor="bg-yellow-900/20"
            borderColor="border-yellow-700/40"
          />
        )}
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
      className={`flex-shrink-0 px-2 py-1.5 rounded-lg border ${bgColor} ${borderColor} min-w-fit`}
    >
      <div className="flex items-center gap-1">
        <div className={color}>{icon}</div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] text-gray-400 uppercase tracking-wide leading-none">
            {label}
          </span>
          <div className={`text-sm font-bold ${color} leading-none`}>
            {value}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

