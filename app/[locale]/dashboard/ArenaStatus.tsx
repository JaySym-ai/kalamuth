"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Swords, Skull, Shield, ChevronRight } from "lucide-react";

interface TranslatedArena {
  slug: string;
  name: string;
  city: string;
  deathEnabled: boolean;
}

interface Props {
  arenas: TranslatedArena[];
  translations: {
    arena: string;
    arenaCityLabel: string;
    arenaAllowsDeath: string;
    arenaNoDeath: string;
    arenaEmpty: string;
    viewArena: string;
  };
}

export default function ArenaStatus({ arenas, translations: t }: Props) {
  const router = useRouter();
  const locale = useLocale();

  const handleArenaClick = (arenaSlug: string) => {
    router.push(`/${locale}/arena/${arenaSlug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3"
      data-testid="arena-status-card"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
          <Swords className="w-4 h-4" />
          {t.arena}
        </h3>
      </div>

      <div className="space-y-2">
        {arenas.length > 0 ? (
          arenas.map((arena, index) => (
            <motion.button
              key={`${arena.slug}-${arena.city}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              onClick={() => handleArenaClick(arena.slug)}
              className="w-full text-left group relative overflow-hidden rounded-lg border border-amber-900/40 bg-black/40 p-2.5 transition-all duration-300 hover:border-amber-600/60 hover:bg-amber-900/10 hover:scale-[1.02]"
              data-testid={`arena-card-${arena.slug}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                    {arena.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.arenaCityLabel}: <span className="text-amber-300">{arena.city}</span>
                  </p>
                  <div className="flex items-center gap-1.5 text-xs mt-1">
                    {arena.deathEnabled ? (
                      <>
                        <Skull className="h-3 w-3 text-red-400" />
                        <span className="text-red-200">{t.arenaAllowsDeath}</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-3 w-3 text-emerald-300" />
                        <span className="text-emerald-200">{t.arenaNoDeath}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/0 via-amber-600/5 to-amber-600/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.button>
          ))
        ) : (
          <p className="text-xs italic text-gray-400">{t.arenaEmpty}</p>
        )}
      </div>
    </motion.div>
  );
}
