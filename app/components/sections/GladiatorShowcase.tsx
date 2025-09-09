"use client";

import { useState } from "react";
import SectionTitle from "../ui/SectionTitle";
import GladiatorCard from "../ui/GladiatorCard";

const gladiators = [
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
      intelligence: 65,
    },
    image: "🗡️",
    rarity: "legendary",
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
      intelligence: 84,
    },
    image: "🏹",
    rarity: "epic",
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
      intelligence: 45,
    },
    image: "⚔️",
    rarity: "epic",
  },
];

export default function GladiatorShowcase() {
  const [selectedGladiator, setSelectedGladiator] = useState(0);

  return (
    <section className="relative py-24 bg-gradient-to-b from-black via-amber-950/10 to-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <SectionTitle
          subtitle="YOUR WARRIORS"
          title="Meet The Gladiators"
          description="Each warrior has unique abilities, personalities, and combat styles"
        />

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {gladiators.map((gladiator, index) => (
            <GladiatorCard
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
              Combat Analysis: {gladiators[selectedGladiator].name}
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
