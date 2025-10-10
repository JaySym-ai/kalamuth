"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, MapPin } from "lucide-react";
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
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-3"
      >
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-1.5 text-gray-400 hover:text-amber-400 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToDashboard}</span>
        </button>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3 hover:border-amber-700/50 transition-colors duration-300"
        data-testid="ludus-detail-card"
      >
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-bold text-amber-400 mb-3"
        >
          {t.ludusOverview}
        </motion.h1>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Treasury */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50 hover:border-amber-700/30 transition-colors duration-300"
          >
            <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
              <div className="relative w-4 h-4">
                <Image
                  src="/assets/icon/money.png"
                  alt="Treasury"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-semibold">{t.treasury}</span>
            </div>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-sm font-bold text-amber-400"
            >
              {ludus.treasury.amount.toLocaleString()}
            </motion.div>
          </motion.div>

          {/* Reputation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50 hover:border-amber-700/30 transition-colors duration-300"
          >
            <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
              <div className="relative w-4 h-4">
                <Image
                  src="/assets/icon/reputation.png"
                  alt="Reputation"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-semibold">{t.reputation}</span>
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ludus.reputation}%` }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                />
              </div>
              <span className="text-sm font-bold text-amber-400">{ludus.reputation}%</span>
            </div>
          </motion.div>

          {/* Morale */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50 hover:border-red-700/30 transition-colors duration-300"
          >
            <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
              <div className="relative w-4 h-4">
                <Image
                  src="/assets/icon/morale.png"
                  alt="Morale"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-semibold">{t.morale}</span>
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ludus.morale}%` }}
                  transition={{ delay: 0.65, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                />
              </div>
              <span className="text-sm font-bold text-red-400">{ludus.morale}%</span>
            </div>
          </motion.div>

          {/* Gladiator Count */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50 hover:border-amber-700/30 transition-colors duration-300"
          >
            <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
              <div className="relative w-4 h-4">
                <Image
                  src="/assets/icon/gladiators.png"
                  alt="Gladiators"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-semibold">{t.gladiatorCount}</span>
            </div>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="text-sm font-bold text-amber-400"
            >
              {ludus.gladiatorCount} / {ludus.maxGladiators}
            </motion.div>
          </motion.div>
        </div>

        {/* Location */}
        {ludus.locationCity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50 mb-3 hover:border-amber-700/30 transition-colors duration-300"
          >
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold">{t.location}</span>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-sm text-amber-400"
            >
              {ludus.locationCity}
            </motion.div>
          </motion.div>
        )}

        {/* Facilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/50 hover:border-amber-700/30 transition-colors duration-300"
        >
          <div className="flex items-center gap-1.5 text-gray-400 mb-2">
            <div className="relative w-4 h-4">
              <Image
                src="/assets/icon/inventory.png"
                alt="Facilities"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xs font-semibold">{t.facilities}</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(ludus.facilities).map(([key, level], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + (index * 0.1) }}
                className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
              >
                <span className="text-gray-300 text-xs font-medium">
                  {facilityNames[key as keyof typeof ludus.facilities]}
                </span>
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9 + (index * 0.1) + (i * 0.05), type: "spring" }}
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
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}