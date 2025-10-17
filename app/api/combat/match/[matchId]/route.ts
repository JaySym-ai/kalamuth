import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import type { CombatantSummary, CombatLogEntry, CombatMatchAcceptance } from "@/types/combat";
import { debug_error } from "@/utils/debug";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  try {
    const { user, supabase } = await requireAuthAPI();

  const { matchId } = await params;

  if (!matchId) {
    return NextResponse.json({ error: "missing matchId" }, { status: 400 });
  }

  const { data: match, error: matchError } = await supabase
    .from("combat_matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) {
    debug_error("Failed to load match", matchError);
    return NextResponse.json({ error: "failed_to_fetch_match" }, { status: 500 });
  }

  if (!match) {
    return NextResponse.json({ error: "match_not_found" }, { status: 404 });
  }

  const gladiatorIds = [match.gladiator1Id, match.gladiator2Id];

  const { data: participantCheck, error: participantError } = await supabase
    .from("gladiators")
    .select("id")
    .in("id", gladiatorIds)
    .eq("userId", user.id);

  if (participantError) {
    debug_error("Failed to verify participant", participantError);
    return NextResponse.json({ error: "failed_to_fetch_match" }, { status: 500 });
  }

  if (!participantCheck || participantCheck.length === 0) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: gladiatorRows, error: gladiatorError } = await supabase
    .from("gladiators")
    .select("id, name, surname, avatarUrl, rankingPoints, health, current_health, userId, ludusId, alive")
    .in("id", gladiatorIds);

  if (gladiatorError) {
    debug_error("Failed to load gladiators", gladiatorError);
    return NextResponse.json({ error: "failed_to_fetch_gladiators" }, { status: 500 });
  }

  const gladiators: CombatantSummary[] = (gladiatorRows ?? []).map((row) => ({
    id: row.id as string,
    name: typeof row.name === "string" ? row.name : "Unknown",
    surname: typeof row.surname === "string" ? row.surname : "Gladiator",
    avatarUrl: (row.avatarUrl as string | null | undefined) ?? null,
    rankingPoints: typeof row.rankingPoints === "number" ? row.rankingPoints : 0,
    health: typeof row.health === "number" ? row.health : 0,
    currentHealth: typeof row.current_health === "number" ? row.current_health : (typeof row.health === "number" ? row.health : 0),
    userId: row.userId as string,
    ludusId: (row.ludusId as string | null | undefined) ?? null,
    alive: typeof row.alive === "boolean" ? row.alive : false,
  }));

  // Fetch acceptance records if match is in pending_acceptance status
  let acceptances: CombatMatchAcceptance[] = [];
  if (match.status === "pending_acceptance") {
    const { data: acceptanceData, error: acceptanceError } = await supabase
      .from("combat_match_acceptances")
      .select("*")
      .eq("matchId", matchId);

    if (acceptanceError) {
      debug_error("Failed to fetch acceptances:", acceptanceError);
    } else {
      acceptances = acceptanceData || [];
    }
  }

  const logs: CombatLogEntry[] = [
    {
      id: `${matchId}-ready`,
      matchId,
      actionNumber: 0,
      message: "Matchmaking complete. Combatants are preparing for battle.",
      createdAt: match.matchedAt ?? new Date().toISOString(),
      type: "system",
      locale: "en",
    },
  ];

  return NextResponse.json({
    match,
    gladiators,
    acceptances,
    logs,
  });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    debug_error("Match fetch error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

