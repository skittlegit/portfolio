"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

/** Elements that should never trigger the ring cursor */
const IGNORE_TAGS = new Set(["HTML", "BODY"]);

function shouldShowRing(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  // Walk up and skip pure layout wrappers
  let node: HTMLElement | null = el;
  while (node && !IGNORE_TAGS.has(node.tagName)) {
    // Interactive elements always trigger ring
    if (
      node.matches(
        "a, button, input, select, textarea, label, [role='button'], [data-interactive]"
      )
    )
      return true;
    // SVG / img / video / canvas
    if (node instanceof SVGElement || node.matches("img, video, canvas, svg"))
      return true;
    // Text content — any element with direct text children
    if (node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === 3 && child.textContent && child.textContent.trim().length > 0)
          return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

export default function CursorEffect() {
  const { isDark, fg } = useTheme();
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const [showRing, setShowRing] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCursor({ x: e.clientX, y: e.clientY });
    setShowRing(shouldShowRing(e.target));
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const glowColor = isDark
    ? `radial-gradient(500px circle at ${cursor.x}px ${cursor.y}px, rgba(255,255,255,0.06), transparent 70%)`
    : `radial-gradient(500px circle at ${cursor.x}px ${cursor.y}px, rgba(0,0,0,0.05), transparent 70%)`;

  return (
    <>
      {/* Background glow — sits behind all page content */}
      <div
        className="custom-cursor"
        style={{
          position: "fixed",
          inset: 0,
          background: glowColor,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Custom cursor dot / ring */}
      <div
        className="custom-cursor"
        style={{
          position: "fixed",
          left: cursor.x,
          top: cursor.y,
          width: 28,
          height: 28,
          backgroundColor: showRing ? "transparent" : fg,
          border: showRing ? `1.5px solid ${fg}` : "none",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 9999,
          transition: "background-color 0.15s ease, border 0.15s ease",
        }}
      />
    </>
  );
}
