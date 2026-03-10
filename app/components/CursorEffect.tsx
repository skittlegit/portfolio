"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const RING_SELECTOR =
  "a,button,input,select,textarea,label,[role='button'],[data-interactive]";

function shouldShowRing(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  // Walk up to find a clickable/interactive ancestor
  let el: Element | null = target;
  while (el) {
    if (el instanceof SVGElement) {
      // Only ring for SVGs inside interactive elements (icons in buttons)
      if (el.closest(RING_SELECTOR)) return true;
    }
    if (el instanceof HTMLElement && el.matches(RING_SELECTOR)) return true;
    el = el.parentElement;
  }
  return false;
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
      glow.style.setProperty("--cx", `${e.clientX}px`);
      glow.style.setProperty("--cy", `${e.clientY}px`);
      glow.style.opacity = "1";

      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      dot.style.opacity = "1";

      const ring = shouldShowRing(e.target);
      if (ring !== ringState.current) {
        ringState.current = ring;
        dot.setAttribute("data-ring", ring ? "1" : "0");
      }
    };

    const onLeave = () => {
      glow.style.opacity = "0";
      dot.style.opacity = "0";
    };

    const onEnter = () => {
      glow.style.opacity = "1";
      dot.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
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
