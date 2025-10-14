import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { debug_error } from "@/utils/debug";
import TavernClient from "./TavernClient";
import type { Ludus } from "@/types/ludus";
import { normalizeGladiator, type NormalizedGladiator } from "@/lib/gladiator/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TavernPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect(`/${locale}/auth`);

  // Fetch user's ludus
  let ludusData: (Ludus & { id: string }) | null = null;
  let tavernGladiators: NormalizedGladiator[] = [];

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
    } as Ludus & { id: string };

    // Fetch tavern gladiators for this ludus
    const { data: glads } = await supabase
      .from("tavern_gladiators")
      .select(
        "id, name, surname, avatarUrl, birthCity, health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, ludusId, serverId, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive, rankingPoints"
      )
      .eq("ludusId", ludus.id)
      .order("createdAt", { ascending: false });

    if (glads) {
      tavernGladiators = glads.map(doc =>
        normalizeGladiator(doc.id as string, doc as unknown as Record<string, unknown>, locale)
      );
    }
  } catch (error) {
    debug_error("Error loading tavern data:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations("Tavern");

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <TavernClient
        ludus={ludusData!}
        tavernGladiators={tavernGladiators}
        locale={locale}
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          welcomeMessage: t("welcomeMessage"),
          currentGladiator: t("currentGladiator"),
          sendMessage: t("sendMessage"),
          messagePlaceholder: t("messagePlaceholder"),
          skip: t("skip"),
          next: t("next"),
          loadingResponse: t("loadingResponse"),
          recruitThisGladiator: t("recruitThisGladiator"),
          chatHistory: t("chatHistory"),
          birthCity: t("birthCity"),
          name: t("name"),
          ludusFullTitle: t("ludusFullTitle"),
          ludusFullMessage: t("ludusFullMessage"),
          loadingGladiators: t("loadingGladiators"),
          error: t("error"),
          backToDashboard: t("backToDashboard"),
          recruit: t("recruit"),
          recruiting: t("recruiting"),
          confirmSkipTitle: t("confirmSkipTitle"),
          confirmSkipMessage: t("confirmSkipMessage"),
          confirmSkipYes: t("confirmSkipYes"),
          confirmSkipNo: t("confirmSkipNo"),
          confirmRecruitTitle: t("confirmRecruitTitle"),
          confirmRecruitMessage: t("confirmRecruitMessage"),
          confirmRecruitYes: t("confirmRecruitYes"),
          confirmRecruitNo: t("confirmRecruitNo"),
        }}
      />
    </main>
  );
}

