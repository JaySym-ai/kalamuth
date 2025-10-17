import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentUserLudusTransformed } from "@/lib/ludus/repository";
import { requireAuthPage } from "@/lib/auth/server";
import { debug_error } from "@/utils/debug";
import { SERVERS } from "@/data/servers";
import DashboardClient from "./DashboardClient";
import type { Ludus } from "@/types/ludus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { user } = await requireAuthPage(locale);

  // Fetch user's ludus with full transformation
  let ludusData: (Ludus & { id: string }) | null = null;

  try {
    ludusData = await getCurrentUserLudusTransformed(user.id);

    if (!ludusData) {
      redirect(`/${locale}/server-selection`);
    }
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

