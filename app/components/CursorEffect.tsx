"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const RING_SELECTOR =
  "a,button,input,select,textarea,label,[role='button'],[data-interactive]," +
  "h1,h2,h3,h4,h5,h6,p,span,li,td,th,blockquote,code,pre,kbd," +
  "img,video,canvas";

function shouldShowRing(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  if (target instanceof SVGElement) return true;
  return !!target.closest(RING_SELECTOR);
}

export default function CursorEffect() {
  const { fg, isDark } = useTheme();
  const dotRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ringState = useRef(false);

  useEffect(() => {
    const dot = dotRef.current;
    const glow = glowRef.current;
    if (!dot || !glow) return;

    const onMove = (e: MouseEvent) => {
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      dot.style.opacity = "1";

      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
      glow.style.opacity = "1";

      const ring = shouldShowRing(e.target);
      if (ring !== ringState.current) {
        ringState.current = ring;
        dot.setAttribute("data-ring", ring ? "1" : "0");
      }
    };

    const onLeave = () => {
      dot.style.opacity = "0";
      glow.style.opacity = "0";
    };

    const onEnter = () => {
      dot.style.opacity = "1";
      glow.style.opacity = "1";
    };

    const root = document.documentElement;
    window.addEventListener("mousemove", onMove, { passive: true });
    root.addEventListener("mouseleave", onLeave);
    root.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseleave", onLeave);
      root.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;
    dot.style.setProperty("--fg", fg);
  }, [fg]);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    glow.style.background = isDark
      ? "radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)"
      : "radial-gradient(circle, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.015) 40%, transparent 70%)";
  }, [isDark]);

  return (
    <>
      <div
        ref={glowRef}
        className="custom-cursor cursor-glow"
      />
      <div
        ref={dotRef}
        className="custom-cursor cursor-dot"
        data-ring="0"
      />
    </>
  );
}
