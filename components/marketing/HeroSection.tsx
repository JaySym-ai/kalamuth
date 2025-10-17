"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnimatedText from "../ui/AnimatedText";
import GlowButton from "../ui/GlowButton";
import ParticleEffect from "../effects/ParticleEffect";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("Hero");
  const locale = useLocale();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <ParticleEffect />

      {/* Top Language Selector */}
      <div className="fixed top-0 right-0 z-50 p-6">
        <LanguageSwitcher />
      </div>

      {/* Animated Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[clamp(200px,50vw,800px)] h-[clamp(200px,50vw,800px)]">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-red-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-responsive-4 text-center flex-1 flex items-center justify-center">
        <div
          className={`transform transition-all duration-1000 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Epic Badge */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center gap-responsive-sm px-responsive-4 py-responsive-3 bg-amber-900/30 border border-amber-700/50 rounded-responsive-lg mb-responsive-6 backdrop-blur-sm"
          >
            <span className="relative flex h-[clamp(0.375rem,1vw,0.5rem)] w-[clamp(0.375rem,1vw,0.5rem)]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-amber-500"></span>
            </span>
            <span className="text-amber-400 text-responsive-sm font-medium">
              {t("badge")}
            </span>
          </motion.div>

          {/* Main Title */}
          <h1 className="mb-responsive-4">
            <AnimatedText
              text={t("title1")}
              className="text-responsive-5xl font-black text-white tracking-tight"
              delay={0.2}
            />
            <AnimatedText
              text={t("title2")}
              className="text-responsive-6xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent"
              delay={0.4}
            />
          </h1>

          {/* Subtitle */}
          <p
            className={`text-responsive-lg text-gray-300 max-w-3xl mx-auto mb-responsive-8 leading-responsive-relaxed transform transition-all duration-1000 delay-500 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            {t("subtitle1")}
            <br />
            <span className="text-amber-400 font-semibold">
              {t("subtitle2")}
            </span>
          </p>

          {/* CTA Button */}
          <div
            className={`flex justify-center transform transition-all duration-1000 delay-700 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <Link href={`/${locale}/intro`}>
              <GlowButton primary size="large">
                {t("primaryCta")}
              </GlowButton>
            </Link>
          </div>


        </div>
      </div>


    </section>
  );
}
