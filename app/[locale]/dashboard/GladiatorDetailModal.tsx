"use client";

import { motion } from "framer-motion";
import { X, Heart, Swords, Brain, Star, MapPin, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { NormalizedGladiator } from "@/lib/gladiator/normalize";
import { useTranslations } from "next-intl";

interface Props {
  gladiator: NormalizedGladiator;
  onClose: () => void;
  locale: string;
}

export default function GladiatorDetailModal({ gladiator, onClose }: Props) {
  const t = useTranslations("GladiatorDetail");

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-amber-900/30 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          data-testid="close-modal"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-r from-amber-900/20 to-red-900/20 border-b border-amber-900/30">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center text-4xl font-bold text-white">
                {gladiator.name.charAt(0)}
              </div>
              {!gladiator.alive && (
                <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                  <span className="text-red-500 text-2xl">✝</span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-black text-amber-400">
                {gladiator.name} {gladiator.surname}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{t("from")} {gladiator.birthCity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{gladiator.health} HP</span>
                </div>
              </div>

              {/* Status */}
              {(gladiator.injury || gladiator.sickness) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {gladiator.injury && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-orange-400">
                        {gladiator.injury}
                        {gladiator.injuryTimeLeftHours && ` (${gladiator.injuryTimeLeftHours}h)`}
                      </span>
                    </div>
                  )}
                  {gladiator.sickness && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-yellow-400">{gladiator.sickness}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Combat Stats */}
          <section>
            <h3 className="text-xl font-bold text-amber-400 mb-4">{t("combatStats")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(gladiator.stats).map(([stat, description]) => {
                const Icon = statIcons[stat] || Star;
                return (
                  <div key={stat} className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-amber-400" />
                      <span className="font-semibold text-amber-400 capitalize">{t(stat)}</span>
                    </div>
                    <p className="text-sm text-gray-300">{description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Personality & Background */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4">{t("personality")}</h3>
              <div className="space-y-3">
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">{t("lifeGoal")}</h4>
                  <p className="text-sm text-gray-300">{gladiator.lifeGoal}</p>
                </div>
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">{t("personalityTrait")}</h4>
                  <p className="text-sm text-gray-300">{gladiator.personality}</p>
                </div>
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">{t("likes")}</h4>
                  <p className="text-sm text-gray-300">{gladiator.likes}</p>
                </div>
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">{t("dislikes")}</h4>
                  <p className="text-sm text-gray-300">{gladiator.dislikes}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4">{t("background")}</h3>
              <div className="space-y-3">
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">{t("backstory")}</h4>
                  <p className="text-sm text-gray-300">{gladiator.backstory}</p>
                </div>
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">{t("notableHistory")}</h4>
                  <p className="text-sm text-gray-300">{gladiator.notableHistory}</p>
                </div>
                <div className="bg-black/40 border border-amber-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">{t("physicalCondition")}</h4>
                  <p className="text-sm text-gray-300">{gladiator.physicalCondition}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Weaknesses & Special Traits */}
          <section>
            <h3 className="text-xl font-bold text-amber-400 mb-4">{t("specialTraits")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-900/10 border border-red-700/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-400 mb-1">{t("weakness")}</h4>
                <p className="text-sm text-gray-300">{gladiator.weakness}</p>
              </div>
              <div className="bg-red-900/10 border border-red-700/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-400 mb-1">{t("fear")}</h4>
                <p className="text-sm text-gray-300">{gladiator.fear}</p>
              </div>
              {gladiator.handicap && (
                <div className="bg-orange-900/10 border border-orange-700/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-400 mb-1">{t("handicap")}</h4>
                  <p className="text-sm text-gray-300">{gladiator.handicap}</p>
                </div>
              )}
              {gladiator.uniquePower && (
                <div className="bg-purple-900/10 border border-purple-700/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-400 mb-1">{t("uniquePower")}</h4>
                  <p className="text-sm text-gray-300">{gladiator.uniquePower}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
