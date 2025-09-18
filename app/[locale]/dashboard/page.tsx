import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getRequestUser } from "@/lib/firebase/request-auth";
import { adminDb } from "@/lib/firebase/server";
import DashboardClient from "./DashboardClient";
import type { Ludus } from "@/types/ludus";
import { normalizeGladiator, type NormalizedGladiator } from "@/lib/gladiator/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getRequestUser();
  if (!user) redirect(`/${locale}/auth`);

  // Fetch user's ludus
  let ludusData: (Ludus & { id: string }) | null = null;
  let gladiators: NormalizedGladiator[] = [];

  try {
    const ludiSnapshot = await adminDb()
      .collection("ludi")
      .where("userId", "==", user.uid)
      .limit(1)
      .get();

    if (ludiSnapshot.empty) {
      redirect(`/${locale}/server-selection`);
    }

    const ludusDoc = ludiSnapshot.docs[0];
    ludusData = { id: ludusDoc.id, ...ludusDoc.data() } as Ludus & { id: string };

    // Fetch gladiators for this ludus
    const gladiatorsSnapshot = await adminDb()
      .collection("gladiators")
      .where("ludusId", "==", ludusDoc.id)
      .get();

    gladiators = gladiatorsSnapshot.docs.map(doc =>
      normalizeGladiator(doc.id, doc.data() as Record<string, unknown>, locale)
    );

    // Sort gladiators by createdAt in memory (to avoid needing a Firestore index)
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <DashboardClient
        ludus={ludusData!}
        gladiators={gladiators}
        locale={locale}
        translations={{
          title: t("title"),
          ludusOverview: t("ludusOverview"),
          arena: t("arena"),
          arenaStatus: t("arenaStatus"),
          arenaClosed: t("arenaClosed"),
          arenaOpen: t("arenaOpen"),
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

