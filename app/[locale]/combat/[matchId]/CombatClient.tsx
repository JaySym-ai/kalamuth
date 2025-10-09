"use client";

import { useTranslations } from "next-intl";
import CombatStream from "@/app/components/combat/CombatStream";
import type { CombatGladiator } from "@/types/combat";

interface CombatClientProps {
  matchId: string;
  gladiator1: CombatGladiator;
  gladiator2: CombatGladiator;
  arenaName: string;
  maxActions: number;
  locale: string;
}

export default function CombatClient({
  matchId,
  gladiator1,
  gladiator2,
  arenaName,
  maxActions,
  locale,
}: CombatClientProps) {
  const t = useTranslations("Combat");

  return (
    <CombatStream
      matchId={matchId}
      gladiator1={gladiator1}
      gladiator2={gladiator2}
      arenaName={arenaName}
      maxActions={maxActions}
      locale={locale}
      translations={{
        versus: t("versus"),
        arena: t("arena"),
        startBattle: t("startBattle"),
        loading: t("loading"),
        error: t("error"),
        combatLog: t("combatLog"),
        live: t("live"),
        action: t("action"),
        elapsed: t("elapsed"),
        status: t("status"),
        statusInProgress: t("statusInProgress"),
        statusComplete: t("statusComplete"),
        winner: t("winner"),
      }}
    />
  );
}

