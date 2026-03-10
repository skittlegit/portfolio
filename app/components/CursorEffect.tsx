"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const RING_SELECTOR =
  "a,button,input,select,textarea,label,[role='button'],[data-interactive]," +
  "h1,h2,h3,h4,h5,h6,p,li,td,th,blockquote,code,pre,kbd," +
  "img,video,canvas";

function shouldShowRing(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  if (target instanceof SVGElement) return true;
  return !!target.closest(RING_SELECTOR);
}

export default function CursorEffect() {
  const { isDark, fg } = useTheme();
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringState = useRef(false);

  useEffect(() => {
    const glow = glowRef.current;
    const dot = dotRef.current;
    if (!glow || !dot) return;

    const onMove = (e: MouseEvent) => {
      // Update glow position via CSS custom props — no React re-render
      glow.style.setProperty("--cx", `${e.clientX}px`);
      glow.style.setProperty("--cy", `${e.clientY}px`);

      // Update dot position directly
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;

      // Ring detection
      const ring = shouldShowRing(e.target);
      if (ring !== ringState.current) {
        ringState.current = ring;
        dot.setAttribute("data-ring", ring ? "1" : "0");
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Update colors when theme changes — direct DOM, no re-render loop
  useEffect(() => {
    const glow = glowRef.current;
    const dot = dotRef.current;
    if (!glow || !dot) return;

    glow.style.setProperty(
      "--glow",
      isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"
    );
    dot.style.setProperty("--fg", fg);
  }, [isDark, fg]);

  return (
    <>
      {/* Background glow — single div, position via CSS custom props */}
      <div
        ref={glowRef}
        className="custom-cursor cursor-glow"
      />

      {/* Cursor dot / ring */}
      <div
        ref={dotRef}
        className="custom-cursor cursor-dot"
        data-ring="0"
      />
    </>
  );
}
