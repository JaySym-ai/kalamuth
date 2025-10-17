"use client";

import { useState } from "react";
import FeatureCard from "../ui/FeatureCard";
import SectionTitle from "../ui/SectionTitle";
import { useTranslations } from "next-intl";

export default function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const t = useTranslations("Features");

  const features = [
    {
      icon: "⚔️",
      title: t("items.aiPoweredCombat.title"),
      description: t("items.aiPoweredCombat.description"),
      gradient: "from-red-600 to-orange-600"
    },
    {
      icon: "🛡️",
      title: t("items.trainChampions.title"),
      description: t("items.trainChampions.description"),
      gradient: "from-amber-600 to-yellow-600"
    },
    {
      icon: "🏛️",
      title: t("items.manageLudus.title"),
      description: t("items.manageLudus.description"),
      gradient: "from-purple-600 to-pink-600"
    },
    {
      icon: "💬",
      title: t("items.interactiveGladiators.title"),
      description: t("items.interactiveGladiators.description"),
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      icon: "🏙️",
      title: t("items.exploreCity.title"),
      description: t("items.exploreCity.description"),
      gradient: "from-green-600 to-emerald-600"
    },
    {
      icon: "⚡",
      title: t("items.ludusWars.title"),
      description: t("items.ludusWars.description"),
      gradient: "from-indigo-600 to-purple-600"
    }
  ];

  return (
    <section className="relative py-24 bg-gradient-to-b from-black via-red-950/10 to-black overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/hex-pattern.svg')] opacity-5" />

      <div className="relative z-10 container mx-auto px-6">
        <SectionTitle
          subtitle={t("subtitle")}
          title={t("title")}
          description={t("description")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              {...feature}
              index={index}
              isHovered={hoveredIndex === index}
              onHover={() => setHoveredIndex(index)}
              onLeave={() => setHoveredIndex(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
