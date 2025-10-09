"use client";

import { motion } from "framer-motion";
import { Coins, Trophy, Heart, Building, MapPin, Users, ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
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
    backToDashboard: string;
  };
}

export default function LudusDetailClient({ ludus, translations: t }: Props) {
  const locale = useLocale();
  const router = useRouter();

  const facilityNames: Record<keyof typeof ludus.facilities, string> = {
    infirmaryLevel: t.infirmary,
    trainingGroundLevel: t.trainingGround,
    quartersLevel: t.quarters,
    kitchenLevel: t.kitchen,
  };

  const handleBackToDashboard = () => {
    router.push(`/${locale}/dashboard`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-1.5 text-gray-400 hover:text-amber-400 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToDashboard}</span>
        </button>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3"
        data-testid="ludus-detail-card"
      >
        <h1 className="text-lg font-bold text-amber-400 mb-3">
          {t.ludusOverview}
        </h1>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Treasury */}
          <div className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold">{t.treasury}</span>
            </div>
            <div className="text-sm font-bold text-amber-400">
              {ludus.treasury.amount.toLocaleString()}
            </div>
          </div>

          {/* Reputation */}
          <div className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold">{t.reputation}</span>
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${ludus.reputation}%` }}
                />
              </div>
              <span className="text-sm font-bold text-amber-400">{ludus.reputation}%</span>
            </div>
          </div>

          {/* Morale */}
          <div className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold">{t.morale}</span>
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                  style={{ width: `${ludus.morale}%` }}
                />
              </div>
              <span className="text-sm font-bold text-red-400">{ludus.morale}%</span>
            </div>
          </div>

          {/* Gladiator Count */}
          <div className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold">{t.gladiatorCount}</span>
            </div>
            <div className="text-sm font-bold text-amber-400">
              {ludus.gladiatorCount} / {ludus.maxGladiators}
            </div>
          </div>
        </div>

        {/* Location */}
        {ludus.locationCity && (
          <div className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50 mb-3">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold">{t.location}</span>
            </div>
            <div className="text-sm text-amber-400">{ludus.locationCity}</div>
          </div>
        )}

        {/* Facilities */}
        <div className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50">
          <div className="flex items-center gap-1.5 text-gray-400 mb-2">
            <Building className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold">{t.facilities}</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(ludus.facilities).map(([key, level]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                <span className="text-gray-300 text-xs font-medium">
                  {facilityNames[key as keyof typeof ludus.facilities]}
                </span>
                <div className="flex items-center gap-1.5">
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
                  <span className="text-gray-400 text-xs ml-1">
                    {t.level} {level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}