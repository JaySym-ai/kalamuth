"use client";

import { useState } from "react";
import GlowButton from "../ui/GlowButton";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

type Props = { authed?: boolean; onboardingDone?: boolean };
export default function CTASection({ authed = false, onboardingDone = false }: Props) {
  const [email, setEmail] = useState("");
  const t = useTranslations("CTA");
  const locale = useLocale();

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Epic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-amber-950/20 to-black" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Epic Title */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
              {t("title")}
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
            {t("subtitleLine1")}
            <br />
            <span className="text-amber-400 font-semibold">
              {t("subtitleLine2")}
            </span>
          </p>

          {/* Email Signup */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-red-600 rounded-lg blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="flex-1 px-6 py-4 bg-black/50 backdrop-blur-sm border border-amber-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <Link href={`/${locale}${authed ? (onboardingDone ? "" : "/initial-gladiators") : "/auth"}`}>
                  <GlowButton primary size="large">
                    {authed ? (onboardingDone ? t("openApp") : t("continueOnboarding")) : t("claimButton")}
                  </GlowButton>
                </Link>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {[
              { icon: "🎁", title: t("benefits.exclusiveRewards.title"), description: t("benefits.exclusiveRewards.description") },
              { icon: "⚡", title: t("benefits.priorityAccess.title"), description: t("benefits.priorityAccess.description") },
              { icon: "👑", title: t("benefits.founderStatus.title"), description: t("benefits.founderStatus.description") },
            ].map((benefit, index) => (
              <div
                key={index}
                className="bg-black/30 backdrop-blur-sm border border-amber-900/30 rounded-xl p-6 hover:border-amber-700/50 transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-3">{benefit.icon}</div>
                <h3 className="text-lg font-bold text-amber-400 mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{t("trust.noCardRequired")}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{t("trust.securePrivate")}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span>{t("trust.joinPlayers")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
