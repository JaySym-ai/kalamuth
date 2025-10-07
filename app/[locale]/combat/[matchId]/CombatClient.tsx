"use client";

import { useTranslations } from "next-intl";
import CombatIntroduction from "@/app/components/combat/CombatIntroduction";
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
    <div className="space-y-8">
      {/* Introduction */}
      <CombatIntroduction
        gladiator1={gladiator1}
        gladiator2={gladiator2}
        arenaName={arenaName}
        translations={{
          versus: t("versus"),
          arena: t("arena"),
          health: t("health"),
          ranking: t("ranking"),
          birthplace: t("birthplace"),
          personality: t("personality"),
          weakness: t("weakness"),
        }}
      />

      {/* Combat Stream */}
      <CombatStream
        matchId={matchId}
        gladiator1Name={`${gladiator1.name} ${gladiator1.surname}`}
        gladiator2Name={`${gladiator2.name} ${gladiator2.surname}`}
        gladiator1MaxHealth={gladiator1.health}
        gladiator2MaxHealth={gladiator2.health}
        maxActions={maxActions}
        locale={locale}
        translations={{
          startBattle: t("startBattle"),
          pauseBattle: t("pauseBattle"),
          resumeBattle: t("resumeBattle"),
          resetBattle: t("resetBattle"),
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
    </div>
  );
}

