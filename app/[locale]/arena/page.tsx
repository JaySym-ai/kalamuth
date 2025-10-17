import { getTranslations } from "next-intl/server";
import { requireAuthPage } from "@/lib/auth/server";
import { ARENAS } from "@/data/arenas";
import { CITIES } from "@/data/cities";
import ArenaListClient from "./ArenaListClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TranslatedArena {
  slug: string;
  name: string;
  city: string;
  cityPopulation: number;
  deathEnabled: boolean;
}

export default async function ArenaListPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  await requireAuthPage(locale);

  // Get translations
  const t = await getTranslations({ locale, namespace: "Arena" });
  const tCities = await getTranslations({ locale, namespace: "Cities" });

  // Translate arenas
  const translatedArenas: TranslatedArena[] = ARENAS.map((arena) => {
    const city = CITIES.find((c) => c.name === arena.city);
    const slug = arena.name.toLowerCase().replace(/\s+/g, "-");

    return {
      slug,
      name: arena.name,
      city: city ? tCities(`${city.id}.name`) : arena.city,
      cityPopulation: city?.inhabitants || 0,
      deathEnabled: arena.deathEnabled,
    };
  });

  return (
    <ArenaListClient
      arenas={translatedArenas}
      locale={locale}
      translations={{
        title: t("title"),
        subtitle: t("subtitle"),
        backToDashboard: t("backToDashboard"),
        cityLabel: t("cityLabel"),
        populationLabel: t("populationLabel"),
        allowsDeath: t("allowsDeath"),
        noDeath: t("noDeath"),
        enterArena: t("enterArena"),
        noArenas: t("noArenas"),
      }}
    />
  );
}

