"use client";

import { motion } from "framer-motion";

// Route transition. Opacity-only crossfade on purpose — a transform/clip/filter
// on this wrapper would turn it into the containing block for any position:fixed
// descendant (nav, cursor), so we keep it to opacity.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
