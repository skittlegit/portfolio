"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const HOVER_SELECTOR =
  "a,button,[role='button'],[data-interactive],[data-cursor-hover],input,select,textarea";

export default function CursorEffect() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const isHovering = useRef(false);
  const initialized = useRef(false);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Center the elements on their own midpoint via GSAP
    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    gsap.set(ring, { xPercent: -50, yPercent: -50 });

    // GSAP quickSetter for smooth positioning
    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    const setRingX = gsap.quickSetter(ring, "x", "px");
    const setRingY = gsap.quickSetter(ring, "y", "px");

    let ringX = 0,
      ringY = 0;

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      // Dot follows mouse instantly
      setDotX(e.clientX);
      setDotY(e.clientY);

      // Snap ring to first mouse position to avoid fly-in from corner
      if (!initialized.current) {
        ringX = e.clientX;
        ringY = e.clientY;
        setRingX(ringX);
        setRingY(ringY);
        initialized.current = true;
      }

      dot.style.opacity = "1";
      ring.style.opacity = "0.5";

      // Check hover state
      const target = e.target as Element | null;
      const hovering = !!target?.closest(HOVER_SELECTOR);
      if (hovering !== isHovering.current) {
        isHovering.current = hovering;
        dot.setAttribute("data-hover", hovering ? "1" : "0");
      }
    };

    // Ring follows with lerp
    const ticker = gsap.ticker.add(() => {
      const speed = 0.15;
      ringX += (pos.current.x - ringX) * speed;
      ringY += (pos.current.y - ringY) * speed;
      setRingX(ringX);
      setRingY(ringY);
    });

    const onLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };
    const onEnter = () => {
      dot.style.opacity = "1";
      ring.style.opacity = "0.5";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      gsap.ticker.remove(ticker);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="custom-cursor cursor-dot" data-hover="0" />
      <div ref={ringRef} className="custom-cursor cursor-ring" />
    </>
  );
}
