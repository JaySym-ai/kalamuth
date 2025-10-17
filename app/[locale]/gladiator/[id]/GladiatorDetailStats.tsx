"use client";

import { motion } from "framer-motion";
import { Heart, Swords, Brain, Star, MapPin, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";

// Helper function to safely extract localized string from bilingual data
function getLocalizedString(value: unknown, locale: string): string {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    // Try to get the localized version first
    if (typeof obj[locale] === "string") {
      return obj[locale] as string;
    }
    // Fallback to English
    if (typeof obj.en === "string") {
      return obj.en as string;
    }
    // Fallback to any available string
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        return obj[key] as string;
      }
    }
  }
  return "—"; // Default fallback
}

interface Props {
  gladiator: NormalizedGladiator;
  locale: string;
  translations: {
    backToDashboard: string;
    from: string;
    combatStats: string;
    strength: string;
    agility: string;
    dexterity: string;
    speed: string;
    chance: string;
    intelligence: string;
    charisma: string;
    loyalty: string;
    personality: string;
    lifeGoal: string;
    personalityTrait: string;
    likes: string;
    dislikes: string;
    background: string;
    backstory: string;
    notableHistory: string;
    physicalCondition: string;
    specialTraits: string;
    weakness: string;
    fear: string;
    handicap: string;
    uniquePower: string;
    [key: string]: string;
  };
}

export default function GladiatorDetailStats({ gladiator, locale, translations: t }: Props) {
  const statIcons: Record<string, LucideIcon> = {
    strength: Swords,
    agility: Star,
    dexterity: Star,
    speed: Star,
    chance: Star,
    intelligence: Brain,
    charisma: Heart,
    loyalty: Heart,
  };

  // Helper function to get translation with fallback
  const getTranslation = (key: string, fallback: string) => {
    return t[key] || fallback;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="relative p-6 pb-4 bg-gradient-to-r from-amber-900/20 to-red-900/20 border-b border-amber-900/30">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center text-4xl font-bold text-white">
              {getLocalizedString(gladiator.name, locale).charAt(0)}
            </div>
            {!gladiator.alive && (
              <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-2xl">✝</span>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-black text-amber-400">
              {getLocalizedString(gladiator.name, locale)} {getLocalizedString(gladiator.surname, locale)}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-gray-400">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{getTranslation("from", "From")} {getLocalizedString(gladiator.birthCity, locale)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{gladiator.health} HP</span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex gap-2 mt-3">
              {gladiator.injury && (
                <div className="flex items-center gap-1 px-3 py-1 bg-orange-900/30 border border-orange-700/50 rounded-full text-orange-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{getLocalizedString(gladiator.injury, locale)}</span>
                </div>
              )}
              {gladiator.sickness && (
                <div className="flex items-center gap-1 px-3 py-1 bg-yellow-900/30 border border-yellow-700/50 rounded-full text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{getLocalizedString(gladiator.sickness, locale)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Combat Stats */}
        <section>
          <h2 className="text-xl font-bold text-amber-400 mb-4">{getTranslation("combatStats", "Combat Statistics")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(gladiator.stats).map(([stat, description]) => {
              const Icon = statIcons[stat] || Star;
              const localizedDescription = getLocalizedString(description, locale);
              return (
                <div key={stat} className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-amber-400 capitalize">{getTranslation(stat, stat)}</span>
                  </div>
                  <p className="text-sm text-gray-300">{localizedDescription}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Personality & Background */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold text-amber-400 mb-4">{getTranslation("personality", "Personality")}</h2>
            <div className="space-y-3">
              <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-1">{getTranslation("lifeGoal", "Life Goal")}</h3>
                <p className="text-sm text-gray-300">{getLocalizedString(gladiator.lifeGoal, locale)}</p>
              </div>
              <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-1">{getTranslation("personalityTrait", "Personality")}</h3>
                <p className="text-sm text-gray-300">{getLocalizedString(gladiator.personality, locale)}</p>
              </div>
              <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-1">{getTranslation("likes", "Likes")}</h3>
                <p className="text-sm text-gray-300">{getLocalizedString(gladiator.likes, locale)}</p>
              </div>
              <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-1">{getTranslation("dislikes", "Dislikes")}</h3>
                <p className="text-sm text-gray-300">{getLocalizedString(gladiator.dislikes, locale)}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-amber-400 mb-4">{getTranslation("background", "Background")}</h2>
            <div className="space-y-3">
              <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-1">{getTranslation("backstory", "Backstory")}</h3>
                <p className="text-sm text-gray-300">{getLocalizedString(gladiator.backstory, locale)}</p>
              </div>
              {gladiator.notableHistory && (
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">{getTranslation("notableHistory", "Notable History")}</h3>
                  <p className="text-sm text-gray-300">{getLocalizedString(gladiator.notableHistory, locale)}</p>
                </div>
              )}
              {gladiator.physicalCondition && (
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">{getTranslation("physicalCondition", "Physical Condition")}</h3>
                  <p className="text-sm text-gray-300">{getLocalizedString(gladiator.physicalCondition, locale)}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Special Traits */}
        <section>
          <h2 className="text-xl font-bold text-amber-400 mb-4">{getTranslation("specialTraits", "Special Traits")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gladiator.weakness && (
              <div className="bg-black/40 border border-red-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-400 mb-1">{getTranslation("weakness", "Weakness")}</h3>
                <p className="text-sm text-gray-300">{getLocalizedString(gladiator.weakness, locale)}</p>
              </div>
            )}
            {gladiator.fear && (
              <div className="bg-black/40 border border-purple-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-400 mb-1">{getTranslation("fear", "Fear")}</h3>
                <p className="text-sm text-gray-300">{getLocalizedString(gladiator.fear, locale)}</p>
              </div>
            )}
            {gladiator.handicap && (
              <div className="bg-black/40 border border-orange-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-orange-400 mb-1">{getTranslation("handicap", "Handicap")}</h3>
                <p className="text-sm text-gray-300">{getLocalizedString(gladiator.handicap, locale)}</p>
              </div>
            )}
            {gladiator.uniquePower && (
              <div className="bg-black/40 border border-green-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-400 mb-1">{getTranslation("uniquePower", "Unique Power")}</h3>
                <p className="text-sm text-gray-300">{getLocalizedString(gladiator.uniquePower, locale)}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}