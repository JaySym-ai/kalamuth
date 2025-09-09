"use client";

import { useState } from "react";
import FeatureCard from "../ui/FeatureCard";
import SectionTitle from "../ui/SectionTitle";

const features = [
  {
    icon: "⚔️",
    title: "AI-Powered Combat",
    description: "Every battle is uniquely simulated with advanced AI, providing detailed combat logs and strategic insights.",
    gradient: "from-red-600 to-orange-600",
  },
  {
    icon: "🛡️",
    title: "Train Champions",
    description: "Develop your gladiators' skills, equipment, and fighting styles to create unstoppable warriors.",
    gradient: "from-amber-600 to-yellow-600",
  },
  {
    icon: "🏛️",
    title: "Manage Your Ludus",
    description: "Build and expand your training grounds, hire servants, and establish your reputation.",
    gradient: "from-purple-600 to-pink-600",
  },
  {
    icon: "💬",
    title: "Interactive Gladiators",
    description: "Talk to your warriors, learn their stories, and understand their motivations and fears.",
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    icon: "🏙️",
    title: "Explore the City",
    description: "Visit markets to buy gladiators, equipment, and resources. Discover hidden opportunities.",
    gradient: "from-green-600 to-emerald-600",
  },
  {
    icon: "⚡",
    title: "Ludus Wars",
    description: "Engage in massive battles where all gladiators fight simultaneously. Dominate rival schools.",
    gradient: "from-indigo-600 to-purple-600",
  },
];

export default function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="relative py-24 bg-gradient-to-b from-black via-red-950/10 to-black overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/hex-pattern.svg')] opacity-5" />
      
      <div className="relative z-10 container mx-auto px-6">
        <SectionTitle
          subtitle="GAME FEATURES"
          title="Forge Your Empire"
          description="Experience the ultimate gladiator management simulation with cutting-edge AI technology"
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
