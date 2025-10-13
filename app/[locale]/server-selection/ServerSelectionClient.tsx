"use client";

import { debug_error } from "@/utils/debug";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { GameServer } from "@/types/server";

interface Props {
  servers: GameServer[];
}

export default function ServerSelectionClient({ servers }: Props) {
  const t = useTranslations("ServerSelection");
  const locale = useLocale();
  const router = useRouter();
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleServerSelect = async () => {
    if (!selectedServer) return;
    
    setLoading(true);
    try {
      // Store selected server in session/cookie for the next step
      sessionStorage.setItem("selectedServerId", selectedServer);
      router.push(`/${locale}/ludus-creation`);
    } catch (error) {
      debug_error("Error selecting server:", error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Server Grid */}
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 min-w-max">
        {servers.map((server, index) => (
          <motion.div
            key={server.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <button
              onClick={() => setSelectedServer(server.id)}
              disabled={loading}
              className={`
                w-80 text-left transition-all duration-300 transform hover:scale-105 flex-shrink-0
                ${selectedServer === server.id ? "scale-105" : ""}
              `}
              data-testid={`server-${server.id}`}
            >
              <div
                className={`
                  relative bg-black/40 backdrop-blur-sm border-2 rounded-xl p-6
                  transition-all duration-300
                  ${selectedServer === server.id
                    ? "border-amber-500 shadow-2xl shadow-amber-500/30"
                    : "border-amber-900/30 hover:border-amber-700/50"
                  }
                `}
              >
                {/* Server Status Badge */}
                <div className="absolute top-4 right-4">
                  {server.status === "new" && (
                    <span className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-green-400 text-xs font-medium">
                      {t("status.new")}
                    </span>
                  )}
                  {server.status === "live" && (
                    <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 text-xs font-medium">
                      {t("status.live")}
                    </span>
                  )}
                  {server.status === "closed" && (
                    <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 text-xs font-medium">
                      {t("status.closed")}
                    </span>
                  )}
                </div>

                {/* Server Name */}
                <h3 className="text-2xl font-bold text-amber-400 mb-2">
                  {t(`servers.${server.id}.name`)}
                </h3>

                {/* Server Description */}
                <p className="text-gray-400 text-sm mb-4">
                  {t(`servers.${server.id}.description`)}
                </p>

                {/* Server Features */}
                <div className="space-y-2">
                  {/* Hardcore Mode */}
                  <div className="flex items-center gap-2">
                    {server.hardcore ? (
                      <>
                        <span className="text-red-500">💀</span>
                        <span className="text-sm text-red-400">{t("features.hardcore")}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-green-500">🛡️</span>
                        <span className="text-sm text-green-400">{t("features.safe")}</span>
                      </>
                    )}
                  </div>

                  {/* Paid Only */}
                  {server.paidOnly && (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">👑</span>
                      <span className="text-sm text-yellow-400">{t("features.paidOnly")}</span>
                    </div>
                  )}

                  {/* Initial Gladiators */}
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">⚔️</span>
                    <span className="text-sm text-gray-400">
                      {t("features.initialGladiators", { count: server.config.initialGladiatorsPerLudus })}
                    </span>
                  </div>

                  {/* Max Gladiators */}
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500">🏛️</span>
                    <span className="text-sm text-gray-400">
                      {t("features.maxGladiators", { count: server.config.ludusMaxGladiators })}
                    </span>
                  </div>
                </div>

                {/* Selected Indicator */}
                {selectedServer === server.id && (
                  <div className="absolute inset-0 rounded-xl border-2 border-amber-500 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-amber-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                        {t("selected")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          </motion.div>
        ))}
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center mt-12">
        <button
          onClick={handleServerSelect}
          disabled={!selectedServer || loading}
          className={`
            relative px-12 py-5 rounded-lg font-bold text-xl text-white
            transform transition-all duration-300
            ${selectedServer && !loading
              ? "bg-gradient-to-r from-amber-600 to-red-600 hover:scale-105 shadow-2xl shadow-amber-600/30"
              : "bg-gray-800 cursor-not-allowed opacity-50"
            }
          `}
          data-testid="continue-button"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t("loading")}
            </span>
          ) : (
            t("continueButton")
          )}
        </button>
      </div>

      {/* Info Text */}
      <p className="text-center text-gray-500 text-sm mt-6">
        {t("infoText")}
      </p>
    </div>
  );
}
