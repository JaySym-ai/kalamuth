"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Loader2 } from "lucide-react";
import CombatAction from "./CombatAction";
import CombatHealthBar from "./CombatHealthBar";
import CombatStats from "./CombatStats";
import type { CombatLogEntry, BattleState } from "@/types/combat";

interface CombatStreamProps {
  matchId: string;
  gladiator1Name: string;
  gladiator2Name: string;
  gladiator1MaxHealth: number;
  gladiator2MaxHealth: number;
  maxActions: number;
  locale: string;
  translations: {
    startBattle: string;
    pauseBattle: string;
    resumeBattle: string;
    resetBattle: string;
    loading: string;
    error: string;
    combatLog: string;
    live: string;
    action: string;
    elapsed: string;
    status: string;
    statusInProgress: string;
    statusComplete: string;
    winner: string;
  };
}

export default function CombatStream({
  matchId,
  gladiator1Name,
  gladiator2Name,
  gladiator1MaxHealth,
  gladiator2MaxHealth,
  maxActions,
  locale,
  translations: t,
}: CombatStreamProps) {
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const [battleState, setBattleState] = useState<BattleState>({
    matchId,
    actionNumber: 0,
    gladiator1Health: gladiator1MaxHealth,
    gladiator2Health: gladiator2MaxHealth,
    isComplete: false,
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [latestLogId, setLatestLogId] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Timer for elapsed time
  useEffect(() => {
    if (isStreaming && !isPaused && !battleState.isComplete) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStreaming, isPaused, battleState.isComplete]);

  const startBattle = () => {
    if (isStreaming) return;

    setIsStreaming(true);
    setIsPaused(false);
    setError(null);

    // Create EventSource for SSE
    const eventSource = new EventSource(
      `/api/combat/match/${matchId}/start?locale=${locale}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "log") {
          const log: CombatLogEntry = data.log;
          setLogs((prev) => [...prev, log]);
          setLatestLogId(log.id);

          // Update battle state if health data is provided
          if (log.gladiator1Health !== undefined || log.gladiator2Health !== undefined) {
            setBattleState((prev) => ({
              ...prev,
              actionNumber: log.actionNumber,
              gladiator1Health: log.gladiator1Health ?? prev.gladiator1Health,
              gladiator2Health: log.gladiator2Health ?? prev.gladiator2Health,
            }));
          }
        } else if (data.type === "complete") {
          setBattleState((prev) => ({
            ...prev,
            isComplete: true,
            winnerId: data.winnerId,
            winnerMethod: data.winnerMethod,
          }));
          setIsStreaming(false);
          eventSource.close();
        } else if (data.type === "error") {
          setError(data.message || "An error occurred during combat");
          setIsStreaming(false);
          eventSource.close();
        }
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      setError("Connection lost. Please refresh the page.");
      setIsStreaming(false);
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  };

  const pauseBattle = () => {
    setIsPaused(true);
    // Note: We can't actually pause the server-side stream, but we can pause the UI updates
  };

  const resumeBattle = () => {
    setIsPaused(false);
  };

  const resetBattle = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setLogs([]);
    setBattleState({
      matchId,
      actionNumber: 0,
      gladiator1Health: gladiator1MaxHealth,
      gladiator2Health: gladiator2MaxHealth,
      isComplete: false,
    });
    setIsStreaming(false);
    setIsPaused(false);
    setError(null);
    setElapsedSeconds(0);
    setLatestLogId(null);
  };

  return (
    <div className="space-y-6">
      {/* Health bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CombatHealthBar
          currentHealth={battleState.gladiator1Health}
          maxHealth={gladiator1MaxHealth}
          gladiatorName={gladiator1Name}
          isPlayer
          isDead={battleState.gladiator1Health <= 0}
        />
        <CombatHealthBar
          currentHealth={battleState.gladiator2Health}
          maxHealth={gladiator2MaxHealth}
          gladiatorName={gladiator2Name}
          isDead={battleState.gladiator2Health <= 0}
        />
      </div>

      {/* Stats */}
      <CombatStats
        currentAction={battleState.actionNumber}
        maxActions={maxActions}
        elapsedSeconds={elapsedSeconds}
        isComplete={battleState.isComplete}
        winnerId={battleState.winnerId}
        translations={t}
      />

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isStreaming && !battleState.isComplete && (
          <button
            onClick={startBattle}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-red-600 text-white font-semibold hover:from-amber-500 hover:to-red-500 transition-all shadow-lg shadow-amber-500/30"
            data-testid="start-battle"
          >
            <Play className="w-5 h-5" />
            {t.startBattle}
          </button>
        )}

        {isStreaming && !battleState.isComplete && (
          <button
            onClick={isPaused ? resumeBattle : pauseBattle}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-500 hover:to-purple-500 transition-all"
            data-testid="pause-battle"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            {isPaused ? t.resumeBattle : t.pauseBattle}
          </button>
        )}

        {(battleState.isComplete || logs.length > 0) && (
          <button
            onClick={resetBattle}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-all"
            data-testid="reset-battle"
          >
            <RotateCcw className="w-5 h-5" />
            {t.resetBattle}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-900/20 border border-red-700/40 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Combat log */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-amber-100 flex items-center gap-2">
            {t.combatLog}
            {isStreaming && !battleState.isComplete && (
              <span className="flex items-center gap-1 text-xs text-red-400 animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                {t.live}
              </span>
            )}
          </h3>
        </div>

        {/* Log container */}
        <div
          ref={logContainerRef}
          className="h-[400px] overflow-y-auto space-y-3 p-4 rounded-lg bg-black/40 border border-amber-900/30"
        >
          {logs.length === 0 && !isStreaming && (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              {t.startBattle}
            </div>
          )}

          {logs.length === 0 && isStreaming && (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          )}

          <AnimatePresence>
            {logs.map((log) => (
              <CombatAction
                key={log.id}
                actionNumber={log.actionNumber}
                message={log.message}
                type={log.type}
                isNew={log.id === latestLogId}
                gladiator1Health={log.gladiator1Health}
                gladiator2Health={log.gladiator2Health}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

