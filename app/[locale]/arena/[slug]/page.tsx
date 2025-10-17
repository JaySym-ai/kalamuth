import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { getCurrentUserLudus } from "@/lib/ludus/repository";
import { getGladiatorsByLudus } from "@/lib/gladiator/repository";
import { requireAuthPage } from "@/lib/auth/server";
import { ARENAS } from "@/data/arenas";
import { CITIES } from "@/data/cities";
import ArenaDetailClient from "./ArenaDetailClient";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";
import type { CombatQueueEntry, CombatMatch } from "@/types/combat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ArenaDetailPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params;
  const { user, supabase } = await requireAuthPage(locale);

  // Find arena by slug (using English slug)
  const arena = ARENAS.find(a =>
    a.name.toLowerCase().replace(/\s+/g, '-') === slug
  );

  if (!arena) {
    notFound();
  }

  // Find city details
  const city = CITIES.find(c => c.name === arena.city);

  // Get user's current ludus (with server isolation logic)
  const ludus = await getCurrentUserLudus(user.id, "id, serverId");

  let gladiators: NormalizedGladiator[] = [];
  let serverId = "";
  let ludusId: string | null = null;
  let initialArenaQueue: CombatQueueEntry[] = [];
  let initialUserQueue: CombatQueueEntry[] = [];
  let initialActiveMatches: CombatMatch[] = [];


  if (ludus) {
    serverId = ludus.serverId as string;
    ludusId = ludus.id as string;

    // Fetch user's gladiators (minimal fields for arena)
    gladiators = await getGladiatorsByLudus(ludus.id, locale, true);

    const { data: arenaQueue } = await supabase
      .from("combat_queue")
      .select("*")
      .eq("arenaSlug", slug)
      .eq("serverId", serverId)
      .eq("status", "waiting")
      .order("queuedAt", { ascending: true });

    if (arenaQueue) {
      initialArenaQueue = arenaQueue as CombatQueueEntry[];
    }

    const { data: userQueue } = await supabase
      .from("combat_queue")
      .select("*")
      .eq("ludusId", ludus.id)
      .eq("serverId", serverId)
      .eq("status", "waiting")
      .order("queuedAt", { ascending: true });


    const { data: activeMatches } = await supabase
      .from("combat_matches")
      .select("*")
      .eq("arenaSlug", slug)
      .eq("serverId", serverId)
      .in("status", ["pending_acceptance", "pending", "in_progress"]);

    if (activeMatches) {
      initialActiveMatches = activeMatches as CombatMatch[];
    }

    if (userQueue) {
      initialUserQueue = userQueue as CombatQueueEntry[];
    }
  }

  const t = await getTranslations("ArenaDetail");
  const tArenas = await getTranslations("Arenas");
  const tCities = await getTranslations("Cities");

  // Get translated arena name
  const arenaName = tArenas(`${slug}.name`);

  // Get translated city data
  const cityId = city?.id || '';
  const cityName = cityId ? tCities(`${cityId}.name`) : arena.city;
  const cityDescription = cityId ? tCities(`${cityId}.description`) : city?.description || '';
  const cityHistoricEvent = cityId ? tCities(`${cityId}.historicEvent`) : city?.historicEvent || '';

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <ArenaDetailClient
        arenaSlug={slug}
        arenaName={arenaName}
        cityName={cityName}
        cityDescription={cityDescription}
        cityHistoricEvent={cityHistoricEvent}
        cityInhabitants={city?.inhabitants || 0}
        deathEnabled={arena.deathEnabled}
        serverId={serverId}
        ludusId={ludusId}
        gladiators={gladiators}
        initialArenaQueue={initialArenaQueue}
        initialUserQueue={initialUserQueue}
        initialActiveMatches={initialActiveMatches}
        locale={locale}
        translations={{
          backToDashboard: t("backToDashboard"),
          arenaDetails: t("arenaDetails"),
          city: t("city"),
          population: t("population"),
          description: t("description"),
          historicEvent: t("historicEvent"),
          combatRules: t("combatRules"),
          deathEnabled: t("deathEnabled"),
          deathDisabled: t("deathDisabled"),
          deathEnabledDesc: t("deathEnabledDesc"),
          deathDisabledDesc: t("deathDisabledDesc"),
          enterArena: t("enterArena"),
          comingSoon: t("comingSoon"),
          queueTitle: t("queueTitle"),
          selectGladiator: t("selectGladiator"),
          selectGladiatorDesc: t("selectGladiatorDesc"),
          showGladiators: t("showGladiators"),
          hideGladiators: t("hideGladiators"),
          availableGladiators: t("availableGladiators"),
          noAvailableGladiators: t("noAvailableGladiators"),
          joinQueue: t("joinQueue"),
          leaveQueue: t("leaveQueue"),
          inQueue: t("inQueue"),
          queuePosition: t("queuePosition"),
          waitingForMatch: t("waitingForMatch"),
          matchFound: t("matchFound"),
          currentQueue: t("currentQueue"),
          noGladiatorsInQueue: t("noGladiatorsInQueue"),
          gladiatorUnavailable: t("gladiatorUnavailable"),
          gladiatorInjured: t("gladiatorInjured"),
          gladiatorSick: t("gladiatorSick"),
          gladiatorDead: t("gladiatorDead"),
          gladiatorAlreadyQueued: t("gladiatorAlreadyQueued"),
          rankingPoints: t("rankingPoints"),
          healthStatus: t("healthStatus"),
          queuedAt: t("queuedAt"),
          matchmaking: t("matchmaking"),
          activeMatch: t("activeMatch"),
          viewMatch: t("viewMatch"),
          failedToJoinQueue: t("failedToJoinQueue"),
          joinedQueueSuccess: t("joinedQueueSuccess"),
          networkError: t("networkError"),
          leftQueueSuccess: t("leftQueueSuccess"),
          yourGladiator: t("yourGladiator"),
          opponentGladiator: t("opponentGladiator"),
          combatLog: t("combatLog"),
          awaitingCombat: t("awaitingCombat"),
          noLogEntries: t("noLogEntries"),
          matchStatusPending: t("matchStatusPending"),
          matchStatusInProgress: t("matchStatusInProgress"),
          matchStatusCompleted: t("matchStatusCompleted"),
          matchStatusCancelled: t("matchStatusCancelled"),
          loadingMatch: t("loadingMatch"),
          failedToLoadMatch: t("failedToLoadMatch"),
          statusReady: t("statusReady"),
          statusIncapacitated: t("statusIncapacitated"),
          matchAcceptanceTitle: t("matchAcceptanceTitle"),
          opponentFound: t("opponentFound"),
          waitingForAcceptance: t("waitingForAcceptance"),
          acceptMatch: t("acceptMatch"),
          declineMatch: t("declineMatch"),
          acceptanceTimeout: t("acceptanceTimeout"),
          opponentDeclined: t("opponentDeclined"),
          timeRemaining: t("timeRemaining"),
          youAccepted: t("youAccepted"),
          youDeclined: t("youDeclined"),
          opponentAccepted: t("opponentAccepted"),
          opponentDeclinedLabel: t("opponentDeclinedLabel"),
          preparingCombat: t("preparingCombat"),
        }}
      />
    </main>
  );
}
