import { getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { normalizeGladiator } from "@/lib/gladiator/normalize";
import GladiatorDetailClient from "./GladiatorDetailClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function GladiatorDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params;
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // Must be authenticated
  if (!user) redirect(`/${locale}/auth`);

  // Fetch the gladiator
  const { data: gladiatorData, error } = await supabase
    .from("gladiators")
    .select("id, ludusId, serverId, name, surname, avatarUrl, birthCity, health, current_health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive")
    .eq("id", id)
    .maybeSingle();

  if (error || !gladiatorData) {
    notFound();
  }

  // Verify the gladiator belongs to the user's ludus
  const { data: ludusData } = await supabase
    .from("ludi")
    .select("id")
    .eq("userId", user.id)
    .eq("id", gladiatorData.ludusId)
    .maybeSingle();

  if (!ludusData) {
    // Gladiator doesn't belong to user's ludus
    notFound();
  }

  const gladiator = normalizeGladiator(gladiatorData.id, gladiatorData, locale);
  const t = await getTranslations("GladiatorDetail");

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <GladiatorDetailClient
        gladiator={gladiator}
        locale={locale}
        translations={{
          backToDashboard: t("backToDashboard"),
          from: t("from"),
          combatStats: t("combatStats"),
          strength: t("strength"),
          agility: t("agility"),
          dexterity: t("dexterity"),
          speed: t("speed"),
          chance: t("chance"),
          intelligence: t("intelligence"),
          charisma: t("charisma"),
          loyalty: t("loyalty"),
          personality: t("personality"),
          lifeGoal: t("lifeGoal"),
          personalityTrait: t("personalityTrait"),
          likes: t("likes"),
          dislikes: t("dislikes"),
          background: t("background"),
          backstory: t("backstory"),
          notableHistory: t("notableHistory"),
          physicalCondition: t("physicalCondition"),
          specialTraits: t("specialTraits"),
          weakness: t("weakness"),
          fear: t("fear"),
          handicap: t("handicap"),
          uniquePower: t("uniquePower"),
        }}
      />
    </main>
  );
}
