"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
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
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Realtime subscription to tavern gladiators
  const { data: realtimeTavernGladiators } = useRealtimeCollection<NormalizedGladiator>({
    table: "tavern_gladiators",
    select: "id, ludusId, serverId, name, surname, avatarUrl, birthCity, health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive",
    match: { ludusId: ludus.id },
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

  // Auto-generate tavern gladiators if none exist
  useEffect(() => {
    if (gladiators.length > 0) return;

    setLoading(true);
    fetch("/api/tavern/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ludusId: ludus.id }),
    })
      .catch((err) => {
        console.error("Tavern gladiator generation failed:", err);
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
      console.error("Chat failed:", err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!currentGladiator) return;

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
        const data = await response.json();
        setError(data.error || t.error);
        return;
      }

      // Move to next gladiator
      if (currentGladiatorIndex < gladiators.length - 1) {
        setCurrentGladiatorIndex(prev => prev + 1);
      } else {
        setCurrentGladiatorIndex(0);
      }

      // Reset chat
      setChatMessages([]);
      setError(null);
    } catch (err) {
      console.error("Skip failed:", err);
      setError(t.error);
    }
  };

  const handleRecruit = async () => {
    if (!currentGladiator || recruiting) return;

    setRecruiting(true);
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
        return;
      }

      // Move to next gladiator
      if (currentGladiatorIndex < gladiators.length - 1) {
        setCurrentGladiatorIndex(prev => prev + 1);
      } else {
        setCurrentGladiatorIndex(0);
      }

      // Reset chat
      setChatMessages([]);
    } catch (err) {
      console.error("Recruitment failed:", err);
      setError(t.error);
    } finally {
      setRecruiting(false);
    }
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
        <header className="flex items-center justify-between mb-3">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent"
            >
              {t.title}
            </motion.h1>
          </div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push(`/${currentLocale}/dashboard`)}
            className="p-2 hover:bg-amber-900/20 rounded-lg transition-colors"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </motion.button>
        </header>

        {/* Gladiator Info Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
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

        {/* Chat Section - Full Width */}
        <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-xl overflow-hidden min-h-0">
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
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleRecruit}
            disabled={recruiting}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-bold text-sm transition-colors"
            data-testid="recruit-button"
          >
            {recruiting ? t.recruiting : t.recruitThisGladiator}
          </button>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white rounded font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            data-testid="skip-button"
          >
            <SkipForward className="w-4 h-4" />
            {t.skip}
          </button>
        </div>
      </div>
    </GameViewport>
  );
}

