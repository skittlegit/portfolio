"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const INTERACTIVE =
  "a, button, input, select, textarea, label, [role='button'], [data-interactive]";

function shouldShowRing(target: EventTarget | null): boolean {
  if (!target) return false;

  // Handle SVG elements — they are not HTMLElement but do have closest()
  let el: Element | null = null;
  if (target instanceof Element) {
    el = target;
  } else {
    return false;
  }

  // Walk up from the target element
  while (el && el !== document.documentElement) {
    // Interactive elements
    if (el.matches(INTERACTIVE)) return true;

    // SVG / media elements
    const tag = el.tagName;
    if (
      tag === "svg" ||
      tag === "IMG" ||
      tag === "VIDEO" ||
      tag === "CANVAS" ||
      el instanceof SVGElement
    )
      return true;

    // Elements with direct text content
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      if (
        child.nodeType === 3 &&
        child.textContent &&
        child.textContent.trim().length > 0
      )
        return true;
    }

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
