"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SERVERS } from "@/data/servers";
import { debug_error } from "@/utils/debug";

interface ServerWithLudusStatus {
  id: string;
  name: string;
  description?: string;
  status?: string;
  hasLudus: boolean;
}

export default function ChangeServerButton() {
  const t = useTranslations("ChangeServer");
  const router = useRouter();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [servers, setServers] = useState<ServerWithLudusStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmServerId, setConfirmServerId] = useState<string | null>(null);

  // Fetch user's ludus across all servers
  useEffect(() => {
    if (!isOpen) return;

    const fetchServersWithLudusStatus = async () => {
      try {
        const response = await fetch("/api/user/servers");
        if (!response.ok) throw new Error("Failed to fetch servers");

        const data = await response.json();
        const serversWithStatus: ServerWithLudusStatus[] = SERVERS.map((server) => ({
          id: server.id,
          name: server.name,
          description: server.description,
          status: server.status,
          hasLudus: data.ludusServers?.includes(server.id) ?? false,
        }));

        setServers(serversWithStatus);
      } catch (error) {
        debug_error("Error fetching servers:", error);
      }
    };

    fetchServersWithLudusStatus();
  }, [isOpen]);

  const handleSelectServer = (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return;

    if (server.hasLudus) {
      // Has ludus, switch directly
      handleSwitchServer(serverId);
    } else {
      // No ludus, show confirmation
      setConfirmServerId(serverId);
      setShowConfirm(true);
    }
  };

  const handleSwitchServer = async (serverId: string) => {
    setLoading(true);
    setSelectedServerId(serverId);

    try {
      // Always set favorite server when switching, regardless of ludus status
      // This ensures the new server is marked as preferred after ludus creation
      const response = await fetch("/api/user/favorite-server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      });

      if (!response.ok) {
        throw new Error("Failed to set favorite server");
      }

      // Store selected server in session storage for ludus creation flow
      sessionStorage.setItem("selectedServerId", serverId);

      // Redirect to server selection page which will handle the flow
      router.push(`/${locale}/server-selection?switchServer=${serverId}`);
    } catch (error) {
      debug_error("Error switching server:", error);
      setLoading(false);
      setSelectedServerId(null);
    }
  };

  const handleConfirmSwitch = () => {
    if (confirmServerId) {
      handleSwitchServer(confirmServerId);
    }
    setShowConfirm(false);
  };

  return (
    <>
      {/* Change Server Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-500 hover:to-cyan-500 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        data-testid="change-server-button"
        aria-label={t("button")}
        title={t("button")}
      >
        <Globe className="w-5 h-5" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 border border-amber-900/30 rounded-xl shadow-2xl max-w-2xl w-full p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-amber-400 mb-1">
                    {t("title")}
                  </h2>
                  <p className="text-sm text-gray-400">{t("subtitle")}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                  aria-label={t("close")}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Servers Grid Wrapper */}
              <div className="max-h-96 overflow-y-auto [scrollbar-gutter:stable] mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
                  {servers.map((server) => (
                    <motion.button
                      key={server.id}
                      whileHover={{ y: -1 }}
                      onClick={() => handleSelectServer(server.id)}
                      disabled={loading && selectedServerId !== server.id}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        server.hasLudus
                          ? "bg-green-900/20 border-green-600/50 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20"
                          : "bg-amber-900/20 border-amber-700/50 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      data-testid={`server-option-${server.id}`}
                    >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">
                          {server.name}
                        </h3>
                        <p className="text-xs text-gray-400 mb-2">
                          {server.description}
                        </p>
                      </div>
                      <div className="text-right">
                        {loading && selectedServerId === server.id ? (
                          <div className="animate-spin w-4 h-4 text-amber-400" />
                        ) : (
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              server.hasLudus
                                ? "bg-green-600/30 text-green-300"
                                : "bg-amber-600/30 text-amber-300"
                            }`}
                          >
                            {server.hasLudus
                              ? t("hasLudus")
                              : t("noLudus")}
                          </span>
                        )}
                      </div>
                    </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Confirmation Dialog */}
              <AnimatePresence>
                {showConfirm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowConfirm(false)}
                  >
                    <motion.div
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t("confirmTitle")}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {t("confirmMessage")}
                      </p>
                      {confirmServerId && (
                        <p className="text-sm font-semibold text-amber-700 bg-amber-50 p-3 rounded-lg mb-6">
                          {servers.find((s) => s.id === confirmServerId)?.name}
                        </p>
                      )}
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => setShowConfirm(false)}
                          disabled={loading}
                          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t("confirmNo")}
                        </button>
                        <button
                          onClick={handleConfirmSwitch}
                          disabled={loading}
                          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {loading ? (
                            <div className="animate-spin w-4 h-4" />
                          ) : null}
                          {t("confirmYes")}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

