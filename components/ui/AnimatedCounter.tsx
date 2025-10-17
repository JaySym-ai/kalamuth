"use client";

import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface AnimatedCounterProps {
  value: string;
  label: string;
  delay?: number;
}

export default function AnimatedCounter({ value, label, delay = 0 }: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState("0");
  
  useEffect(() => {
    if (!isInView) return;
    
    // Extract number from value (e.g., "10K+" -> 10)
    const numericPart = parseInt(value.replace(/[^0-9]/g, ""));
    const suffix = value.replace(/[0-9]/g, "");
    
    if (isNaN(numericPart)) {
      setDisplayValue(value);
      return;
    }
    
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = numericPart / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericPart) {
        setDisplayValue(numericPart + suffix);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current) + suffix);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [isInView, value]);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="text-center group hover:scale-110 transition-transform duration-300"
    >
      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
        {displayValue}
      </div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </motion.div>
  );
}
