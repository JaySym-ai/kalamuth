"use client";

import { motion } from "framer-motion";
import { Coins, Trophy, Heart, Building, MapPin, Users } from "lucide-react";
import type { Ludus } from "@/types/ludus";

interface Props {
  ludus: Ludus & { id: string };
  translations: {
    ludusOverview: string;
    treasury: string;
    reputation: string;
    morale: string;
    facilities: string;
    infirmary: string;
    trainingGround: string;
    quarters: string;
    kitchen: string;
    level: string;
    location: string;
    gladiatorCount: string;
  };
}

export default function LudusStats({ ludus, translations: t }: Props) {
  const facilityNames: Record<keyof typeof ludus.facilities, string> = {
    infirmaryLevel: t.infirmary,
    trainingGroundLevel: t.trainingGround,
    quartersLevel: t.quarters,
    kitchenLevel: t.kitchen,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6"
      data-testid="ludus-overview-card"
    >
      <h3 className="text-xl font-bold text-amber-400 mb-4">
        {t.ludusOverview}
      </h3>

      {/* Main Stats */}
      <div className="space-y-4 mb-6">
        {/* Treasury */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <Coins className="w-4 h-4" />
            <span className="text-sm">{t.treasury}</span>
          </div>
          <span className="text-amber-400 font-bold">
            {ludus.treasury.amount.toLocaleString()} {ludus.treasury.currency}
          </span>
        </div>

        {/* Reputation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">{t.reputation}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                style={{ width: `${ludus.reputation}%` }}
              />
            </div>
            <span className="text-amber-400 text-sm font-bold">{ludus.reputation}</span>
          </div>
        </div>

        {/* Morale */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <Heart className="w-4 h-4" />
            <span className="text-sm">{t.morale}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                style={{ width: `${ludus.morale}%` }}
              />
            </div>
            <span className="text-red-400 text-sm font-bold">{ludus.morale}</span>
          </div>
        </div>

        {/* Gladiator Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{t.gladiatorCount}</span>
          </div>
          <span className="text-amber-400 font-bold">
            {ludus.gladiatorCount} / {ludus.maxGladiators}
          </span>
        </div>

        {/* Location */}
        {ludus.locationCity && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{t.location}</span>
            </div>
            <span className="text-amber-400">{ludus.locationCity}</span>
          </div>
        )}
      </div>

      {/* Facilities */}
      <div className="border-t border-amber-900/20 pt-4">
        <div className="flex items-center gap-2 text-gray-400 mb-3">
          <Building className="w-4 h-4" />
          <span className="text-sm font-semibold">{t.facilities}</span>
        </div>
        <div className="space-y-2">
          {Object.entries(ludus.facilities).map(([key, level]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {facilityNames[key as keyof typeof ludus.facilities]}
              </span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < level
                        ? 'bg-amber-400'
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-400 ml-2">
                  {t.level} {level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
