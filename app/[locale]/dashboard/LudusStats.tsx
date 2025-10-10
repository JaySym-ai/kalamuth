"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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
        className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-2 hover:border-amber-700/50 transition-colors cursor-pointer"
        data-testid="ludus-overview-card"
      >
        {/* Status Bar - Single Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Treasury */}
          <div className="flex items-center gap-1">
            <div className="relative w-3 h-3">
              <Image
                src="/assets/icon/money.png"
                alt="Treasury"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xs text-amber-400 font-medium">
              {ludus.treasury.amount.toLocaleString()}
            </span>
          </div>

          {/* Reputation */}
          <div className="flex items-center gap-1">
            <div className="relative w-3 h-3">
              <Image
                src="/assets/icon/reputation.png"
                alt="Reputation"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xs text-amber-400 font-medium">
              {ludus.reputation}
            </span>
          </div>

          {/* Morale */}
          <div className="flex items-center gap-1">
            <div className="relative w-3 h-3">
              <Image
                src="/assets/icon/morale.png"
                alt="Morale"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xs text-red-400 font-medium">
              {ludus.morale}
            </span>
          </div>

          {/* Gladiator Count */}
          <div className="flex items-center gap-1">
            <div className="relative w-3 h-3">
              <Image
                src="/assets/icon/gladiators.png"
                alt="Gladiators"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xs text-amber-400 font-medium">
              {ludus.gladiatorCount}/{ludus.maxGladiators}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
