"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// TELEMETRY boot sequence: a count from 000→100 with the channel grid drawing
// in and the name stacking. Runs once per session (sessionStorage), ~1.05s total,
// then wipes away with a clip reveal. Skipped entirely under reduced-motion.
export default function Preloader() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduce) return;
    if (sessionStorage.getItem("booted") === "1") return;

    const DURATION = 950;
    let raf = 0;

    // Defer the boot sequence to the next frame so state updates run from a
    // rAF callback rather than synchronously in the effect body.
    raf = requestAnimationFrame(() => {
      setShow(true);
      document.body.style.overflow = "hidden";
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / DURATION);
        const eased = 1 - Math.pow(1 - p, 3); // decelerate into 100
        setCount(Math.round(eased * 100));
        if (p < 1) raf = requestAnimationFrame(tick);
        else {
          sessionStorage.setItem("booted", "1");
          setTimeout(() => {
            setShow(false);
            document.body.style.overflow = "";
          }, 260);
        }
      };
      raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, [reduce]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="preloader"
          initial={{ clipPath: "inset(0 0 0 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "var(--bg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "clamp(20px, 5vw, 48px)",
          }}
        >
          {/* top channel readout */}
          <div
            className="mono"
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--fg-muted)",
            }}
          >
            <span>bydeepak.com</span>
            <span>loading</span>
          </div>

          {/* center: stacked name + counter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="display display-md"
              style={{ color: "var(--fg)" }}
            >
              DEEPAK
            </motion.div>
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="display display-md"
              style={{ color: "var(--accent)" }}
            >
              AELENI.
            </motion.div>
          </div>

          {/* bottom: progress bar + count */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "var(--line)",
                position: "relative",
                overflow: "hidden",
                maxWidth: 520,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${count}%`,
                  background: "var(--accent)",
                  transition: "width 0.05s linear",
                }}
              />
            </div>
            <div
              className="mono"
              style={{ fontSize: 13, letterSpacing: "0.1em", color: "var(--fg)", minWidth: 56, textAlign: "right" }}
            >
              {String(count).padStart(3, "0")}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
