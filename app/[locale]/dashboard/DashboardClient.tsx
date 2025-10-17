"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";
import type { Ludus } from "@/types/ludus";
import type { GameServer } from "@/types/server";
import { useLudusRealtime } from "@/lib/ludus/hooks";

import LogoutButton from "@/components/auth/LogoutButton";
import ChangeServerButton from "@/components/dashboard/ChangeServerButton";
import LudusStats from "./LudusStats";
import PageLayout from "@/components/layout/PageLayout";
import { slideDown, slideUpWithDelay } from "@/lib/animations/presets";

interface DashboardTranslations {
  title: string;
  ludusOverview: string;
  arena: string;
  tavern: string;
  shop: string;
  inventory: string;
  arenaCityLabel: string;
  arenaAllowsDeath: string;
  arenaNoDeath: string;
  arenaEmpty: string;
  viewArena: string;
  treasury: string;
  reputation: string;
  morale: string;
  facilities: string;
  infirmary: string;
  trainingGround: string;
  quarters: string;
  kitchen: string;
  level: string;
  yourGladiators: string;
  gladiatorCount: string;
  location: string;
  motto: string;
  createdAt: string;
  connectedServer: string;
}

interface Props {
  ludus: Ludus & { id: string };
  locale: string;
  server?: GameServer;
  translations: DashboardTranslations;
}

export default function DashboardClient({ ludus, server, translations: t }: Props) {
  const router = useRouter();
  const currentLocale = useLocale();

  const { ludus: currentLudus } = useLudusRealtime(ludus);


  return (
    <PageLayout
      title={currentLudus.name}
      subtitle={currentLudus.motto ? `"${currentLudus.motto}"` : undefined}
      background="arena"
      rightActions={
        <div className="flex items-center gap-3">
          <ChangeServerButton />
          <LogoutButton />
        </div>
      }
      showBackButton={false}
    >
      {/* Server Tagline */}
      {server && (
        <motion.div
          {...slideDown}
          className="mb-4 px-4 py-2 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/50 rounded-lg text-center"
        >
          <p className="text-xs sm:text-sm text-amber-100">
            {t.connectedServer}: <span className="font-semibold text-amber-50">{server.name}</span>
          </p>
        </motion.div>
      )}
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[clamp(0.75rem,2vw,1.5rem)] pb-[clamp(0.75rem,2vw,1.5rem)]">
        {/* Left Column - Ludus Overview */}
        <div className="lg:col-span-1 space-y-3" data-testid="dashboard-left-column">
          {/* Ludus Stats Card */}
          <LudusStats
            ludus={currentLudus}
            translations={{
              ludusOverview: t.ludusOverview,
              treasury: t.treasury,
              reputation: t.reputation,
              morale: t.morale,
              gladiatorCount: t.gladiatorCount,
            }}
          />

          {/* Arena Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push(`/${currentLocale}/arena`)}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3 hover:border-amber-600/60 hover:bg-amber-900/10 transition-all duration-300 hover:scale-[1.02] group"
            data-testid="arena-button"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-5 h-5">
                <Image
                  src="/assets/icon/arena.png"
                  alt="Arena"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                {t.arena}
              </span>
            </div>
          </motion.button>

          {/* Tavern Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => router.push(`/${currentLocale}/tavern`)}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3 hover:border-amber-600/60 hover:bg-amber-900/10 transition-all duration-300 hover:scale-[1.02] group"
            data-testid="tavern-button"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-5 h-5">
                <Image
                  src="/assets/icon/tavern.png"
                  alt="Tavern"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                {t.tavern}
              </span>
            </div>
          </motion.button>

          {/* Quests Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => router.push(`/${currentLocale}/quests`)}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3 hover:border-amber-600/60 hover:bg-amber-900/10 transition-all duration-300 hover:scale-[1.02] group"
            data-testid="quests-button"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-5 h-5">
                <Image
                  src="/assets/icon/quest.png"
                  alt="Quests"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                Quests
              </span>
            </div>
          </motion.button>

          {/* Your Gladiators Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.push(`/${currentLocale}/gladiators`)}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3 hover:border-amber-600/60 hover:bg-amber-900/10 transition-all duration-300 hover:scale-[1.02] group"
            data-testid="gladiators-button"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-5 h-5">
                <Image
                  src="/assets/icon/gladiators.png"
                  alt="Gladiators"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                {t.yourGladiators}
              </span>
            </div>
          </motion.button>

          {/* Shop Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => router.push(`/${currentLocale}/shop`)}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3 hover:border-amber-600/60 hover:bg-amber-900/10 transition-all duration-300 hover:scale-[1.02] group"
            data-testid="shop-button"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-5 h-5">
                <Image
                  src="/assets/icon/shop.png"
                  alt="Shop"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                {t.shop}
              </span>
            </div>
          </motion.button>

          {/* Inventory Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.push(`/${currentLocale}/inventory`)}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3 hover:border-amber-600/60 hover:bg-amber-900/10 transition-all duration-300 hover:scale-[1.02] group"
            data-testid="inventory-button"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-5 h-5">
                <Image
                  src="/assets/icon/inventory.png"
                  alt="Inventory"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                {t.inventory}
              </span>
            </div>
          </motion.button>
        </div>

        {/* Right Column - Empty or future content */}
        <div className="lg:col-span-2">
          <motion.div
            {...slideUpWithDelay(0.3)}
            className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 text-center"
          >
            <div className="text-gray-400">
              <h3 className="text-lg font-bold text-amber-400 mb-2">Welcome to your Ludus</h3>
              <p className="text-sm">Manage your gladiators and prepare them for battle in the arena.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
