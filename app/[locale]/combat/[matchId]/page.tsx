import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import type { CombatGladiator } from "@/types/combat";
import { debug_error } from "@/utils/debug";
import CombatClient from "./CombatClient";
import GameViewport from "@/components/layout/GameViewport";
import ScrollableContent from "@/components/layout/ScrollableContent";

interface PageProps {
  params: Promise<{
    locale: string;
    matchId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Combat" });
  return {
    title: t("title"),
  };
}

export default async function CombatPage({ params }: PageProps) {
  const { locale, matchId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check auth
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    redirect(`/${locale}/login`);
  }

  // Fetch match
  const { data: match, error: matchError } = await supabase
    .from("combat_matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) {
    debug_error("Combat page - Match fetch error:", matchError);
    redirect(`/${locale}/dashboard`);
  }

  if (!match) {
    debug_error("Combat page - Match not found:", matchId);
    redirect(`/${locale}/dashboard`);
  }

  // Verify user is a participant
  const { data: participantCheck, error: participantError } = await supabase
    .from("gladiators")
    .select("id")
    .in("id", [match.gladiator1Id, match.gladiator2Id])
    .eq("userId", auth.user.id);

  if (participantError) {
    debug_error("Combat page - Participant check error:", participantError);
    redirect(`/${locale}/dashboard`);
  }

  if (!participantCheck || participantCheck.length === 0) {
    debug_error("Combat page - User is not a participant in match:", matchId);
    redirect(`/${locale}/dashboard`);
  }

  // Fetch full gladiator data
  // Note: We need to fetch both gladiators (user's and opponent's)
  // RLS might block opponent's gladiator, so we fetch them separately
  const { data: gladiator1Data, error: g1Error } = await supabase
    .from("gladiators")
    .select("*")
    .eq("id", match.gladiator1Id)
    .single();

  const { data: gladiator2Data, error: g2Error } = await supabase
    .from("gladiators")
    .select("*")
    .eq("id", match.gladiator2Id)
    .single();

  if (g1Error || g2Error) {
    debug_error("Combat page - Gladiator fetch error:", { g1Error, g2Error });
    debug_error("Match details:", {
      matchId,
      gladiator1Id: match.gladiator1Id,
      gladiator2Id: match.gladiator2Id,
      userId: auth.user.id
    });
    debug_error("⚠️  If you see PGRST116 error, run migration: npx supabase db push");
    debug_error("⚠️  See FIX_GLADIATOR_VISIBILITY.md for details");
    redirect(`/${locale}/dashboard`);
  }

  if (!gladiator1Data || !gladiator2Data) {
    debug_error("Combat page - Missing gladiator data:", {
      hasG1: !!gladiator1Data,
      hasG2: !!gladiator2Data,
      matchId,
      userId: auth.user.id
    });
    debug_error("⚠️  This usually means RLS is blocking opponent gladiator access");
    debug_error("⚠️  Run migration: npx supabase db push");
    debug_error("⚠️  See FIX_GLADIATOR_VISIBILITY.md for details");
    redirect(`/${locale}/dashboard`);
  }

  const gladiatorRows = [gladiator1Data, gladiator2Data];

  const gladiator1 = normalizeGladiator(gladiatorRows[0], locale);
  const gladiator2 = normalizeGladiator(gladiatorRows[1], locale);

  // Fetch combat config
  const configResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/combat/match/${matchId}/config`,
    {
      headers: {
        Cookie: cookieStore.toString(),
      },
    }
  );

  const configData = await configResponse.json();
  const config = configData.config;
  const arena = configData.arena;

  const t = await getTranslations({ locale, namespace: "Combat" });

  return (
    <GameViewport>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />

      {/* Scrollable Content */}
      <ScrollableContent className="relative z-10">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Combat Client Component */}
          <CombatClient
            matchId={matchId}
            gladiator1={gladiator1}
            gladiator2={gladiator2}
            arenaName={arena.name}
            maxActions={config.maxActions}
            locale={locale}
            arenaSlug={match.arenaSlug}
            backToArenaText={t("backToArena")}
          />
        </div>
      </ScrollableContent>
    </GameViewport>
  );
}

function normalizeGladiator(row: Record<string, unknown>, locale: string): CombatGladiator {
  const extractText = (field: unknown): string => {
    if (typeof field === "string") return field;
    if (field && typeof field === "object" && locale in field) {
      return (field as Record<string, string>)[locale];
    }
    return "";
  };

  const extractStats = (stats: unknown) => {
    if (!stats || typeof stats !== "object") {
      return {
        strength: "",
        agility: "",
        dexterity: "",
        speed: "",
        chance: "",
        intelligence: "",
        charisma: "",
        loyalty: "",
      };
    }
    const s = stats as Record<string, unknown>;
    return {
      strength: extractText(s.strength),
      agility: extractText(s.agility),
      dexterity: extractText(s.dexterity),
      speed: extractText(s.speed),
      chance: extractText(s.chance),
      intelligence: extractText(s.intelligence),
      charisma: extractText(s.charisma),
      loyalty: extractText(s.loyalty),
    };
  };

  return {
    id: row.id as string,
    name: row.name as string,
    surname: row.surname as string,
    avatarUrl: (row.avatarUrl as string) || null,
    rankingPoints: (row.rankingPoints as number) || 1000,
    health: (row.health as number) || 100,
    userId: (row.userId as string) || null,
    ludusId: (row.ludusId as string) || null,
    alive: typeof row.alive === "boolean" ? row.alive : true,
    injury: extractText(row.injury),
    sickness: extractText(row.sickness),
    stats: extractStats(row.stats),
    lifeGoal: extractText(row.lifeGoal),
    personality: extractText(row.personality),
    backstory: extractText(row.backstory),
    weakness: extractText(row.weakness),
    fear: extractText(row.fear),
    likes: extractText(row.likes),
    dislikes: extractText(row.dislikes),
    birthCity: (row.birthCity as string) || "Unknown",
    handicap: extractText(row.handicap),
    uniquePower: extractText(row.uniquePower),
    physicalCondition: extractText(row.physicalCondition),
    notableHistory: extractText(row.notableHistory),
  };
}

