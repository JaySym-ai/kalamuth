"use client";

import { useState } from "react";
import SectionTitle from "../ui/SectionTitle";
import { useTranslations } from "next-intl";

// Showcase gladiator card component (for marketing page only)
interface ShowcaseGladiatorCardProps {
  gladiator: {
    name: string;
    title: string;
    class: string;
    level: number;
    wins: number;
    losses: number;
    stats: { strength: number; agility: number; endurance: number; intelligence: number };
    image: string;
    rarity: "common" | "rare" | "epic" | "legendary";
  };
  isSelected: boolean;
  onClick: () => void;
}

function ShowcaseGladiatorCard({ gladiator, isSelected, onClick }: ShowcaseGladiatorCardProps) {
  const rarityColors = {
    common: "from-gray-600 to-gray-700",
    rare: "from-blue-600 to-blue-700",
    epic: "from-purple-600 to-purple-700",
    legendary: "from-amber-600 to-amber-700",
  };

  const rarityGlow = {
    common: "shadow-gray-500/20",
    rare: "shadow-blue-500/20",
    epic: "shadow-purple-500/20",
    legendary: "shadow-amber-500/20",
  };

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer transform transition-all duration-300 hover:scale-105 ${
        isSelected ? "scale-105" : ""
      }`}
    >
      {/* Rarity Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${rarityColors[gladiator.rarity]} rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300`}
      />

      {/* Card */}
      <div
        className={`relative bg-black/60 backdrop-blur-sm border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
          isSelected
            ? `border-amber-500 ${rarityGlow[gladiator.rarity]} shadow-2xl`
            : "border-amber-900/30 hover:border-amber-700/50"
        }`}
      >
        {/* Header with Rarity */}
        <div className={`bg-gradient-to-r ${rarityColors[gladiator.rarity]} p-responsive-3`}>
          <div className="flex items-center justify-between">
            <div className="text-responsive-5xl">{gladiator.image}</div>
            <div className="text-right">
              <div className="text-responsive-xs text-white/80 uppercase tracking-wider">
                {gladiator.rarity}
              </div>
              <div className="text-responsive-xl font-bold text-white">Lvl {gladiator.level}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-responsive-4">
          <h3 className="text-responsive-xl font-bold text-white mb-responsive-1">{gladiator.name}</h3>
          <p className="text-amber-400 text-responsive-sm mb-responsive-2">{gladiator.title}</p>
          <p className="text-gray-400 text-responsive-sm mb-responsive-4">{gladiator.class}</p>

          {/* Stats Bar */}
          <div className="flex justify-between items-center mb-responsive-4 p-responsive-2 bg-black/30 rounded-responsive-lg">
            <div className="text-center">
              <div className="text-green-400 font-bold text-responsive-lg">{gladiator.wins}</div>
              <div className="text-gray-500 text-responsive-xs">Wins</div>
            </div>
            <div className="text-gray-600">|</div>
            <div className="text-center">
              <div className="text-red-400 font-bold text-responsive-lg">{gladiator.losses}</div>
              <div className="text-gray-500 text-responsive-xs">Losses</div>
            </div>
            <div className="text-gray-600">|</div>
            <div className="text-center">
              <div className="text-amber-400 font-bold text-responsive-lg">
                {((gladiator.wins / (gladiator.wins + gladiator.losses)) * 100).toFixed(0)}%
              </div>
              <div className="text-gray-500 text-responsive-xs">Win Rate</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-responsive-sm">
            {Object.entries(gladiator.stats).slice(0, 2).map(([stat, value]) => (
              <div key={stat} className="flex items-center gap-responsive-sm">
                <div className="text-gray-500 text-responsive-xs capitalize">{stat}:</div>
                <div className="flex-1 h-[clamp(0.25rem,0.5vw,0.5rem)] bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <div className="text-amber-400 text-responsive-xs font-bold">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

const gladiators: {
  name: string;
  title: string;
  class: string;
  level: number;
  wins: number;
  losses: number;
  skills: string[];
  stats: { strength: number; agility: number; endurance: number; intelligence: number };
  image: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}[] = [
  {
    name: "Marcus Aurelius",
    title: "The Unbreakable",
    class: "Murmillo",
    level: 45,
    wins: 127,
    losses: 3,
    skills: ["Shield Bash", "Counter Strike", "Iron Will"],
    stats: {
      strength: 92,
      agility: 78,
      endurance: 95,
      intelligence: 65
    },
    image: "🗡️",
    rarity: "legendary"
  },
  {
    name: "Lucia Valeria",
    title: "Shadow Dancer",
    class: "Retiarius",
    level: 38,
    wins: 89,
    losses: 12,
    skills: ["Net Throw", "Evasion", "Quick Strike"],
    stats: {
      strength: 68,
      agility: 96,
      endurance: 72,
      intelligence: 84
    },
    image: "🏹",
    rarity: "epic"
  },
  {
    name: "Brutus Magnus",
    title: "Mountain of Rome",
    class: "Secutor",
    level: 42,
    wins: 103,
    losses: 8,
    skills: ["Crushing Blow", "Armor Break", "Berserker Rage"],
    stats: {
      strength: 98,
      agility: 52,
      endurance: 88,
      intelligence: 45
    },
    image: "⚔️",
    rarity: "epic"
  }
];

export default function GladiatorShowcase() {
  const [selectedGladiator, setSelectedGladiator] = useState(0);
  const t = useTranslations("Gladiators");

  return (
    <section className="relative py-24 bg-gradient-to-b from-black via-amber-950/10 to-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <SectionTitle
          subtitle={t("subtitle")}
          title={t("title")}
          description={t("description")}
        />

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {gladiators.map((gladiator, index) => (
            <ShowcaseGladiatorCard
              key={index}
              gladiator={gladiator}
              isSelected={selectedGladiator === index}
              onClick={() => setSelectedGladiator(index)}
            />
          ))}
        </div>

        {/* Selected Gladiator Details */}
        <div className="mt-12 p-8 bg-black/50 backdrop-blur-sm border border-amber-900/20 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-amber-400">
              {t("combatAnalysis")}: {gladiators[selectedGladiator].name}
            </h3>
            <div className="flex gap-2">
              {gladiators[selectedGladiator].skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-amber-900/30 border border-amber-700/50 rounded-lg text-sm text-amber-400"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(gladiators[selectedGladiator].stats).map(([stat, value]) => (
              <div key={stat} className="bg-black/30 rounded-lg p-4">
                <div className="text-gray-400 text-sm capitalize mb-2">{stat}</div>
                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <div className="text-amber-400 font-bold mt-2">{value}/100</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
