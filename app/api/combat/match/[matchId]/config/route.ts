import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { ARENAS } from "@/data/arenas";
import { getCombatConfigForArena } from "@/lib/combat/config";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { user, supabase } = await requireAuthAPI();

  const { matchId } = await params;

  // Fetch match
  const { data: match, error: matchError } = await supabase
    .from("combat_matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError || !match) {
    return NextResponse.json({ error: "match_not_found" }, { status: 404 });
  }

  // Verify user is a participant
  const { data: participantCheck } = await supabase
    .from("gladiators")
    .select("id")
    .in("id", [match.gladiator1Id, match.gladiator2Id])
    .eq("userId", user.id);

  if (!participantCheck || participantCheck.length === 0) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Get arena
  const arena = ARENAS.find(
    (a) => a.name.toLowerCase().replace(/\s+/g, "-") === match.arenaSlug
  );

  if (!arena) {
    return NextResponse.json({ error: "arena_not_found" }, { status: 404 });
  }

  // Get combat config
  const config = getCombatConfigForArena(arena);

  return NextResponse.json({
    config,
    arena: {
      name: arena.name,
      city: arena.city,
      deathEnabled: arena.deathEnabled,
    },
  });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

