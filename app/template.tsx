"use client";

import { motion, useReducedMotion } from "framer-motion";

// Page-enter transition — every route arrives the same way: a quiet rise +
// fade on the expo-out curve. While the transform animates, this wrapper is
// the containing block for the fixed Nav, so the nav rides up with the page
// (reads as one coherent entrance); framer drops the transform at identity,
// after which position:fixed behaves normally again.
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
