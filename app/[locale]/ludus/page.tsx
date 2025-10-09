import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import LudusDetailClient from "./LudusDetailClient";

export default async function LudusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = createClient(await cookies());
  const t = await getTranslations();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth`);
  }

  // Get user's ludus
  const { data: ludus, error } = await supabase
    .from("ludi")
    .select("*")
    .eq("userId", user.id)
    .single();

  if (error || !ludus) {
    redirect(`/${locale}/ludus-creation`);
  }

  const translations = {
    ludusOverview: t("Dashboard.ludusOverview"),
    treasury: t("Dashboard.treasury"),
    reputation: t("Dashboard.reputation"),
    morale: t("Dashboard.morale"),
    facilities: t("Dashboard.facilities"),
    infirmary: t("Dashboard.infirmary"),
    trainingGround: t("Dashboard.trainingGround"),
    quarters: t("Dashboard.quarters"),
    kitchen: t("Dashboard.kitchen"),
    level: t("Dashboard.level"),
    location: t("Dashboard.location"),
    gladiatorCount: t("Dashboard.gladiatorCount"),
    backToDashboard: t("Dashboard.viewDetails") || "Retour au Tableau de Bord",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-3 py-3">
        <LudusDetailClient ludus={ludus} translations={translations} />
      </div>
    </div>
  );
}