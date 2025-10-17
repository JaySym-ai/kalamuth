"use client";

import { debug_error } from "@/utils/debug";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Send, SkipForward } from "lucide-react";
import type { Ludus } from "@/types/ludus";
import { normalizeGladiator, type NormalizedGladiator } from "@/lib/gladiator/normalize";
import { useRealtimeCollection } from "@/lib/supabase/realtime";
import GameViewport from "@/components/layout/GameViewport";

interface TavernTranslations {
  title: string;
  subtitle: string;
  welcomeMessage: string;
  currentGladiator: string;
  sendMessage: string;
  messagePlaceholder: string;
  skip: string;
  next: string;
  loadingResponse: string;
  recruitThisGladiator: string;
  chatHistory: string;
  birthCity: string;
  name: string;
  ludusFullTitle: string;
  ludusFullMessage: string;
  loadingGladiators: string;
  error: string;
  backToDashboard: string;
  recruit: string;
  recruiting: string;
  confirmSkipTitle: string;
  confirmSkipMessage: string;
  confirmSkipYes: string;
  confirmSkipNo: string;
  confirmRecruitTitle: string;
  confirmRecruitMessage: string;
  confirmRecruitYes: string;
  confirmRecruitNo: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'gladiator';
  content: string;
  timestamp: number;
}

interface Props {
  ludus: Ludus & { id: string };
  tavernGladiators: NormalizedGladiator[];
  locale: string;
  translations: TavernTranslations;
}

export default function TavernClient({ ludus, tavernGladiators, locale, translations: t }: Props) {
  const router = useRouter();
  const currentLocale = useLocale();
  const [currentGladiatorIndex, setCurrentGladiatorIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recruiting, setRecruiting] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showRecruitConfirm, setShowRecruitConfirm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Realtime subscription to tavern gladiators - filter by both ludusId AND serverId to prevent cross-server contamination
  const { data: realtimeTavernGladiators, refresh: refreshTavernGladiators } = useRealtimeCollection<NormalizedGladiator>({
    table: "tavern_gladiators",
    select: "id, ludusId, serverId, name, surname, avatarUrl, birthCity, health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive",
    match: { ludusId: ludus.id, serverId: ludus.serverId }, // CRITICAL: Filter by both ludus AND server to prevent cross-server contamination
    initialData: tavernGladiators,
    orderBy: { column: "createdAt", ascending: false },
    primaryKey: "id",
    transform: useCallback((row: Record<string, unknown>) => {
      const raw = row as Record<string, unknown> & { id?: unknown };
      const identifier = typeof raw.id === "string" ? raw.id : String(raw.id ?? "");
      return normalizeGladiator(identifier, raw, locale);
    }, [locale]),
  });

  const gladiators = realtimeTavernGladiators || tavernGladiators;
  const currentGladiator = gladiators[currentGladiatorIndex] || null;

  // Auto-generate tavern gladiators if none exist or if we only have one (to maintain a backup)
  useEffect(() => {
    // Always ensure we have at least 2 gladiators (current + backup)
    if (gladiators.length >= 2) return;

    setLoading(true);
    fetch("/api/tavern/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ludusId: ludus.id }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || 'Generation failed');
          });
        }
        return res.json().then((data) => {
          if (data.error) {
            throw new Error(data.error);
          }
          return data;
        });
      })
      .catch((err) => {
        debug_error("Tavern gladiator generation failed:", err);
        setError(t.error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [gladiators.length, ludus.id, t.error]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (currentGladiator && chatMessages.length === 0) {
      setChatMessages([
        {
          id: '0',
          role: 'gladiator',
          content: `${t.welcomeMessage} ${currentGladiator.name} ${currentGladiator.surname}.`,
          timestamp: Date.now(),
        }
      ]);
    }
  }, [currentGladiator, chatMessages.length, t.welcomeMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentGladiator || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      // Get last 20 messages for context (excluding the welcome message)
      const conversationHistory = chatMessages
        .slice(-20)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await fetch('/api/tavern/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          gladiatorId: currentGladiator.id,
          ludusId: ludus.id,
          locale: currentLocale,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t.error);
        return;
      }

      const data = await response.json();
      const gladiatorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'gladiator',
        content: data.response,
        timestamp: Date.now(),
      };

      setChatMessages(prev => [...prev, gladiatorMessage]);
    } catch (err) {
      debug_error("Chat failed:", err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipClick = () => {
    setShowSkipConfirm(true);
  };

  const handleSkipConfirm = async () => {
    if (!currentGladiator) return;

    setShowSkipConfirm(false);
    setIsTransitioning(true);

    try {
      const response = await fetch('/api/tavern/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ludusId: ludus.id,
          currentGladiatorId: currentGladiator.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || t.error);
        setIsTransitioning(false);
        return;
      }

      // Since we always have a backup gladiator ready, skipping is much faster:
      // 1. Wait briefly for the new gladiator to be added
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 2. Refresh to get the latest data
      await refreshTavernGladiators();

      // 3. Move to the newly added gladiator (it should be at index 0 due to createdAt ordering)
      setCurrentGladiatorIndex(0);

      // Reset chat
      setChatMessages([]);
      setError(null);
    } catch (err) {
      debug_error("Skip failed:", err);
      setError(t.error);
      setIsTransitioning(false);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleSkipCancel = () => {
    setShowSkipConfirm(false);
  };

  const handleRecruitClick = () => {
    setShowRecruitConfirm(true);
  };

  const handleRecruitConfirm = async () => {
    if (!currentGladiator || recruiting) return;

    setShowRecruitConfirm(false);
    setRecruiting(true);
    setIsTransitioning(true);
    setError(null);

    try {
      const response = await fetch('/api/tavern/recruit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ludusId: ludus.id,
          tavernGladiatorId: currentGladiator.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || t.error);
        setIsTransitioning(false);
        setRecruiting(false);
        return;
      }

      // Since we always have a backup gladiator ready, we just need to:
      // 1. Wait for realtime to process the deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 2. Refresh to ensure we have the latest data
      console.log("[Tavern] Refreshing after recruitment...");
      await refreshTavernGladiators();
      console.log("[Tavern] Gladiators after refresh:", realtimeTavernGladiators?.length || 0);

      // 3. Move to the next gladiator (index 1 becomes the new current, or 0 if only one left)
      if (gladiators.length > 1) {
        setCurrentGladiatorIndex(1); // Move to the backup gladiator
      } else {
        setCurrentGladiatorIndex(0); // Fallback to index 0
      }

      // Reset chat
      setChatMessages([]);
    } catch (err) {
      debug_error("Recruitment failed:", err);
      setError(t.error);
      setIsTransitioning(false);
      setRecruiting(false);
    } finally {
      setRecruiting(false);
      setIsTransitioning(false);
    }
  };

  const handleRecruitCancel = () => {
    setShowRecruitConfirm(false);
  };

  if (loading && gladiators.length === 0) {
    return (
      <GameViewport>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4" />
            <p className="text-amber-400">{t.loadingGladiators}</p>
          </div>
        </div>
      </GameViewport>
    );
  }

  if (!currentGladiator) {
    return (
      <GameViewport>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-400 mb-4">{t.error}</p>
            <button
              onClick={() => router.push(`/${currentLocale}/dashboard`)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded"
            >
              {t.backToDashboard}
            </button>
          </div>
        </div>
      </GameViewport>
    );
  }

  return (
    <GameViewport>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black" />
      <div className="absolute inset-0 bg-[url('/images/arena-bg.jpg')] opacity-5 bg-cover bg-center" />

      <div className="relative z-10 h-full flex flex-col px-3 py-3">
        {/* Header */}
        <header className="flex items-center gap-3 mb-3">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push(`/${currentLocale}/dashboard`)}
            className="p-2 hover:bg-amber-900/20 rounded-lg transition-colors"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Image src="/assets/icon/tavern.png" width={32} height={32} alt="Tavern icon" />
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent"
            >
              {t.title}
            </motion.h1>
          </div>
        </header>

        {/* Gladiator Info Card */}
        <AnimatePresence mode="wait">
          {!isTransitioning && (
            <motion.div
              key={currentGladiator.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-xl p-3 mb-3"
            >
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-amber-400 font-bold">{t.name}</span>
                  <div className="text-gray-300">{currentGladiator.name} {currentGladiator.surname}</div>
                </div>
                <div>
                  <span className="text-amber-400 font-bold">{t.birthCity}</span>
                  <div className="text-gray-300">{currentGladiator.birthCity}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Section - Full Width */}
        <AnimatePresence mode="wait">
          {!isTransitioning ? (
            <motion.div
              key={`chat-${currentGladiator.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-xl overflow-hidden min-h-0"
            >
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <AnimatePresence>
                  {chatMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-lg text-sm ${
                          msg.role === 'user'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-900/30 text-amber-100 border border-amber-700/50'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-amber-900/30 text-amber-100 border border-amber-700/50 px-4 py-2 rounded-lg text-sm">
                      {t.loadingResponse}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-amber-900/30 p-4 space-y-2">
                {error && (
                  <div className="text-red-400 text-sm">{error}</div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t.messagePlaceholder}
                    disabled={loading}
                    className="flex-1 bg-black/60 border border-amber-700/50 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    data-testid="message-input"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !inputValue.trim()}
                    className="p-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white rounded transition-colors"
                    data-testid="send-button"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 10 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-xl overflow-hidden min-h-0 items-center justify-center"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400" />
                <span className="text-amber-400 text-sm font-medium">{t.loadingGladiators}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSkipClick}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white rounded font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            data-testid="skip-button"
          >
            <SkipForward className="w-4 h-4" />
            {t.skip}
          </button>
          <button
            onClick={handleRecruitClick}
            disabled={recruiting}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-bold text-sm transition-colors"
            data-testid="recruit-button"
          >
            {recruiting ? t.recruiting : t.recruitThisGladiator}
          </button>
        </div>
      </div>

      {/* Skip Confirmation Dialog */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-zinc-900 to-black border-2 border-amber-600/50 rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-amber-400 mb-3">{t.confirmSkipTitle}</h3>
            <p className="text-gray-300 mb-6">{t.confirmSkipMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={handleSkipCancel}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold text-sm transition-colors"
                data-testid="skip-cancel-button"
              >
                {t.confirmSkipNo}
              </button>
              <button
                onClick={handleSkipConfirm}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-sm transition-colors"
                data-testid="skip-confirm-button"
              >
                {t.confirmSkipYes}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Recruit Confirmation Dialog */}
      {showRecruitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-zinc-900 to-black border-2 border-green-600/50 rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-green-400 mb-3">{t.confirmRecruitTitle}</h3>
            <p className="text-gray-300 mb-6">{t.confirmRecruitMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRecruitCancel}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold text-sm transition-colors"
                data-testid="recruit-cancel-button"
              >
                {t.confirmRecruitNo}
              </button>
              <button
                onClick={handleRecruitConfirm}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-sm transition-colors"
                data-testid="recruit-confirm-button"
              >
                {t.confirmRecruitYes}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </GameViewport>
  );
}

