import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { debug_error } from "@/utils/debug";
import { SERVERS } from "@/data/servers";
import DashboardClient from "./DashboardClient";
import type { Ludus } from "@/types/ludus";

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

  try {
    // First, get user's favorite server
    const { data: userData } = await supabase
      .from("users")
      .select("favoriteServerId")
      .eq("id", user.id)
      .maybeSingle();

    const favoriteServerId = userData?.favoriteServerId;

    // Fetch ludus from favorite server, or first available ludus if no favorite
    let query = supabase
      .from("ludi")
      .select(
        "id,userId,serverId,name,logoUrl,treasury,reputation,morale,facilities,maxGladiators,gladiatorCount,motto,locationCity,createdAt,updatedAt"
      )
      .eq("userId", user.id);

    if (favoriteServerId) {
      query = query.eq("serverId", favoriteServerId);
    }

    let ludus = (await query.limit(1).maybeSingle()).data;

    if (!ludus) {
      // If we have a favorite server but no ludus there, fall back to any ludus
      if (favoriteServerId) {
        const { data: anyLudus } = await supabase
          .from("ludi")
          .select(
            "id,userId,serverId,name,logoUrl,treasury,reputation,morale,facilities,maxGladiators,gladiatorCount,motto,locationCity,createdAt,updatedAt"
          )
          .eq("userId", user.id)
          .limit(1)
          .maybeSingle();

        if (anyLudus) {
          // Use the first available ludus and update favorite server
          await supabase
            .from("users")
            .update({ favoriteServerId: anyLudus.serverId })
            .eq("id", user.id);

          ludus = anyLudus;
        } else {
          redirect(`/${locale}/server-selection`);
        }
      } else {
        redirect(`/${locale}/server-selection`);
      }
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

    } as Ludus & { id: string };
  } catch (error) {
    debug_error("Error loading dashboard data:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations("Dashboard");

  // Get server info for tagline
  const server = SERVERS.find((s) => s.id === ludusData?.serverId);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <DashboardClient
        ludus={ludusData!}
        locale={locale}
        server={server}
        translations={{
          title: t("title"),
          ludusOverview: t("ludusOverview"),
          arena: t("arena"),
          tavern: t("tavern"),
          shop: t("shop"),
          inventory: t("inventory"),
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
          yourGladiators: t("yourGladiators"),
          gladiatorCount: t("gladiatorCount"),
          location: t("location"),
          motto: t("motto"),
          createdAt: t("createdAt"),
          connectedServer: t("connectedServer"),
        }}
      />
    </main>
  );
}

