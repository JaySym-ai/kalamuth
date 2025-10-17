"use client";

import { debug_error } from "@/utils/debug";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import CombatAction from "./CombatAction";
import CombatIntroduction from "./CombatIntroduction";
import CombatStats from "./CombatStats";
import type { CombatLogEntry, BattleState } from "@/types/combat";
import type { CombatGladiator } from "@/types/combat";

interface CombatStreamProps {
  matchId: string;
  gladiator1: CombatGladiator;
  gladiator2: CombatGladiator;
  arenaName: string;
  maxActions: number;
  locale: string;
  arenaSlug: string;
  backToArenaText: string;
  translations: {
    versus: string;
    arena: string;
    startBattle: string;
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
  gladiator1,
  gladiator2,
  arenaName,
  maxActions,
  locale,
  arenaSlug,
  backToArenaText,
  translations: t,
}: CombatStreamProps) {
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const [battleState, setBattleState] = useState<BattleState>({
    matchId,
    actionNumber: 0,
    gladiator1Health: gladiator1.health,
    gladiator2Health: gladiator2.health,
    isComplete: false,
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [latestLogId, setLatestLogId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);



  // Timer for elapsed time
  useEffect(() => {
    if (isStreaming && !battleState.isComplete) {
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
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isStreaming, battleState.isComplete]);

  const startBattle = useCallback(async () => {
    if (isStreaming) return;

    setIsStreaming(true);
    setError(null);
    setReconnectAttempts(0);

    // First, check the match status to determine which endpoint to use
    let shouldUseWatchEndpoint = false;
    try {
      const statusResponse = await fetch(`/api/combat/match/${matchId}/status`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        shouldUseWatchEndpoint = statusData.status !== "pending";
      }
    } catch (err) {
      debug_error("Failed to check match status, defaulting to start endpoint:", err);
    }

    const url = shouldUseWatchEndpoint
      ? `/api/combat/match/${matchId}/watch?locale=${locale}`
      : `/api/combat/match/${matchId}/start?locale=${locale}`;

    const eventSource = new EventSource(url);

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // Ignore ping messages
        if (data.type === "ping") {
          return;
        }

        if (data.type === "log") {
          const log: CombatLogEntry = data.log;
          setLogs((prev) => {
            // Avoid duplicates
            if (prev.some((l) => l.id === log.id)) {
              return prev;
            }
            return [...prev, log];
          });
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
        debug_error("Failed to parse SSE data:", err);
      }
    };

    eventSource.onmessage = handleMessage;

    eventSource.onerror = async () => {
      eventSource.close();

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Immediate status check to avoid waiting when fight actually completed
      try {
        const res = await fetch(`/api/combat/match/${matchId}/status`);
        if (res.ok) {
          const s = await res.json();
          if (s.status === "completed") {
            setBattleState((prev) => ({
              ...prev,
              isComplete: true,
              winnerId: s.winnerId,
              winnerMethod: s.winnerMethod,
            }));
            setIsStreaming(false);
            return;
          }
        }
      } catch {
        // ignore network errors; we'll fall back to reconnection
      }

      // Only attempt reconnection if we haven't exceeded max attempts
      if (reconnectAttempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff, max 10s

        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          startBattle();
        }, delay);
      } else {
        // After max attempts, just stop streaming but don't show error
        setIsStreaming(false);
      }
    };

    eventSourceRef.current = eventSource;
  }, [isStreaming, matchId, locale, reconnectAttempts]);

  // Auto-start battle 5 seconds after component mounts with countdown
  useEffect(() => {
    // Don't countdown if battle is already streaming or complete
    if (isStreaming || battleState.isComplete) {
      return;
    }

    if (countdown > 0) {
      const countdownTimer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => {
        clearTimeout(countdownTimer);
      };
    } else if (countdown === 0 && !isStreaming) {
      startBattle();
    }
  }, [countdown, isStreaming, battleState.isComplete, startBattle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);


  // Fallback: if we've reached maxActions but never received 'complete', poll status
  useEffect(() => {
    if (!battleState.isComplete && battleState.actionNumber >= maxActions) {
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/combat/match/${matchId}/status`);
          if (res.ok) {
            const s = await res.json();
            if (s.status === "completed") {
              setBattleState((prev) => ({
                ...prev,
                isComplete: true,
                winnerId: s.winnerId,
                winnerMethod: s.winnerMethod,
              }));
              setIsStreaming(false);
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
              }
            }
          }
        } catch {
          // ignore
        }
      }, 1500); // small grace period for the 'complete' event
      return () => clearTimeout(timeoutId);
    }
  }, [battleState.actionNumber, battleState.isComplete, maxActions, matchId]);

  return (
    <div className="space-y-8">
      {/* Introduction with real-time health */}
      <CombatIntroduction
        gladiator1={{
          ...gladiator1,
          health: battleState.gladiator1Health,
        }}
        gladiator2={{
          ...gladiator2,
          health: battleState.gladiator2Health,
        }}
        arenaName={arenaName}
        maxHealth1={gladiator1.health}
        maxHealth2={gladiator2.health}
        locale={locale}
        arenaSlug={arenaSlug}
        backToArenaText={backToArenaText}
        translations={{
          versus: t.versus,
          arena: t.arena,
        }}
      />

      {/* Stats */}
      <CombatStats
        currentAction={battleState.actionNumber}
        maxActions={maxActions}
        elapsedSeconds={elapsedSeconds}
        isComplete={battleState.isComplete}
        winnerId={battleState.winnerId}
        translations={t}
      />

      {/* Countdown Display */}
      {!isStreaming && !battleState.isComplete && countdown > 0 && (
        <motion.div
          className="flex flex-col items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
            {/* Outer rotating ring */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 160 160"
              style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.1))" }}
            >
              <motion.circle
                cx="80"
                cy="80"
                r="75"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "80px 80px" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
            </svg>

            {/* Middle pulsing ring */}
            <motion.div
              className="absolute inset-3 sm:inset-4 rounded-full border-2 border-amber-400/40"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />

            {/* Inner countdown number */}
            <motion.div
              key={countdown}
              className="relative z-10 text-center"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-amber-500 drop-shadow-lg leading-none">
                {countdown}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

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
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-amber-100 flex items-center gap-2">
            {t.combatLog}
            {isStreaming && !battleState.isComplete && (
              <span className="flex items-center gap-1 text-[0.65rem] sm:text-xs text-red-400 animate-pulse">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full" />
                {t.live}
              </span>
            )}
          </h3>
        </div>

        {/* Log container */}
        <div
          ref={logContainerRef}
          className="h-[300px] sm:h-[350px] md:h-[400px] overflow-y-auto space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg bg-black/40 border border-amber-900/30 custom-scrollbar"
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

