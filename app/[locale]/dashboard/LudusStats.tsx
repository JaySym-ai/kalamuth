"use client";

import { motion } from "framer-motion";
import { Coins, Trophy, Heart, Users } from "lucide-react";
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
    gladiatorCount: string;
  };
}

export default function LudusStats({ ludus, translations: t }: Props) {
  const locale = useLocale();
  const router = useRouter();

  const handleClick = () => {
    router.push(`/${locale}/ludus`);
  };

  return (
    <div onClick={handleClick} className="block cursor-pointer">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3 hover:border-amber-700/50 transition-colors cursor-pointer"
        data-testid="ludus-overview-card"
      >
        <h3 className="text-sm font-bold text-amber-400 mb-2">
          {t.ludusOverview}
        </h3>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Treasury */}
          <div className="flex items-center gap-1.5">
            <Coins className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">
              {ludus.treasury.amount.toLocaleString()}
            </span>
          </div>

          {/* Reputation */}
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">
              {ludus.reputation}
            </span>
          </div>

          {/* Morale */}
          <div className="flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-red-400" />
            <span className="text-xs text-red-400 font-medium">
              {ludus.morale}
            </span>
          </div>

          {/* Gladiator Count */}
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">
              {ludus.gladiatorCount}/{ludus.maxGladiators}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
