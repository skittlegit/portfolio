"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

// Scroll-triggered reveal — content "plots in" (mask wipe or fade-up, staggered).
// Honors reduced-motion by rendering children statically.
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  clip = false,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  clip?: boolean;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const variants: Variants = clip
    ? {
        hidden: { clipPath: "inset(0 0 100% 0)", opacity: 0 },
        show: {
          clipPath: "inset(0 0 0% 0)",
          opacity: 1,
          transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay },
        },
      }
    : {
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
        },
      };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "0px 0px -12% 0px" }}
    >
      {children}
    </motion.div>
  );
}
