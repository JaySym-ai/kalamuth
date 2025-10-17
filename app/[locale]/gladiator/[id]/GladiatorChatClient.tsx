"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Info, Send, MapPin, Heart } from "lucide-react";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";
import { useRealtimeRow } from "@/lib/supabase/realtime";
import GladiatorDetailStats from "./GladiatorDetailStats";

// Helper function to safely extract localized string from bilingual data
function getLocalizedString(value: unknown, locale: string): string {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    // Try to get the localized version first
    if (typeof obj[locale] === "string") {
      return obj[locale] as string;
    }
    // Fallback to English
    if (typeof obj.en === "string") {
      return obj.en as string;
    }
    // Fallback to any available string
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        return obj[key] as string;
      }
    }
  }
  return "—"; // Default fallback
}

interface ChatMessage {
  id: string;
  role: "user" | "gladiator";
  content: string;
  timestamp: number;
}

interface Props {
  gladiator: NormalizedGladiator;
  locale: string;
  translations: {
    backToDashboard: string;
    from: string;
    typeMessage: string;
    gladiatorInfo: string;
    chat: string;
    sendMessage: string;
    // Stats translations will be passed to GladiatorDetailStats
    [key: string]: string;
  };
}

export default function GladiatorChatClient({ gladiator, locale, translations: t }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "gladiator",
      content: locale === "fr" 
        ? `${gladiator.name} ${gladiator.surname} à votre service, maître. Que souhaitez-vous discuter ?`
        : `${gladiator.name} ${gladiator.surname} at your service, master. What would you like to discuss?`,
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time gladiator data updates
  const { data: realtimeGladiator } = useRealtimeRow<NormalizedGladiator>({
    table: "gladiators",
    select: "id, ludusId, serverId, name, surname, avatarUrl, birthCity, health, current_health, stats, personality, backstory, lifeGoal, likes, dislikes, createdAt, updatedAt, injury, injuryTimeLeftHours, sickness, handicap, uniquePower, weakness, fear, physicalCondition, notableHistory, alive",
    match: { id: gladiator.id },
    initialData: gladiator,
    primaryKey: "id",
  });

  const currentGladiator = realtimeGladiator ?? gladiator;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/gladiator/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          gladiatorId: currentGladiator.id,
          conversationHistory: messages,
          locale: locale,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      const gladiatorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "gladiator",
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, gladiatorMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "gladiator",
        content: "Apologies, master. I'm unable to respond at the moment.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (showStats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
        <div className="pb-[max(env(safe-area-inset-bottom),24px)] pt-8 px-4 max-w-6xl mx-auto">
          {/* Back to Chat Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowStats(false)}
            className="mb-6 flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.chat}
          </motion.button>

          {/* Stats Component */}
          <GladiatorDetailStats
            gladiator={currentGladiator}
            locale={locale}
            translations={{
              backToDashboard: t.backToDashboard,
              from: t.from,
              combatStats: t.combatStats,
              strength: t.strength,
              agility: t.agility,
              dexterity: t.dexterity,
              speed: t.speed,
              chance: t.chance,
              intelligence: t.intelligence,
              charisma: t.charisma,
              loyalty: t.loyalty,
              personality: t.personality,
              lifeGoal: t.lifeGoal,
              personalityTrait: t.personalityTrait,
              likes: t.likes,
              dislikes: t.dislikes,
              background: t.background,
              backstory: t.backstory,
              notableHistory: t.notableHistory,
              physicalCondition: t.physicalCondition,
              specialTraits: t.specialTraits,
              weakness: t.weakness,
              fear: t.fear,
              handicap: t.handicap,
              uniquePower: t.uniquePower,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <div className="flex flex-col h-[100vh] pb-[max(env(safe-area-inset-bottom),24px)]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-sm border-b border-amber-900/30 p-4"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <button
                onClick={() => window.history.back()}
                className="text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              {/* Gladiator Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center text-xl font-bold text-white">
                  {getLocalizedString(currentGladiator.name, locale).charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-amber-400">
                    {getLocalizedString(currentGladiator.name, locale)} {getLocalizedString(currentGladiator.surname, locale)}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{t.from} {getLocalizedString(currentGladiator.birthCity, locale)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{currentGladiator.health} HP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Button */}
            <button
              onClick={() => setShowStats(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              <Info className="w-4 h-4" />
              {t.gladiatorInfo}
            </button>
          </div>
        </motion.div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg text-sm ${
                      message.role === "user"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-900/30 text-amber-100 border border-amber-700/50"
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-amber-900/30 text-amber-100 border border-amber-700/50 px-4 py-2 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-sm border-t border-amber-900/30 p-4"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.typeMessage}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-black/40 border border-amber-900/30 rounded-lg text-amber-100 placeholder-amber-700/50 focus:outline-none focus:border-amber-600 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {t.sendMessage}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}