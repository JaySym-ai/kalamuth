"use client";

import type { NormalizedGladiator } from "@/lib/gladiator/normalize";
import GladiatorCard from "@/components/gladiator/GladiatorCard";

interface Props {
  gladiators: NormalizedGladiator[];
  locale: string;
  translations: {
    health: string;
    injured: string;
    sick: string;
    healthy: string;
    viewDetails: string;
  };
}

export default function GladiatorGrid({ gladiators, locale, translations: t }: Props) {
  return (
    <div className="max-h-[350px] sm:max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {gladiators.map((gladiator, index) => (
        <GladiatorCard
          key={gladiator.id}
          gladiator={gladiator}
          locale={locale}
          translations={t}
          variant="compact"
          animationIndex={index}
        />
      ))}
      </div>
    </div>
  );
}
