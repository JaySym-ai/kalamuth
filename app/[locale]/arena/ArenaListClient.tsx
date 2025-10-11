"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Skull, Shield, MapPin, Users } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

interface TranslatedArena {
  slug: string;
  name: string;
  city: string;
  cityPopulation: number;
  deathEnabled: boolean;
}

interface Props {
  arenas: TranslatedArena[];
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    backToDashboard: string;
    cityLabel: string;
    populationLabel: string;
    allowsDeath: string;
    noDeath: string;
    enterArena: string;
    noArenas: string;
  };
}

export default function ArenaListClient({ arenas, locale, translations: t }: Props) {
  const router = useRouter();

  const handleArenaClick = (arenaSlug: string) => {
    router.push(`/${locale}/arena/${arenaSlug}`);
  };

  return (
    <PageLayout
      title={t.title}
      subtitle={t.subtitle}
      backHref={`/${locale}/dashboard`}
      icon="/assets/icon/arena.png"
      background="arena"
    >
      {/* Arena Grid */}
      <div className="space-y-[clamp(0.75rem,2vw,1.5rem)]">
        {arenas.length > 0 ? (
          arenas.map((arena, index) => (
            <motion.div
              key={arena.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-4 hover:border-amber-600/60 hover:bg-amber-900/10 transition-all duration-300 group"
              data-testid={`arena-card-${arena.slug}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Arena Info */}
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors mb-2">
                    {arena.name}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* City */}
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span className="text-gray-500">{t.cityLabel}:</span>
                      <span className="text-amber-300">{arena.city}</span>
                    </div>

                    {/* Population */}
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Users className="w-3 h-3 text-amber-400" />
                      <span className="text-gray-500">{t.populationLabel}:</span>
                      <span className="text-white">{arena.cityPopulation.toLocaleString()}</span>
                    </div>

                    {/* Death Status */}
                    <div className="flex items-center gap-1.5">
                      {arena.deathEnabled ? (
                        <>
                          <Skull className="w-3 h-3 text-red-400" />
                          <span className="text-red-200">{t.allowsDeath}</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-3 h-3 text-emerald-300" />
                          <span className="text-emerald-200">{t.noDeath}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enter Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleArenaClick(arena.slug)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-lg shadow-amber-900/50"
                  data-testid={`enter-arena-${arena.slug}`}
                >
                  {t.enterArena}
                </motion.button>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-400 text-sm italic"
          >
            {t.noArenas}
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
}

