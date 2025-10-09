"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, AlertCircle, Activity } from "lucide-react";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";

interface Props {
  gladiators: NormalizedGladiator[];
  locale: string;
  translations: {
    health: string;
    injured: string;
    sick: string;
    healthy: string;
    viewDetails: string;
  };
}

export default function GladiatorGrid({ gladiators, locale, translations: t }: Props) {
  const router = useRouter();

  const getHealthStatus = (gladiator: NormalizedGladiator) => {
    if (gladiator.injury) return { label: t.injured, color: 'text-orange-400', icon: AlertCircle };
    if (gladiator.sickness) return { label: t.sick, color: 'text-yellow-400', icon: Activity };
    return { label: t.healthy, color: 'text-green-400', icon: Heart };
  };

  return (
    <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {gladiators.map((gladiator, index) => {
        const healthStatus = getHealthStatus(gladiator);
        const StatusIcon = healthStatus.icon;

        return (
          <motion.div
            key={gladiator.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => router.push(`/${locale}/gladiator/${gladiator.id}`)}
            className="group cursor-pointer"
            data-testid={`gladiator-${gladiator.id}`}
          >
            <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 rounded-lg p-2.5 hover:border-amber-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/20">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-2.5">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center text-lg font-bold text-white">
                    {gladiator.name.charAt(0)}
                  </div>
                  {!gladiator.alive && (
                    <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                      <span className="text-red-500 text-xs">✝</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-amber-400 truncate">
                    {gladiator.name} {gladiator.surname}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate">
                    {gladiator.birthCity}
                  </p>

                  {/* Health Status */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <StatusIcon className={`w-3 h-3 ${healthStatus.color}`} />
                    <span className={`text-[10px] ${healthStatus.color}`}>
                      {healthStatus.label}
                    </span>
                    {gladiator.injuryTimeLeftHours && (
                      <span className="text-[10px] text-gray-500">
                        ({gladiator.injuryTimeLeftHours}h)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Health Bar */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="text-gray-500">{t.health}</span>
                  <span className="text-gray-400">{gladiator.health} HP</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                    style={{ width: `${(gladiator.health / 300) * 100}%` }}
                  />
                </div>
              </div>



              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />

              {/* View Details Button (appears on hover) */}
              <button
                className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-amber-600/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label={t.viewDetails}
              >
                {t.viewDetails}
              </button>
            </div>
          </motion.div>
        );
      })}
      </div>
    </div>
  );
}
