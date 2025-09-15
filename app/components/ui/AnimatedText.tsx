"use client";

import { useEffect, useState } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function AnimatedText({ text, className = "", delay = 0 }: AnimatedTextProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  // For gradient text, we need to apply all classes to the same element
  const isGradientText = className.includes('bg-gradient') && className.includes('text-transparent');

  if (isGradientText) {
    // For gradient text, use inline styles to ensure webkit properties are applied
    return (
      <span
        className={`${className} inline-block transform transition-all duration-1000 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
        style={{
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {text}
      </span>
    );
  }

  // For regular text, use nested structure for better animation control
  return (
    <div className={`${className} block`}>
      <div
        className={`transform transition-all duration-1000 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
