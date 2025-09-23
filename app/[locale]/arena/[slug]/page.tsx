import { getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ARENAS } from "@/data/arenas";
import { CITIES } from "@/data/cities";
import ArenaDetailClient from "./ArenaDetailClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ArenaDetailPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params;
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // Must be authenticated
  if (!user) redirect(`/${locale}/auth`);

  // Find arena by slug (using English slug)
  const arena = ARENAS.find(a =>
    a.name.toLowerCase().replace(/\s+/g, '-') === slug
  );

  if (!arena) {
    notFound();
  }

  // Find city details
  const city = CITIES.find(c => c.name === arena.city);

  const t = await getTranslations("ArenaDetail");
  const tArenas = await getTranslations("Arenas");
  const tCities = await getTranslations("Cities");

  // Get translated arena name
  const arenaName = tArenas(`${slug}.name`);

  // Get translated city data
  const cityId = city?.id || '';
  const cityName = cityId ? tCities(`${cityId}.name`) : arena.city;
  const cityDescription = cityId ? tCities(`${cityId}.description`) : city?.description || '';
  const cityHistoricEvent = cityId ? tCities(`${cityId}.historicEvent`) : city?.historicEvent || '';

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <ArenaDetailClient
        arenaName={arenaName}
        cityName={cityName}
        cityDescription={cityDescription}
        cityHistoricEvent={cityHistoricEvent}
        cityInhabitants={city?.inhabitants || 0}
        deathEnabled={arena.deathEnabled}
        locale={locale}
        translations={{
          backToDashboard: t("backToDashboard"),
          arenaDetails: t("arenaDetails"),
          city: t("city"),
          population: t("population"),
          description: t("description"),
          historicEvent: t("historicEvent"),
          combatRules: t("combatRules"),
          deathEnabled: t("deathEnabled"),
          deathDisabled: t("deathDisabled"),
          deathEnabledDesc: t("deathEnabledDesc"),
          deathDisabledDesc: t("deathDisabledDesc"),
          enterArena: t("enterArena"),
          comingSoon: t("comingSoon"),
        }}
      />
    </main>
  );
}
