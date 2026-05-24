"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

interface AnimatedCountProps {
  to: number;
  className?: string;
}

export function AnimatedCount({ to, className }: AnimatedCountProps) {
  const raw = useMotionValue(0);
  const display = useTransform(raw, Math.round);

  useEffect(() => {
    // Don't animate if value is zero — avoids counting up to 0 on empty states
    if (to === 0) return;
    const controls = animate(raw, to, { duration: 0.8, ease: "easeOut" });
    return controls.stop;
  }, [to, raw]);

  return <motion.span className={className}>{display}</motion.span>;
}
