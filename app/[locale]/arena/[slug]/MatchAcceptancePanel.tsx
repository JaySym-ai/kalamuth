"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Swords, Clock, User, Check, X, AlertCircle } from "lucide-react";
import type { CombatMatch, CombatMatchAcceptance, CombatantSummary } from "@/types/combat";

interface Props {
  match: CombatMatch;
  player: CombatantSummary | null;
  opponent: CombatantSummary | null;
  acceptances: CombatMatchAcceptance[];
  locale: string;
  translations: {
    matchAcceptanceTitle: string;
    opponentFound: string;
    waitingForAcceptance: string;
    acceptMatch: string;
    declineMatch: string;
    acceptanceTimeout: string;
    opponentDeclined: string;
    timeRemaining: string;
    yourGladiator: string;
    opponentGladiator: string;
    youAccepted: string;
    youDeclined: string;
    opponentAccepted: string;
    opponentDeclinedLabel: string;
    preparingCombat: string;
  };
}

export default function MatchAcceptancePanel({
  match,
  player,
  opponent,
  acceptances,
  locale,
  translations: t,
}: Props) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Calculate time left until deadline
  useEffect(() => {
    if (!match.acceptanceDeadline) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadline = new Date(match.acceptanceDeadline!).getTime();
      const difference = deadline - now;
      
      if (difference > 0) {
        setTimeLeft(Math.floor(difference / 1000));
      } else {
        setTimeLeft(0);
        // Check for timeout
        checkTimeout();
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [match.acceptanceDeadline]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get user's acceptance status by gladiator ID instead of userId
  const userAcceptance = acceptances.find(a => a.gladiatorId === player?.id);
  const opponentAcceptance = acceptances.find(a => a.gladiatorId === opponent?.id);

  // Debug: Log acceptance changes
  useEffect(() => {
    console.log('🔄 Acceptances updated:', {
      total: acceptances.length,
      player: player ? {
        id: player.id,
        name: player.name,
        surname: player.surname,
      } : null,
      opponent: opponent ? {
        id: opponent.id,
        name: opponent.name,
        surname: opponent.surname,
      } : null,
      userAcceptance: userAcceptance ? {
        id: userAcceptance.id,
        gladiatorId: userAcceptance.gladiatorId,
        status: userAcceptance.status,
      } : null,
      opponentAcceptance: opponentAcceptance ? {
        id: opponentAcceptance.id,
        gladiatorId: opponentAcceptance.gladiatorId,
        status: opponentAcceptance.status,
      } : null,
      allAcceptances: acceptances.map(a => ({
        id: a.id,
        gladiatorId: a.gladiatorId,
        status: a.status,
      })),
    });
  }, [acceptances, player, opponent, userAcceptance, opponentAcceptance]);

  // Check if match has timed out
  const checkTimeout = useCallback(async () => {
    try {
      const response = await fetch(`/api/combat/match/${match.id}/timeout`, {
        method: "POST",
      });
      
      if (response.ok) {
        setError(t.acceptanceTimeout);
      }
    } catch (err) {
      console.error("Error checking timeout:", err);
    }
  }, [match.id, t.acceptanceTimeout]);

  // Handle accept match
  const handleAccept = async () => {
    if (!player || isAccepting) return;

    setIsAccepting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/combat/match/${match.id}/accept`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "acceptance_expired") {
          setError(t.acceptanceTimeout);
        } else {
          setError(data.error || "Failed to accept match");
        }
        return;
      }

      setSuccessMessage(t.youAccepted);
      
      // If both accepted, navigate to combat
      if (data.bothAccepted) {
        setTimeout(() => {
          router.push(`/${locale}/combat/${match.id}`);
        }, 1500);
      }
    } catch (err) {
      console.error("Error accepting match:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle decline match
  const handleDecline = async () => {
    if (!player || isDeclining) return;

    setIsDeclining(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/combat/match/${match.id}/decline`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to decline match");
        return;
      }

      setSuccessMessage(t.youDeclined);
      
      // Match is cancelled, stay on page to show message
    } catch (err) {
      console.error("Error declining match:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsDeclining(false);
    }
  };

  // Check if opponent declined
  useEffect(() => {
    if (opponentAcceptance?.status === "declined") {
      setError(t.opponentDeclined);
    }
  }, [opponentAcceptance, t.opponentDeclined]);

  // Check if both players have accepted and navigate to combat
  useEffect(() => {
    console.log('🚀 Navigation check:', {
      userStatus: userAcceptance?.status,
      opponentStatus: opponentAcceptance?.status,
      bothAccepted: userAcceptance?.status === "accepted" && opponentAcceptance?.status === "accepted",
    });

    if (
      userAcceptance?.status === "accepted" &&
      opponentAcceptance?.status === "accepted"
    ) {
      console.log('✅ Both accepted! Navigating to combat in 1.5s...');
      // Both accepted, navigate to combat after a short delay
      const timer = setTimeout(() => {
        console.log('🎯 Navigating to:', `/${locale}/combat/${match.id}`);
        router.push(`/${locale}/combat/${match.id}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userAcceptance?.status, opponentAcceptance?.status, router, locale, match.id]);

  const isExpired = timeLeft <= 0;
  // User has responded if acceptance exists AND status is not pending
  const hasUserResponded = userAcceptance && userAcceptance.status !== "pending";
  const showButtons = !hasUserResponded && !isExpired;

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
              {t.matchAcceptanceTitle}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {t.opponentFound}
            </p>
          </div>
          
          {/* Countdown Timer */}
          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              isExpired
                ? "bg-red-500/20 text-red-200"
                : timeLeft <= 20
                  ? "bg-orange-500/20 text-orange-200 animate-pulse"
                  : "bg-amber-500/20 text-amber-200"
            }`}
            data-testid="acceptance-countdown"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Combatants */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Player's Gladiator */}
          <div
            className="p-4 rounded-xl border border-emerald-600/40 bg-gradient-to-br from-emerald-600/20 to-green-900/30"
            data-testid="player-gladiator-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-lg font-bold text-white">
                {player?.name?.charAt(0) || "?"}
              </div>
              <div className="flex-1">
                <p className="text-sm uppercase tracking-wide text-emerald-300/80">{t.yourGladiator}</p>
                <p className="font-semibold text-white">
                  {player ? `${player.name} ${player.surname}` : "—"}
                </p>
              </div>
              {userAcceptance?.status === "accepted" && (
                <Check className="h-5 w-5 text-emerald-400" data-testid="player-accepted-icon" />
              )}
              {userAcceptance?.status === "declined" && (
                <X className="h-5 w-5 text-red-400" data-testid="player-declined-icon" />
              )}
            </div>
          </div>

          {/* Opponent Gladiator */}
          <div
            className="p-4 rounded-xl border border-red-600/40 bg-gradient-to-br from-red-600/20 to-rose-900/30"
            data-testid="opponent-gladiator-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-lg font-bold text-white">
                {opponent?.name?.charAt(0) || "?"}
              </div>
              <div className="flex-1">
                <p className="text-sm uppercase tracking-wide text-red-300/80">{t.opponentGladiator}</p>
                <p className="font-semibold text-white">
                  {opponent ? `${opponent.name} ${opponent.surname}` : "Unknown Opponent"}
                </p>
              </div>
              {opponentAcceptance?.status === "accepted" && (
                <Check className="h-5 w-5 text-emerald-400" data-testid="opponent-accepted-icon" />
              )}
              {opponentAcceptance?.status === "declined" && (
                <X className="h-5 w-5 text-red-400" data-testid="opponent-declined-icon" />
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg text-green-300 text-sm"
            data-testid="match-acceptance-success"
          >
            {successMessage}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300 text-sm flex items-center gap-2"
            data-testid="match-acceptance-error"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}

        {/* Accept/Decline Buttons */}
        {showButtons && (
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              disabled={isAccepting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:from-emerald-500 hover:to-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="accept-match-button"
            >
              {isAccepting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  {t.preparingCombat}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t.acceptMatch}
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDecline}
              disabled={isDeclining}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold hover:from-gray-600 hover:to-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="decline-match-button"
            >
              {isDeclining ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  {t.declineMatch}
                </>
              )}
            </motion.button>
          </div>
        )}

        {/* Waiting for opponent message */}
        {userAcceptance?.status === "accepted" && opponentAcceptance?.status === "pending" && !isExpired && (
          <div
            className="text-center p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg"
            data-testid="waiting-opponent-message"
          >
            <div className="flex items-center justify-center gap-2 text-amber-300">
              <Clock className="h-4 w-4 animate-pulse" />
              <span>{t.waitingForAcceptance}</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}