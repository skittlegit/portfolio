"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

// Line-mask reveal — the signature entrance. Children rise out of an
// overflow crop on an expo-out curve. `mount` plays immediately (hero);
// otherwise it plays when scrolled into view. Reduced-motion renders static.
//
// The viewport observer lives on the OUTER crop div: the inner element starts
// translated below the crop, so observing it directly would always read as
// fully clipped / never visible.
export default function MaskReveal({
  children,
  className,
  style,
  delay = 0,
  duration = 1,
  mount = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  duration?: number;
  mount?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const variants: Variants = {
    hidden: { y: "115%" },
    show: {
      y: "0%",
      transition: { duration, ease: [0.16, 1, 0.3, 1], delay },
    },
  };
  // pad the crop so descenders / tight line-heights don't clip at rest
  const crop: React.CSSProperties = {
    ...style,
    overflow: "hidden",
    paddingBottom: "0.08em",
    marginBottom: "-0.08em",
  };

  return (
    <motion.div
      className={className}
      style={crop}
      initial="hidden"
      {...(mount
        ? { animate: "show" }
        : {
            whileInView: "show",
            viewport: { once: true, margin: "0px 0px -8% 0px" },
          })}
    >
      <motion.div variants={variants}>{children}</motion.div>
    </motion.div>
  );
}
