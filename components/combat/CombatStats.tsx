"use client";

import { motion } from "framer-motion";
import { Clock, Zap, Activity, Trophy } from "lucide-react";
import { formatDuration } from "@/lib/utils/time";

interface CombatStatsProps {
  currentAction: number;
  maxActions: number;
  elapsedSeconds: number;
  isComplete: boolean;
  winnerId?: string;
  winnerName?: string;
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
  winnerName,
  translations: t,
}: CombatStatsProps) {
  return (
    <div className="space-y-1">
      {/* Stats row - horizontal on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 justify-center px-1">
        {/* Action counter */}
        <StatCard
          icon={<Zap className="w-4 h-4" />}
          label={t.action}
          value={`${currentAction} / ${maxActions}`}
          color="text-amber-400"
          bgColor="bg-amber-900/20"
          borderColor="border-amber-700/40"
          dataTestId="combat-action-counter"
        />

        {/* Elapsed time */}
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label={t.elapsed}
          value={formatDuration(elapsedSeconds)}
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
          dataTestId="combat-status"
        />

        {/* Winner (if complete) */}
        {isComplete && winnerId && (
          <StatCard
            icon={<Trophy className="w-4 h-4" />}
            label={t.winner}
            value={winnerName ? `${winnerName} 🏆` : "🏆"}
            color="text-yellow-400"
            bgColor="bg-yellow-900/20"
            borderColor="border-yellow-700/40"
            dataTestId="combat-winner"
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
  dataTestId?: string;
}

function StatCard({ icon, label, value, color, bgColor, borderColor, dataTestId }: StatCardProps) {
  return (
    <motion.div
      data-testid={dataTestId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex-shrink-0 px-2 py-1 sm:px-responsive-2 sm:py-responsive-1 rounded-responsive-base border ${bgColor} ${borderColor} min-w-0`}
    >
      <div className="flex items-center gap-1 sm:gap-responsive-sm">
        <div className={`${color} icon-responsive-xs`}>{icon}</div>
        <div className="flex flex-col gap-responsive-1">
          <span className="text-[10px] sm:text-responsive-xs text-gray-400 uppercase tracking-wide leading-none whitespace-nowrap">
            {label}
          </span>
          <div className={`text-[12px] sm:text-responsive-sm font-bold ${color} leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[24vw] sm:max-w-none`}>
            {value}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

