"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// TELEMETRY decode — text resolves character-by-character out of random glyphs,
// like a readout locking onto a signal. Plays on mount; replays on hover.
// SSR renders the final text (no SEO/shift cost); reduced-motion shows it static.
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>*+#·".split("");

export default function Scramble({
  text,
  className,
  style,
  hover = true,
  speed = 1.6,
  delay = 0,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  speed?: number; // chars revealed per frame
  delay?: number; // ms before first play
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(text);
  const rafRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const run = () => {
    cancelAnimationFrame(rafRef.current);
    let progress = 0;
    const chars = text.split("");
    const tick = () => {
      progress += speed;
      const out = chars
        .map((c, i) => {
          if (c === " ") return " ";
          if (i < progress) return c;
          return GLYPHS[(Math.random() * GLYPHS.length) | 0];
        })
        .join("");
      setDisplay(out);
      if (progress < chars.length) rafRef.current = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (reduce) return;
    timeoutRef.current = setTimeout(run, delay);
    return () => {
      clearTimeout(timeoutRef.current);
      cancelAnimationFrame(rafRef.current);
    };
    // run/text are stable for the lifetime of a given label
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <span
      className={className}
      style={style}
      onMouseEnter={hover && !reduce ? run : undefined}
    >
      {display}
    </span>
  );
}
