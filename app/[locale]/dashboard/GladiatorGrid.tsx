"use client";

import { motion } from "framer-motion";
import { Heart, AlertCircle, Activity } from "lucide-react";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";

interface Props {
  gladiators: NormalizedGladiator[];
  onGladiatorClick: (gladiator: NormalizedGladiator) => void;
  translations: {
    health: string;
    injured: string;
    sick: string;
    healthy: string;
    viewDetails: string;
  };
}

export default function GladiatorGrid({ gladiators, onGladiatorClick, translations: t }: Props) {
  const getHealthStatus = (gladiator: NormalizedGladiator) => {
    if (gladiator.injury) return { label: t.injured, color: 'text-orange-400', icon: AlertCircle };
    if (gladiator.sickness) return { label: t.sick, color: 'text-yellow-400', icon: Activity };
    return { label: t.healthy, color: 'text-green-400', icon: Heart };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {gladiators.map((gladiator, index) => {
        const healthStatus = getHealthStatus(gladiator);
        const StatusIcon = healthStatus.icon;

        return (
          <motion.div
            key={gladiator.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onGladiatorClick(gladiator)}
            className="group cursor-pointer"
            data-testid={`gladiator-${gladiator.id}`}
          >
            <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 rounded-xl p-4 hover:border-amber-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/20">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center text-2xl font-bold text-white">
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
                  <h4 className="font-bold text-amber-400 truncate">
                    {gladiator.name} {gladiator.surname}
                  </h4>
                  <p className="text-xs text-gray-400 truncate">
                    {gladiator.birthCity}
                  </p>
                  
                  {/* Health Status */}
                  <div className="flex items-center gap-2 mt-2">
                    <StatusIcon className={`w-4 h-4 ${healthStatus.color}`} />
                    <span className={`text-xs ${healthStatus.color}`}>
                      {healthStatus.label}
                    </span>
                    {gladiator.injuryTimeLeftHours && (
                      <span className="text-xs text-gray-500">
                        ({gladiator.injuryTimeLeftHours}h)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Health Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">{t.health}</span>
                  <span className="text-gray-400">{gladiator.health} HP</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                    style={{ width: `${(gladiator.health / 300) * 100}%` }}
                  />
                </div>
              </div>

              {/* Quick Stats Preview */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(gladiator.stats).slice(0, 2).map(([stat, description]) => (
                  <div key={stat} className="text-xs">
                    <span className="text-gray-500 capitalize">{stat}:</span>
                    <p className="text-gray-400 truncate text-[10px] mt-0.5">
                      {description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
              
              {/* View Details Button (appears on hover) */}
              <button
                className="absolute bottom-2 right-2 px-3 py-1 bg-amber-600/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label={t.viewDetails}
              >
                {t.viewDetails}
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
