import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import DashboardClient from "./DashboardClient";
import type { Ludus } from "@/types/ludus";
import { normalizeGladiator, type NormalizedGladiator } from "@/lib/gladiator/normalize";
import { ARENAS } from "@/data/arenas";
import { CITIES } from "@/data/cities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect(`/${locale}/auth`);

  // Fetch user's ludus
  let ludusData: (Ludus & { id: string }) | null = null;
  let gladiators: NormalizedGladiator[] = [];

  try {
    const { data: ludus } = await supabase
      .from("ludi")
      .select(
        "id,userId,serverId,name,logoUrl,treasury,reputation,morale,facilities,maxGladiators,gladiatorCount,motto,locationCity,createdAt,updatedAt"
      )
      .eq("userId", user.id)
      .limit(1)
      .maybeSingle();

    if (!ludus) {
      redirect(`/${locale}/server-selection`);
    }

    const treasurySource = (ludus.treasury as { currency?: string; amount?: unknown } | null) ?? {};
    const facilitiesSource = (ludus.facilities as Record<string, unknown> | null) ?? {};

    const parseNumber = (value: unknown, fallback: number) =>
      typeof value === "number"
        ? value
        : Number.parseInt(typeof value === "string" ? value : `${fallback}`, 10) || fallback;

    const currency =
      treasurySource.currency === "denarii" || treasurySource.currency === "sestertii"
        ? (treasurySource.currency as "denarii" | "sestertii")
        : "sestertii";

    ludusData = {
      id: (ludus.id as string) ?? "",
      userId: (ludus.userId as string) ?? user.id,
      serverId: (ludus.serverId as string) ?? "",
      name: (ludus.name as string) ?? "Ludus",
      logoUrl: (ludus.logoUrl as string) ?? "🏛️",
      treasury: {
        currency,
        amount: parseNumber(treasurySource.amount, 0),
      },
      reputation: parseNumber(ludus.reputation, 0),
      morale: parseNumber(ludus.morale, 50),
      facilities: {
        infirmaryLevel: parseNumber(facilitiesSource.infirmaryLevel, 1),
        trainingGroundLevel: parseNumber(facilitiesSource.trainingGroundLevel, 1),
        quartersLevel: parseNumber(facilitiesSource.quartersLevel, 1),
        kitchenLevel: parseNumber(facilitiesSource.kitchenLevel, 1),
      },
      maxGladiators: parseNumber(ludus.maxGladiators, 0),
      gladiatorCount: parseNumber(ludus.gladiatorCount, 0),
      motto: typeof ludus.motto === "string" ? ludus.motto : undefined,
      locationCity: typeof ludus.locationCity === "string" ? ludus.locationCity : undefined,
      createdAt: typeof ludus.createdAt === "string" ? ludus.createdAt : new Date().toISOString(),
      updatedAt: typeof ludus.updatedAt === "string" ? ludus.updatedAt : new Date().toISOString(),
      isDeleted: typeof ludus.isDeleted === "boolean" ? ludus.isDeleted : undefined,
    } as Ludus & { id: string };

    // Fetch gladiators for this ludus
    const { data: glads } = await supabase
      .from("gladiators")
      .select(
        "id, name, surname, avatarUrl, birthCity, health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, ludusId, serverId, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive, rankingPoints"
      )
      .eq("ludusId", ludus.id);

    if (glads) {
      gladiators = glads.map(doc =>
        normalizeGladiator(doc.id as string, doc as unknown as Record<string, unknown>, locale)
      );
    }

    // Sort gladiators by createdAt in memory
    gladiators.sort((a, b) => {
      const aTime = a.createdAt || "";
      const bTime = b.createdAt || "";
      return aTime.localeCompare(bTime);
    });
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations("Dashboard");
  const tArenas = await getTranslations("Arenas");
  const tCities = await getTranslations("Cities");

  // Prepare translated arena data
  const translatedArenas = ARENAS.map(arena => {
    const slug = arena.name.toLowerCase().replace(/\s+/g, '-');
    const city = CITIES.find(c => c.name === arena.city);
    const cityId = city?.id || '';

    return {
      slug,
      name: tArenas(`${slug}.name`),
      city: cityId ? tCities(`${cityId}.name`) : arena.city,
      deathEnabled: arena.deathEnabled
    };
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <DashboardClient
        ludus={ludusData!}
        gladiators={gladiators}
        translatedArenas={translatedArenas}
        locale={locale}
        translations={{
          title: t("title"),
          ludusOverview: t("ludusOverview"),
          arena: t("arena"),
          arenaCityLabel: t("arenaCityLabel"),
          arenaAllowsDeath: t("arenaAllowsDeath"),
          arenaNoDeath: t("arenaNoDeath"),
          arenaEmpty: t("arenaEmpty"),
          viewArena: t("viewArena"),
          treasury: t("treasury"),
          reputation: t("reputation"),
          morale: t("morale"),
          facilities: t("facilities"),
          infirmary: t("infirmary"),
          trainingGround: t("trainingGround"),
          quarters: t("quarters"),
          kitchen: t("kitchen"),
          level: t("level"),
          gladiators: t("gladiators"),
          gladiatorCount: t("gladiatorCount"),
          viewDetails: t("viewDetails"),
          health: t("health"),
          injured: t("injured"),
          sick: t("sick"),
          healthy: t("healthy"),
          noGladiators: t("noGladiators"),
          recruitGladiators: t("recruitGladiators"),
          location: t("location"),
          motto: t("motto"),
          createdAt: t("createdAt"),
        }}
      />
    </main>
  );
}

