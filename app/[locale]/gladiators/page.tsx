import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentUserLudusTransformed } from "@/lib/ludus/repository";
import { getGladiatorsByLudus } from "@/lib/gladiator/repository";
import { requireAuthPage } from "@/lib/auth/server";
import { debug_error } from "@/utils/debug";
import GladiatorsClient from "./GladiatorsClient";
import type { Ludus } from "@/types/ludus";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function GladiatorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { user } = await requireAuthPage(locale);

  // Fetch user's ludus
  let ludusData: (Ludus & { id: string }) | null = null;
  let gladiators: NormalizedGladiator[] = [];

  try {
    // Get user's current ludus with full transformation
    ludusData = await getCurrentUserLudusTransformed(user.id);

    if (!ludusData) {
      redirect(`/${locale}/server-selection`);
    }

    // Fetch gladiators for this ludus
    gladiators = await getGladiatorsByLudus(ludusData.id, locale);

    // Sort gladiators by createdAt in memory
    gladiators.sort((a, b) => {
      const aTime = a.createdAt || "";
      const bTime = b.createdAt || "";
      return aTime.localeCompare(bTime);
    });
  } catch (error) {
    debug_error("Error loading gladiators data:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations("Gladiators");

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <GladiatorsClient
        ludus={ludusData!}
        gladiators={gladiators}
        locale={locale}
        translations={{
          title: t("title"),
          gladiators: t("gladiators"),
          gladiatorCount: t("gladiatorCount"),
          viewDetails: t("viewDetails"),
          health: t("health"),
          injured: t("injured"),
          sick: t("sick"),
          healthy: t("healthy"),
          noGladiators: t("noGladiators"),
          recruitGladiators: t("recruitGladiators"),
          backToDashboard: t("backToDashboard"),
        }}
      />
    </main>
  );
}