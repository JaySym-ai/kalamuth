"use client";

import { useState, useEffect } from "react";
import SectionTitle from "../ui/SectionTitle";
import BattleLog from "../ui/BattleLog";
import GlowButton from "../ui/GlowButton";
import { useTranslations } from "next-intl";

const sampleBattleLogs = [
  { time: "0:00", attacker: "Marcus", action: "charges forward with shield raised", damage: 0, type: "movement" },
  { time: "0:02", attacker: "Lucia", action: "throws net, attempting to entangle", damage: 0, type: "special" },
  { time: "0:03", attacker: "Marcus", action: "deflects net with shield bash", damage: 0, type: "defense" },
  { time: "0:05", attacker: "Marcus", action: "delivers crushing blow to shoulder", damage: 28, type: "attack" },
  { time: "0:07", attacker: "Lucia", action: "rolls away, quick strike to leg", damage: 15, type: "counter" },
  { time: "0:09", attacker: "Marcus", action: "activates Iron Will, damage reduced", damage: 0, type: "buff" },
  { time: "0:12", attacker: "Lucia", action: "performs Shadow Dance evasion", damage: 0, type: "special" },
  { time: "0:14", attacker: "Marcus", action: "misses heavy swing", damage: 0, type: "miss" },
  { time: "0:16", attacker: "Lucia", action: "critical strike to exposed flank", damage: 45, type: "critical" }
];

export default function BattlePreview() {
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const t = useTranslations("Battle");

  useEffect(() => {
    if (isPlaying && currentLogIndex < sampleBattleLogs.length - 1) {
      const timer = setTimeout(() => {
        setCurrentLogIndex(currentLogIndex + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (currentLogIndex >= sampleBattleLogs.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentLogIndex]);

  const handlePlayPause = () => {
    if (currentLogIndex >= sampleBattleLogs.length - 1) {
      setCurrentLogIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-black via-red-950/10 to-black overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/arena-bg.svg')] opacity-5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-amber-600/20 rounded-full blur-3xl animate-pulse" />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <SectionTitle
          subtitle={t("subtitle")}
          title={t("title")}
          description={t("description")}
        />

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Battle Arena Preview */}
          <div className="relative">
            <div className="aspect-video bg-black/50 backdrop-blur-sm border-2 border-amber-900/30 rounded-2xl overflow-hidden">
              {/* Arena Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-red-900/20" />

              {/* Gladiators */}
              <div className="absolute inset-0 flex items-center justify-between px-12">
                <div className="text-center transform hover:scale-110 transition-transform">
                  <div className="text-8xl mb-2 animate-pulse">⚔️</div>
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-amber-400 font-bold">Marcus</div>
                    <div className="text-xs text-gray-400">{t("hpLabel")}: 85/100</div>
                    <div className="h-2 bg-gray-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>
                </div>

                <div className="text-4xl animate-bounce">⚡</div>

                <div className="text-center transform hover:scale-110 transition-transform">
                  <div className="text-8xl mb-2 animate-pulse">🏹</div>
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="text-amber-400 font-bold">Lucia</div>
                    <div className="text-xs text-gray-400">{t("hpLabel")}: 72/100</div>
                    <div className="h-2 bg-gray-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full" style={{ width: "72%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Battle Status */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <div className="bg-black/80 backdrop-blur-sm rounded-full px-6 py-2 border border-amber-700/50">
                  <span className="text-amber-400 font-bold">{t("roundLabel")} 3</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 flex justify-center gap-4">
              <GlowButton onClick={handlePlayPause}>
                {isPlaying ? t("controls.pause") : t("controls.play")}
              </GlowButton>
              <GlowButton onClick={() => setCurrentLogIndex(0)}>
                {t("controls.reset")}
              </GlowButton>
            </div>
          </div>

          {/* Battle Log */}
          <div>
            <div className="bg-black/50 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6 h-[400px] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-amber-400">{t("logTitle")}</h3>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-sm text-gray-400">{t("live")}</span>
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto h-[320px] custom-scrollbar">
                {sampleBattleLogs.slice(0, currentLogIndex + 1).map((log, index) => (
                  <BattleLog
                    key={index}
                    log={log}
                    isNew={index === currentLogIndex}
                  />
                ))}
              </div>
            </div>

            {/* Battle Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-black/50 backdrop-blur-sm border border-amber-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">156</div>
                <div className="text-xs text-gray-400">{t("stats.totalDamage")}</div>
              </div>
              <div className="bg-black/50 backdrop-blur-sm border border-amber-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">3</div>
                <div className="text-xs text-gray-400">{t("stats.criticalHits")}</div>
              </div>
              <div className="bg-black/50 backdrop-blur-sm border border-amber-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">0:16</div>
                <div className="text-xs text-gray-400">{t("stats.duration")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
