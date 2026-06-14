"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Boot sequence — a count from 000→100 beside the giant condensed name, then
// the whole field wipes upward. Runs once per session (sessionStorage),
// ~1.05s total. Skipped entirely under reduced-motion.
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
          className="px-5 sm:px-8 md:px-12 lg:px-16"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "var(--bg)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingTop: "clamp(20px, 4vw, 44px)",
            paddingBottom: "clamp(20px, 4vw, 44px)",
          }}
        >
          {/* top readout */}
          <div
            className="mono"
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--fg-muted)",
            }}
          >
            <span>bydeepak.com</span>
            <span>loading</span>
          </div>

          {/* bottom: giant name vs counter */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
            <div style={{ overflow: "hidden" }}>
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="giant"
                style={{ fontSize: "clamp(2.6rem,9vw,8rem)", color: "var(--fg)" }}
              >
                Deepak Aeleni<span style={{ color: "var(--accent)" }}>.</span>
              </motion.div>
            </div>
            <div
              className="giant"
              style={{ fontSize: "clamp(2.6rem,9vw,8rem)", color: "var(--fg-faint)", minWidth: "2.4ch", textAlign: "right" }}
            >
              {String(count).padStart(3, "0")}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
