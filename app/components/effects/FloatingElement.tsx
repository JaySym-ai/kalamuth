"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FloatingElementProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  yOffset?: number;
}

export default function FloatingElement({
  children,
  duration = 3,
  delay = 0,
  yOffset = 20,
}: FloatingElementProps) {
  return (
    <motion.div
      animate={{
        y: [0, -yOffset, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
