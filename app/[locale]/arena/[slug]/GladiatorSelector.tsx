"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";
import GladiatorAvatar from "@/components/ui/GladiatorAvatar";
import { getExtendedHealthStatus, type ExtendedHealthStatus } from "@/lib/gladiator/health-status";



interface Props {
  gladiators: NormalizedGladiator[];
  selectedGladiatorId: string | null;
  onSelect: (gladiatorId: string) => void;
  queuedGladiatorIds: Set<string>;
  translations: {
    selectGladiator: string;
    selectGladiatorDesc: string;
    showGladiators: string;
    hideGladiators: string;
    availableGladiators: string;
    noAvailableGladiators: string;
    rankingPoints: string;
    healthStatus: string;
    gladiatorInjured: string;
    gladiatorSick: string;
    gladiatorDead: string;
    gladiatorAlreadyQueued: string;
  };
  initiallyExpanded?: boolean;

}

export default function GladiatorSelector({
  gladiators,
  selectedGladiatorId,
  onSelect,
  queuedGladiatorIds,
  translations: t,
  initiallyExpanded = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  useEffect(() => {
    if (initiallyExpanded && !isExpanded) {
      setIsExpanded(true);
    }
  }, [initiallyExpanded, isExpanded]);

  const getGladiatorStatus = (gladiator: NormalizedGladiator): ExtendedHealthStatus => {
    return getExtendedHealthStatus(gladiator, {
      healthy: t.healthStatus,
      injured: t.gladiatorInjured,
      sick: t.gladiatorSick,
      dead: t.gladiatorDead,
      queued: t.gladiatorAlreadyQueued,
    }, {
      queuedGladiatorIds,
    });
  };

  const selectedGladiator = gladiators.find(g => g.id === selectedGladiatorId);
  const availableGladiators = gladiators.filter(g => {
    const status = getGladiatorStatus(g);
    return !status.disabled;
  });

  return (
    <div className="bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-amber-400 mb-2">
        {t.selectGladiator}
      </h2>
      <p className="text-sm text-gray-400 mb-4">{t.selectGladiatorDesc}</p>

      {/* Selected Gladiator Display */}
      {selectedGladiator ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-4 bg-gradient-to-br from-amber-900/20 to-red-900/20 border border-amber-600/40 rounded-xl"
        >
          <div className="flex items-center gap-4">
            <GladiatorAvatar
              name={selectedGladiator.name}
              avatarUrl={selectedGladiator.avatarUrl}
              size="md"
              alive={selectedGladiator.alive}
              injured={!!selectedGladiator.injury}
            />
            <div className="flex-1">
              <h3 className="font-bold text-amber-300 text-lg">
                {selectedGladiator.name} {selectedGladiator.surname}
              </h3>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-sm">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-gray-300">{selectedGladiator.health} HP</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="mb-4 p-4 bg-black/40 border border-gray-700/40 rounded-xl text-center text-gray-500">
          {availableGladiators.length > 0 ? t.selectGladiatorDesc : t.noAvailableGladiators}
        </div>
      )}

      {/* Expand/Collapse Button */}
      {gladiators.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 bg-amber-900/20 hover:bg-amber-900/30 border border-amber-800/40 rounded-lg transition-colors mb-2"
          data-testid="toggle-gladiator-list"
        >
          <span className="text-amber-300 font-medium">
            {isExpanded ? t.hideGladiators : t.showGladiators} Gladiators ({availableGladiators.length} {t.availableGladiators})
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-amber-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-amber-400" />
          )}
        </button>
      )}

      {/* Gladiator List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {gladiators.map((gladiator) => {
                const status = getGladiatorStatus(gladiator);
                const isSelected = gladiator.id === selectedGladiatorId;
                const buttonStateClasses = (() => {
                  if (isSelected) {
                    return "bg-amber-900/30 border-amber-600/60 shadow-lg shadow-amber-900/20";
                  }

                  if (status.variant === "critical") {
                    return `bg-gray-900/20 ${status.borderClass} opacity-50 cursor-not-allowed`;
                  }

                  if (status.variant === "queued") {
                    return `bg-gray-900/20 ${status.borderClass} opacity-50 cursor-not-allowed`;
                  }

                  if (status.variant === "injured") {
                    return `bg-black/40 ${status.borderClass} hover:bg-red-950/20`;
                  }

                  if (status.variant === "sick") {
                    return `bg-black/40 ${status.borderClass} hover:bg-blue-950/20`;
                  }

                  return `bg-black/40 ${status.borderClass} hover:bg-emerald-900/10`;
                })();
                const showBadge = status.variant !== "healthy";

                return (
                  <motion.button
                    key={gladiator.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => !status.disabled && onSelect(gladiator.id)}
                    disabled={status.disabled}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${buttonStateClasses}`}
                    data-testid={`gladiator-option-${gladiator.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <GladiatorAvatar
                        name={gladiator.name}
                        avatarUrl={gladiator.avatarUrl}
                        size="sm"
                        alive={gladiator.alive}
                        injured={!!gladiator.injury}
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate">
                          {gladiator.name} {gladiator.surname}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Heart className="w-3 h-3 text-red-400" />
                            <span className="text-gray-400">{gladiator.health}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {showBadge && (
                        <div className={`text-xs px-2 py-1 rounded ${status.color} ${status.badgeClass}`}>
                          {status.label}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
