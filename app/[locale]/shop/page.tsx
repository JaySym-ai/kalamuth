import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import ShopClient from "./ShopClient";
import type { Ludus } from "@/types/ludus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect(`/${locale}/auth`);

  // Fetch user's ludus
  let ludusData: (Ludus & { id: string }) | null = null;

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

    const currency = treasurySource.currency === "denarii" ? "denarii" : "sestertii";

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
      maxGladiators: parseNumber(ludus.maxGladiators, 10),
      gladiatorCount: parseNumber(ludus.gladiatorCount, 0),
      motto: (ludus.motto as string | undefined) ?? undefined,
      locationCity: (ludus.locationCity as string | undefined) ?? undefined,
      createdAt: (ludus.createdAt as string) ?? new Date().toISOString(),
      updatedAt: (ludus.updatedAt as string) ?? new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching ludus:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations({ locale, namespace: "Shop" });

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <ShopClient
        ludus={ludusData!}
        locale={locale}
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          backToDashboard: t("backToDashboard"),
          comingSoon: t("comingSoon"),
          description: t("description"),
        }}
      />
    </main>
  );
}

