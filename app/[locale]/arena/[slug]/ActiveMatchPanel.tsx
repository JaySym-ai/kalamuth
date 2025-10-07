"use client";

import { motion } from "framer-motion";
import { Swords, Heart, Trophy, Shield, Activity, Clock } from "lucide-react";
import type { CombatMatch, CombatantSummary, CombatLogEntry } from "@/types/combat";

interface Props {
  match: CombatMatch;
  player: CombatantSummary | null;
  opponent: CombatantSummary | null;
  logs: CombatLogEntry[];
  loading: boolean;
  error?: string | null;
  translations: {
    fightPanelTitle: string;
    yourGladiator: string;
    opponentGladiator: string;
    combatLog: string;
    awaitingCombat: string;
    noLogEntries: string;
    matchStatusPending: string;
    matchStatusInProgress: string;
    matchStatusCompleted: string;
    matchStatusCancelled: string;
    loadingMatch: string;
    failedToLoadMatch: string;
    healthStatus: string;
    rankingPoints: string;
    statusReady: string;
    statusIncapacitated: string;
  };
}

function GladiatorCard({
  gladiator,
  title,
  accent,
  translations: t,
}: {
  gladiator: CombatantSummary | null;
  title: string;
  accent: "player" | "opponent";
  translations: Pick<Props["translations"], "healthStatus" | "rankingPoints" | "statusReady" | "statusIncapacitated">;
}) {
  const accentClasses =
    accent === "player"
      ? "from-emerald-600/40 to-green-900/30 border-emerald-500/40"
      : "from-red-600/40 to-rose-900/30 border-red-500/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${accentClasses} p-6`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-300/80">{title}</p>
          <h3 className="mt-1 text-2xl font-bold text-white">
            {gladiator ? `${gladiator.name} ${gladiator.surname}` : "—"}
          </h3>
        </div>
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 border border-white/10">
            {gladiator?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gladiator.avatarUrl}
                alt={gladiator.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-white/80">
                {gladiator ? gladiator.name.charAt(0) : "?"}
              </span>
            )}
          </div>
          <div className="absolute inset-0 -z-10 blur-3xl opacity-40" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-300">
          <Trophy className="h-4 w-4 text-amber-300" />
          <div>
            <p className="text-xs uppercase text-gray-400">{t.rankingPoints}</p>
            <p className="text-lg font-semibold text-white">
              {gladiator ? gladiator.rankingPoints : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <Heart className="h-4 w-4 text-red-300" />
          <div>
            <p className="text-xs uppercase text-gray-400">{t.healthStatus}</p>
            <p className="text-lg font-semibold text-white">
              {gladiator ? gladiator.health : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <span
          className={`flex items-center gap-1 rounded-full px-3 py-1 ${
            gladiator?.alive ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"
          }`}
        >
          <Shield className="h-4 w-4" />
          {gladiator?.alive ? t.statusReady : t.statusIncapacitated}
        </span>
      </div>
    </motion.div>
  );
}

function formatTime(value: string | undefined) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export default function ActiveMatchPanel({
  match,
  player,
  opponent,
  logs,
  loading,
  error,
  translations: t,
}: Props) {
  const statusConfig: Record<CombatMatch["status"], { label: string; className: string }> = {
    pending: { label: t.matchStatusPending, className: "bg-yellow-500/20 text-yellow-200" },
    in_progress: { label: t.matchStatusInProgress, className: "bg-orange-500/20 text-orange-200" },
    completed: { label: t.matchStatusCompleted, className: "bg-emerald-500/20 text-emerald-200" },
    cancelled: { label: t.matchStatusCancelled, className: "bg-red-500/20 text-red-200" },
  };

  const status = statusConfig[match.status] ?? {
    label: match.status,
    className: "bg-gray-500/20 text-gray-200",
  };

  const orderedLogs = [...logs].sort((a, b) => {
    const left = new Date(a.createdAt).getTime();
    const right = new Date(b.createdAt).getTime();
    return left - right;
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-amber-900/40 bg-black/70 p-6"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-amber-300">
              <Swords className="h-6 w-6" />
              {t.fightPanelTitle}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {match.status === "pending" ? t.awaitingCombat : undefined}
            </p>
          </div>
          <div className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${status.className}`}>
            {status.label}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <GladiatorCard
            gladiator={player}
            title={t.yourGladiator}
            accent="player"
            translations={{
              healthStatus: t.healthStatus,
              rankingPoints: t.rankingPoints,
              statusReady: t.statusReady,
              statusIncapacitated: t.statusIncapacitated,
            }}
          />
          <GladiatorCard
            gladiator={opponent}
            title={t.opponentGladiator}
            accent="opponent"
            translations={{
              healthStatus: t.healthStatus,
              rankingPoints: t.rankingPoints,
              statusReady: t.statusReady,
              statusIncapacitated: t.statusIncapacitated,
            }}
          />
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{formatTime(match.matchedAt)}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-900/30 bg-black/70 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-amber-300">
            <Activity className="h-5 w-5" />
            {t.combatLog}
          </h3>
          {loading && (
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-amber-200">
              <Swords className="h-4 w-4 animate-pulse" />
              {t.loadingMatch}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800/50 bg-red-900/20 p-3 text-sm text-red-200">
            {t.failedToLoadMatch}
          </div>
        )}

        {orderedLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-900/40 bg-black/40 p-6 text-center text-sm text-gray-400">
            {loading ? t.awaitingCombat : t.noLogEntries}
          </div>
        ) : (
          <ul className="space-y-3">
            {orderedLogs.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3 rounded-xl border border-amber-900/30 bg-black/50 p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-900/30 text-amber-200">
                  <Swords className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(entry.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-200">{entry.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}

