import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireAuthPage } from "@/lib/auth/server";
import { getGladiatorById } from "@/lib/gladiator/repository";
import GladiatorChatClient from "./GladiatorChatClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function GladiatorDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params;
  const { user, supabase } = await requireAuthPage(locale);

  // Fetch the gladiator
  const gladiator = await getGladiatorById(id, locale);

  if (!gladiator) {
    notFound();
  }

  // Verify the gladiator belongs to the user's ludus
  const { data: ludusData } = await supabase
    .from("ludi")
    .select("id")
    .eq("userId", user.id)
    .eq("id", gladiator.ludusId)
    .maybeSingle();

  if (!ludusData) {
    // Gladiator doesn't belong to user's ludus
    notFound();
  }

  // Get translations with proper namespace
  const t = await getTranslations({ locale, namespace: "GladiatorDetail" });

  return (
    <GladiatorChatClient
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
        typeMessage: t("typeMessage"),
        gladiatorInfo: t("gladiatorInfo"),
        chat: t("chat"),
        sendMessage: t("sendMessage"),
      }}
    />
  );
}
