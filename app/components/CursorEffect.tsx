"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

const INTERACTIVE_SELECTORS =
  "a, button, input, select, textarea, label, [role='button'], [data-interactive]";

function isInteractiveElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.closest(INTERACTIVE_SELECTORS) !== null;
}

export default function CursorEffect() {
  const { isDark, fg } = useTheme();
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const [showRing, setShowRing] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCursor({ x: e.clientX, y: e.clientY });
    setShowRing(isInteractiveElement(e.target));
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
      {/* Custom cursor — solid dot normally, ring on interactive */}
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

      {/* Background glow following cursor */}
      <div
        className="custom-cursor"
        style={{
          position: "fixed",
          inset: 0,
          background: glowColor,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </>
  );
}
