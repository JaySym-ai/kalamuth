import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentUserLudus } from "@/lib/ludus/repository";
import { requireAuthPage } from "@/lib/auth/server";
import InventoryClient from "./InventoryClient";
import type { Ludus } from "@/types/ludus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InventoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { user } = await requireAuthPage(locale);

  // Fetch user's ludus
  let ludusData: (Ludus & { id: string }) | null = null;

  try {
    // Get user's current ludus (with server isolation logic)
    const ludus = await getCurrentUserLudus(
      user.id,
      "id,userId,serverId,name,logoUrl,treasury,reputation,morale,facilities,maxGladiators,gladiatorCount,motto,locationCity,createdAt,updatedAt"
    );

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

  const t = await getTranslations({ locale, namespace: "Inventory" });

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <InventoryClient
        ludus={ludusData!}
        locale={locale}
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          backToDashboard: t("backToDashboard"),
          noItems: t("noItems"),
          description: t("description"),
        }}
      />
    </main>
  );
}

