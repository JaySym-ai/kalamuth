"use client";

import { useTranslations } from "next-intl";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradient: string;
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

export default function FeatureCard({
  icon,
  title,
  description,
  gradient,
  index,
  isHovered,
  onHover,
  onLeave,
}: FeatureCardProps) {
  const t = useTranslations("common");

  return (
    <div
      className={`relative group transform transition-all duration-500 hover:scale-105 ${
        isHovered ? "z-10" : "z-0"
      }`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Glow Effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
      />

      {/* Card */}
      <div className="relative bg-black/50 backdrop-blur-sm border border-amber-900/20 rounded-2xl p-8 hover:border-amber-700/50 transition-all duration-300">
        {/* Icon */}
        <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>

        {/* Title */}
        <h3 className={`text-2xl font-bold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 leading-relaxed">
          {description}
        </p>

        {/* Hover Indicator */}
        <div className="mt-6 flex items-center text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-sm font-medium">{t("learnMore")}</span>
          <svg
            className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
