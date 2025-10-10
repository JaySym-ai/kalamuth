"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Skull, Shield, Users, MapPin, Scroll } from "lucide-react";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";
import type {
  CombatQueueEntry,
  CombatMatch,
  CombatMatchDetails,
  CombatantSummary,
  CombatMatchAcceptance,
} from "@/types/combat";
import { useRealtimeCollection } from "@/lib/supabase/realtime";
import { createClient } from "@/utils/supabase/clients";
import { debug_log, debug_error } from "@/utils/debug";
import GladiatorSelector from "./GladiatorSelector";
import ActiveMatchPanel from "./ActiveMatchPanel";
import MatchAcceptancePanel from "./MatchAcceptancePanel";

import QueueStatus from "./QueueStatus";

interface Props {
  arenaSlug: string;
  arenaName: string;
  cityName: string;
  cityDescription: string;
  cityHistoricEvent: string;
  cityInhabitants: number;
  deathEnabled: boolean;
  serverId: string;
  ludusId: string | null;
  gladiators: NormalizedGladiator[];
  initialArenaQueue: CombatQueueEntry[];
  initialUserQueue: CombatQueueEntry[];
  initialActiveMatches: CombatMatch[];

  locale: string;
  translations: {
    backToDashboard: string;
    arenaDetails: string;
    city: string;
    population: string;
    description: string;
    historicEvent: string;
    combatRules: string;
    deathEnabled: string;
    deathDisabled: string;
    deathEnabledDesc: string;
    deathDisabledDesc: string;
    enterArena: string;
    comingSoon: string;
    queueTitle: string;
    selectGladiator: string;
    selectGladiatorDesc: string;
    showGladiators: string;
    hideGladiators: string;
    availableGladiators: string;
    noAvailableGladiators: string;
    joinQueue: string;
    leaveQueue: string;
    inQueue: string;
    queuePosition: string;
    waitingForMatch: string;
    matchFound: string;
    currentQueue: string;
    noGladiatorsInQueue: string;
    gladiatorUnavailable: string;
    gladiatorInjured: string;
    gladiatorSick: string;
    gladiatorDead: string;
    gladiatorAlreadyQueued: string;
    rankingPoints: string;
    healthStatus: string;
    queuedAt: string;
    matchmaking: string;
    activeMatch: string;
    viewMatch: string;
    failedToJoinQueue: string;
    joinedQueueSuccess: string;
    networkError: string;
    leftQueueSuccess: string;
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
    statusReady: string;
    statusIncapacitated: string;
    matchAcceptanceTitle: string;
    opponentFound: string;
    waitingForAcceptance: string;
    acceptMatch: string;
    declineMatch: string;
    acceptanceTimeout: string;
    opponentDeclined: string;
    timeRemaining: string;
    youAccepted: string;
    youDeclined: string;
    opponentAccepted: string;
    opponentDeclinedLabel: string;
    preparingCombat: string;

  };
}

export default function ArenaDetailClient({
  arenaSlug,
  arenaName,
  cityName,
  cityDescription,
  cityHistoricEvent,
  cityInhabitants,
  deathEnabled,
  serverId,
  ludusId,
  gladiators,
  initialArenaQueue,
  initialUserQueue,
  initialActiveMatches,
  locale,
  translations: t
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [selectedGladiatorId, setSelectedGladiatorId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [activeMatchDetails, setActiveMatchDetails] = useState<CombatMatchDetails | null>(null);
  const [isMatchLoading, setIsMatchLoading] = useState(false);
  const [matchDetailsError, setMatchDetailsError] = useState<string | null>(null);


  const userGladiatorIds = useMemo(
    () => new Set(gladiators.map((g) => g.id)),
    [gladiators],
  );

  const matchFilters = useMemo(
    () => (serverId ? { arenaSlug, serverId } : { id: "__never__" }),
    [arenaSlug, serverId],
  );

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [initialAcceptances, setInitialAcceptances] = useState<CombatMatchAcceptance[]>([]);

  // Real-time queue subscription
  const {
    data: queueData,
    refresh: refreshQueue,
    mutate: mutateQueue,
  } = useRealtimeCollection<CombatQueueEntry>({
    table: "combat_queue",
    select: "*",
    match: { arenaSlug, serverId, status: "waiting" },
    initialData: initialArenaQueue,
    orderBy: { column: "queuedAt", ascending: true },
  });

  const userQueueMatch = ludusId
    ? { serverId, status: "waiting", ludusId }
    : undefined;

  const {
    data: userQueueData,
    refresh: refreshUserQueue,
    mutate: mutateUserQueue,
  } = useRealtimeCollection<CombatQueueEntry>({
    table: "combat_queue",
    select: "*",
    match: userQueueMatch,
    initialData: ludusId ? initialUserQueue : [],
    orderBy: { column: "queuedAt", ascending: true },
    fetchOnMount: Boolean(ludusId),
  });

  const { data: matchesData } = useRealtimeCollection<CombatMatch>({
    table: "combat_matches",
    select: "*",
    match: matchFilters,
    initialData: initialActiveMatches,
    orderBy: { column: "matchedAt", ascending: false },
    fetchOnMount: Boolean(serverId),
  });

  const activeMatch = useMemo(() => {
    const found = matchesData.find(
      (match) =>
        (match.status === "pending_acceptance" || match.status === "pending" || match.status === "in_progress") &&
        (userGladiatorIds.has(match.gladiator1Id) || userGladiatorIds.has(match.gladiator2Id)),
    );
    return found ?? null;
  }, [matchesData, userGladiatorIds]);

  const userHasActiveMatch = Boolean(activeMatch);
  const activeMatchId = activeMatch?.id ?? null;

  // Fetch initial acceptance data when match is detected
  useEffect(() => {
    if (!activeMatchId || activeMatch?.status !== "pending_acceptance") {
      setInitialAcceptances([]);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const fetchAcceptances = async () => {
      try {
        const response = await fetch(`/api/combat/match/${activeMatchId}/acceptances`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          debug_error("Failed to fetch acceptances");
          return;
        }

        const data = await response.json();
        if (!isCancelled && data.acceptances) {
          setInitialAcceptances(data.acceptances);
          debug_log('📥 Loaded initial acceptances:', {
            matchId: activeMatchId,
            count: data.acceptances.length,
            acceptances: data.acceptances.map((a: CombatMatchAcceptance) => ({
              id: a.id,
              gladiatorId: a.gladiatorId,
              status: a.status,
            })),
          });
        }
      } catch (err) {
        if (isCancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        debug_error("Error fetching acceptances:", err);
      }
    };

    fetchAcceptances();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [activeMatchId, activeMatch?.status]);

  // Subscribe to match acceptances for real-time updates with proper filtering
  const { data: acceptancesData } = useRealtimeCollection<CombatMatchAcceptance>({
    table: "combat_match_acceptances",
    select: "*",
    match: activeMatchId ? { matchId: activeMatchId } : undefined,
    initialData: initialAcceptances,
    orderBy: { column: "createdAt", ascending: true },
    fetchOnMount: false, // We handle initial loading manually
  });

  const acceptanceRecords = useMemo(() => {
    if (!activeMatch) return [] as CombatMatchAcceptance[];

    const merged = new Map<string, CombatMatchAcceptance>();

    // Add acceptances from match details (if available)
    for (const acceptance of activeMatchDetails?.acceptances ?? []) {
      if (acceptance?.id) {
        merged.set(acceptance.id, acceptance);
      }
    }

    // Add initial acceptances loaded from API
    for (const acceptance of initialAcceptances) {
      if (acceptance?.id) {
        merged.set(acceptance.id, acceptance);
      }
    }

    // Add realtime acceptances, but only filter for current match
    for (const acceptance of acceptancesData) {
      if (acceptance?.id && acceptance.matchId === activeMatch.id) {
        merged.set(acceptance.id, acceptance);
      }
    }

    const result = Array.from(merged.values());

    result.sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });

    return result;
  }, [activeMatch, activeMatchDetails?.acceptances, initialAcceptances, acceptancesData]);

  // Enhanced error handling for realtime connection issues
  useEffect(() => {
    if (acceptancesData.length > 0) {
      debug_log('📡 Realtime acceptances data received:', acceptancesData.length);
    }
  }, [acceptancesData]);

  // Debug: Log acceptances data changes
  useEffect(() => {
    if (activeMatch?.status === "pending_acceptance") {
      debug_log('📡 ArenaDetailClient - Acceptances updated:', {
        matchId: activeMatch.id,
        totalAcceptances: acceptanceRecords.length,
        initialAcceptances: initialAcceptances.length,
        realtimeAcceptances: acceptancesData.length,
        acceptances: acceptanceRecords.map((a) => ({
          id: a.id,
          gladiatorId: a.gladiatorId,
          status: a.status,
        })),
      });
    }
  }, [acceptanceRecords, activeMatch, initialAcceptances.length, acceptancesData.length]);

  // Fetch opponent gladiator data during acceptance phase
  const [opponentGladiatorData, setOpponentGladiatorData] = useState<NormalizedGladiator | null>(null);

  useEffect(() => {
    if (!activeMatch || activeMatch.status !== "pending_acceptance") {
      setOpponentGladiatorData(null);
      return;
    }

    const opponentId = userGladiatorIds.has(activeMatch.gladiator1Id)
      ? activeMatch.gladiator2Id
      : activeMatch.gladiator1Id;

    if (!opponentId) return;

    // Check if we already have the opponent in activeMatchDetails
    const existingOpponent = activeMatchDetails?.gladiators.find(g => g.id === opponentId);
    if (existingOpponent) {
      setOpponentGladiatorData(null); // We have it in activeMatchDetails
      return;
    }

    // Fetch opponent data from Supabase
    const fetchOpponent = async () => {
      try {
        const { data, error } = await supabase
          .from("gladiators")
          .select("*")
          .eq("id", opponentId)
          .single();

        if (error) {
          debug_error("Error fetching opponent:", error);
          return;
        }

        if (data) {
          setOpponentGladiatorData(data as NormalizedGladiator);
        }
      } catch (error) {
        debug_error("Error fetching opponent data:", error);
      }
    };

    fetchOpponent();
  }, [activeMatch, activeMatchDetails?.gladiators, supabase, userGladiatorIds]);

  // Enrich queue with gladiator data
  const enrichedQueue = queueData.map(entry => {
    const gladiator = gladiators.find(g => g.id === entry.gladiatorId);
    return { ...entry, gladiator };
  });

  // Check if user has a gladiator in queue
  const userQueueEntry = queueData.find(entry =>
    entry.arenaSlug === arenaSlug && gladiators.some(g => g.id === entry.gladiatorId)
  ) ?? userQueueData.find(entry =>
    entry.arenaSlug === arenaSlug && gladiators.some(g => g.id === entry.gladiatorId)
  );
  const toCombatantSummary = useCallback(
    (gladiator: NormalizedGladiator): CombatantSummary => ({
      id: gladiator.id,
      name: gladiator.name,
      surname: gladiator.surname,
      avatarUrl: gladiator.avatarUrl ?? null,
      rankingPoints: gladiator.rankingPoints,
      health: gladiator.health,
      currentHealth: gladiator.currentHealth,
      userId: null,
      ludusId: gladiator.ludusId ?? null,
      alive: gladiator.alive,
    }),
    [],
  );


  const playerGladiatorSummary = useMemo(() => {
    if (!activeMatch) return null;

    const playerId = userGladiatorIds.has(activeMatch.gladiator1Id)
      ? activeMatch.gladiator1Id
      : activeMatch.gladiator2Id;

    if (!playerId) return null;

    const detailed = activeMatchDetails?.gladiators.find((gladiator) => gladiator.id === playerId);
    if (detailed) return detailed;

    const fallbackGladiator = gladiators.find((gladiator) => gladiator.id === playerId);
    return fallbackGladiator ? toCombatantSummary(fallbackGladiator) : null;
  }, [activeMatch, activeMatchDetails?.gladiators, gladiators, toCombatantSummary, userGladiatorIds]);

  const opponentGladiatorSummary = useMemo(() => {
    if (!activeMatch) return null;

    const opponentId = userGladiatorIds.has(activeMatch.gladiator1Id)
      ? activeMatch.gladiator2Id
      : activeMatch.gladiator1Id;

    if (!opponentId) return null;

    // First check activeMatchDetails
    const detailed = activeMatchDetails?.gladiators.find((gladiator) => gladiator.id === opponentId);
    if (detailed) return detailed;

    // During acceptance phase, use fetched opponent data
    if (opponentGladiatorData && opponentGladiatorData.id === opponentId) {
      return toCombatantSummary(opponentGladiatorData);
    }

    // Fallback: create minimal opponent summary
    return {
      id: opponentId,
      name: "Unknown",
      surname: "Opponent",
      userId: null,
      rankingPoints: 1000,
      health: 100,
      currentHealth: 100,
      ludusId: null,
      alive: true,
    } as CombatantSummary;
  }, [activeMatch, activeMatchDetails?.gladiators, opponentGladiatorData, toCombatantSummary, userGladiatorIds]);

  const matchLogs = activeMatchDetails?.logs ?? [];
  const resolvedMatch = activeMatchDetails?.match ?? activeMatch ?? null;

  const queuedGladiatorIds = new Set(
    [...queueData, ...userQueueData].map(entry => entry.gladiatorId)
  );

  const shouldAutoExpandGladiatorList =
    !userQueueEntry && !userHasActiveMatch && gladiators.length > 0;

  // Clear messages after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {

    if (!activeMatchId) {
      setActiveMatchDetails(null);
      setMatchDetailsError(null);
      setIsMatchLoading(false);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const loadMatchDetails = async () => {
      setIsMatchLoading(true);
      setMatchDetailsError(null);

      try {
        const response = await fetch(`/api/combat/match/${activeMatchId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const fallback = await response.text().catch(() => null);
          throw new Error(fallback || "Failed to fetch match details");
        }

        const data = (await response.json()) as CombatMatchDetails;
        if (!isCancelled) {
          setActiveMatchDetails(data);
        }
      } catch (err) {
        if (isCancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        debug_error("Failed to load match details", err);
        setMatchDetailsError(t.failedToLoadMatch);
      } finally {
        if (!isCancelled) {
          setIsMatchLoading(false);
        }
      }
    };

    loadMatchDetails();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [activeMatchId, activeMatch?.status, t.failedToLoadMatch]);

  const handleJoinQueue = async () => {
    if (!selectedGladiatorId) return;

    setIsJoining(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/arena/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arenaSlug,
          serverId,
          gladiatorId: selectedGladiatorId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.failedToJoinQueue);
        return;
      }

      // Success - clear selection and show success message
      setSelectedGladiatorId(null);
      setSuccessMessage(t.joinedQueueSuccess);

      if (data.queueEntry) {
        mutateQueue((current) => {
          const idx = current.findIndex(entry => entry.id === data.queueEntry.id);
          if (idx >= 0) {
            current[idx] = data.queueEntry;
            return current;
          }
          current.push(data.queueEntry);
          return current;
        });

        if (ludusId) {
          mutateUserQueue((current) => {
            const idx = current.findIndex(entry => entry.id === data.queueEntry.id);
            if (idx >= 0) {
              current[idx] = data.queueEntry;
              return current;
            }
            current.push(data.queueEntry);
            return current;
          });
        }
      }

      // Refresh the queue to ensure we have the latest data
      await refreshQueue();
      if (ludusId) {
        await refreshUserQueue();
      }
    } catch (err) {
      debug_error("Error joining queue:", err);
      setError(t.networkError);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!userQueueEntry) return;

    setIsLeaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/arena/queue?queueId=${userQueueEntry.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t.failedToJoinQueue);
        return;
      }

      // Success - show success message
      setSuccessMessage(t.leftQueueSuccess);

      mutateQueue((current) => current.filter(entry => entry.id !== userQueueEntry.id));
      if (ludusId) {
        mutateUserQueue((current) => current.filter(entry => entry.id !== userQueueEntry.id));
      }

      // Refresh the queue to ensure we have the latest data
      await refreshQueue();
      if (ludusId) {
        await refreshUserQueue();
      }
    } catch (err) {
      debug_error("Error leaving queue:", err);
      setError(t.networkError);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-[max(env(safe-area-inset-bottom),24px)] pt-8 px-4 max-w-6xl mx-auto">
      {/* Arena Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.backToDashboard}
          </motion.button>
          <h1 className="text-4xl md:text-5xl font-black">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
              {arenaName}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{cityName}</span>
          </div>
          {cityInhabitants > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{cityInhabitants.toLocaleString()} {t.population}</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Queue System */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {activeMatch && resolvedMatch ? (
              activeMatch.status === "pending_acceptance" ? (
                <MatchAcceptancePanel
                  match={resolvedMatch}
                  player={playerGladiatorSummary}
                  opponent={opponentGladiatorSummary}
                  acceptances={acceptanceRecords}
                  locale={locale}
                  translations={{
                    matchAcceptanceTitle: t.matchAcceptanceTitle,
                    opponentFound: t.opponentFound,
                    waitingForAcceptance: t.waitingForAcceptance,
                    acceptMatch: t.acceptMatch,
                    declineMatch: t.declineMatch,
                    acceptanceTimeout: t.acceptanceTimeout,
                    opponentDeclined: t.opponentDeclined,
                    timeRemaining: t.timeRemaining,
                    yourGladiator: t.yourGladiator,
                    opponentGladiator: t.opponentGladiator,
                    youAccepted: t.youAccepted,
                    youDeclined: t.youDeclined,
                    opponentAccepted: t.opponentAccepted,
                    opponentDeclinedLabel: t.opponentDeclinedLabel,
                    preparingCombat: t.preparingCombat,
                  }}
                />
              ) : (
                <ActiveMatchPanel
                  match={resolvedMatch}
                  player={playerGladiatorSummary}
                  opponent={opponentGladiatorSummary}
                  logs={matchLogs}
                  loading={isMatchLoading}
                  error={matchDetailsError}
                  locale={locale}
                  translations={{
                    fightPanelTitle: t.activeMatch,
                    yourGladiator: t.yourGladiator,
                    opponentGladiator: t.opponentGladiator,
                    combatLog: t.combatLog,
                    awaitingCombat: t.awaitingCombat,
                    noLogEntries: t.noLogEntries,
                    matchStatusPending: t.matchStatusPending,
                    matchStatusInProgress: t.matchStatusInProgress,
                    matchStatusCompleted: t.matchStatusCompleted,
                    matchStatusCancelled: t.matchStatusCancelled,
                    loadingMatch: t.loadingMatch,
                    failedToLoadMatch: t.failedToLoadMatch,
                    healthStatus: t.healthStatus,
                    rankingPoints: t.rankingPoints,
                    statusReady: t.statusReady,
                    statusIncapacitated: t.statusIncapacitated,
                    startCombat: t.enterArena,
                    viewCombat: t.viewMatch,
                  }}
                />
              )
            ) : (
              <>
                {!userQueueEntry && (
                  <div className="mb-6">
                    <GladiatorSelector
                      gladiators={gladiators}
                      selectedGladiatorId={selectedGladiatorId}
                      onSelect={setSelectedGladiatorId}
                      queuedGladiatorIds={queuedGladiatorIds}
                      initiallyExpanded={shouldAutoExpandGladiatorList}
                      translations={{
                        selectGladiator: t.selectGladiator,
                        selectGladiatorDesc: t.selectGladiatorDesc,
                        showGladiators: t.showGladiators,
                        hideGladiators: t.hideGladiators,
                        availableGladiators: t.availableGladiators,
                        noAvailableGladiators: t.noAvailableGladiators,
                        rankingPoints: t.rankingPoints,
                        healthStatus: t.healthStatus,
                        gladiatorInjured: t.gladiatorInjured,
                        gladiatorSick: t.gladiatorSick,
                        gladiatorDead: t.gladiatorDead,
                        gladiatorAlreadyQueued: t.gladiatorAlreadyQueued,
                      }}
                    />

                    {selectedGladiatorId && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleJoinQueue}
                        disabled={isJoining}
                        className="w-full mt-4 h-12 rounded-lg font-bold text-lg bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
                        data-testid="join-queue-button"
                      >
                        {isJoining ? t.matchmaking : t.joinQueue}
                      </motion.button>
                    )}

                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 p-3 bg-green-900/20 border border-green-700/50 rounded-lg text-green-300 text-sm"
                      >
                        {successMessage}
                      </motion.div>
                    )}
                  </div>
                )}

                {userQueueEntry && (
                  <div className="mb-6">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleLeaveQueue}
                      disabled={isLeaving}
                      className="w-full h-12 rounded-lg font-bold text-lg bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="leave-queue-button"
                    >
                      {isLeaving ? t.matchmaking : t.leaveQueue}
                    </motion.button>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 p-3 bg-green-900/20 border border-green-700/50 rounded-lg text-green-300 text-sm"
                      >
                        {successMessage}
                      </motion.div>
                    )}
                  </div>
                )}

                <QueueStatus
                  queue={enrichedQueue}
                  userGladiatorId={userQueueEntry?.gladiatorId || null}
                  translations={{
                    currentQueue: t.currentQueue,
                    noGladiatorsInQueue: t.noGladiatorsInQueue,
                    queuePosition: t.queuePosition,
                    rankingPoints: "", // Empty string to hide ranking points
                    queuedAt: t.queuedAt,
                    waitingForMatch: t.waitingForMatch,
                    matchmaking: t.matchmaking,
                  }}
                />
              </>
            )}
          </motion.div>

          {/* City Description */}
          {cityDescription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                <Scroll className="w-6 h-6" />
                {t.description}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-6">{cityDescription}</p>

              <h3 className="text-xl font-semibold text-amber-300 mb-3">{t.historicEvent}</h3>
              <p className="text-gray-400 leading-relaxed">{cityHistoricEvent}</p>
            </motion.div>
          )}

          {/* Combat Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6"
          >
            <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <div className="relative w-6 h-6">
                <Image
                  src="/assets/icon/match.png"
                  alt="Combat Rules"
                  fill
                  className="object-contain"
                />
              </div>
              {t.combatRules}
            </h2>

            <div className={`p-6 rounded-xl border-2 ${
              deathEnabled
                ? 'bg-red-900/20 border-red-700/50'
                : 'bg-emerald-900/20 border-emerald-700/50'
            }`}>
              <div className="flex items-start gap-4">
                {deathEnabled ? (
                  <Skull className="w-12 h-12 text-red-400 flex-shrink-0" />
                ) : (
                  <Shield className="w-12 h-12 text-emerald-400 flex-shrink-0" />
                )}
                <div>
                  <h3 className={`text-xl font-bold mb-2 ${
                    deathEnabled ? 'text-red-300' : 'text-emerald-300'
                  }`}>
                    {deathEnabled ? t.deathEnabled : t.deathDisabled}
                  </h3>
                  <p className={`leading-relaxed ${
                    deathEnabled ? 'text-red-200/80' : 'text-emerald-200/80'
                  }`}>
                    {deathEnabled ? t.deathEnabledDesc : t.deathDisabledDesc}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6 sticky top-8"
          >
            <h2 className="text-xl font-bold text-amber-400 mb-6">{t.arenaDetails}</h2>

            {/* Arena Image Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-amber-900/30 to-red-900/30 rounded-xl mb-6 flex items-center justify-center border border-amber-700/30">
              <div className="relative w-16 h-16">
                <Image
                  src="/assets/icon/arena.png"
                  alt="Arena"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{t.city}</span>
                <span className="text-amber-300 font-semibold">{cityName}</span>
              </div>
              {cityInhabitants > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{t.population}</span>
                  <span className="text-amber-300 font-semibold">{cityInhabitants.toLocaleString()}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
