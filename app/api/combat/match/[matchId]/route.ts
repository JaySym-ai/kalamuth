import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { CombatantSummary, CombatLogEntry } from "@/types/combat";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
    console.error("Failed to load match", matchError);
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
    console.error("Failed to verify participant", participantError);
    return NextResponse.json({ error: "failed_to_fetch_match" }, { status: 500 });
  }

  if (!participantCheck || participantCheck.length === 0) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: gladiatorRows, error: gladiatorError } = await supabase
    .from("gladiators")
    .select("id, name, surname, avatarUrl, rankingPoints, health, userId, ludusId, alive")
    .in("id", gladiatorIds);

  if (gladiatorError) {
    console.error("Failed to load gladiators", gladiatorError);
    return NextResponse.json({ error: "failed_to_fetch_gladiators" }, { status: 500 });
  }

  const gladiators: CombatantSummary[] = (gladiatorRows ?? []).map((row) => ({
    id: row.id as string,
    name: typeof row.name === "string" ? row.name : "Unknown",
    surname: typeof row.surname === "string" ? row.surname : "Gladiator",
    avatarUrl: (row.avatarUrl as string | null | undefined) ?? null,
    rankingPoints: typeof row.rankingPoints === "number" ? row.rankingPoints : 0,
    health: typeof row.health === "number" ? row.health : 0,
    userId: row.userId as string,
    ludusId: (row.ludusId as string | null | undefined) ?? null,
    alive: typeof row.alive === "boolean" ? row.alive : false,
  }));

  const logs: CombatLogEntry[] = [
    {
      id: `${matchId}-ready`,
      matchId,
      message: "Matchmaking complete. Combatants are preparing for battle.",
      createdAt: match.matchedAt ?? new Date().toISOString(),
      type: "system",
    },
  ];

  return NextResponse.json({
    match,
    gladiators,
    logs,
  });
}

