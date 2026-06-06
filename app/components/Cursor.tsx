"use client";

import { useEffect, useRef } from "react";

// Custom cursor — a precise dot that tracks instantly + a ring that lags. On an
// interactive target the dot hides and the ring grows, fills with the accent,
// and shows a short label (from [data-cursor]). Tighter lerp while hovering so
// the filled ring stays locked to small targets. No blend mode, no crosshair,
// no coordinate HUD. Renders nothing on touch / reduced-motion.
const HOVER_SEL =
  "a,button,[role='button'],[data-cursor],label,summary,input,select,textarea";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const label = labelRef.current!;

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { x: target.x, y: target.y };
    let visible = false;
    let hovering = false;
    let down = false;
    let raf = 0;

    const setState = () => {
      const s = hovering ? "hover" : down ? "down" : "";
      ring.dataset.state = s;
      dot.dataset.state = hovering ? "hover" : "";
    };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      if (!visible) {
        visible = true;
        ringPos.x = e.clientX;
        ringPos.y = e.clientY;
        dot.style.opacity = ring.style.opacity = "1";
      }
      const el = (e.target as Element | null)?.closest(HOVER_SEL);
      const nextHover = !!el;
      if (nextHover !== hovering) {
        hovering = nextHover;
        setState();
      }
      label.textContent = el ? ((el as HTMLElement).dataset.cursor ?? "") : "";
    };

    const onDown = () => { down = true; setState(); };
    const onUp = () => { down = false; setState(); };
    const onLeave = () => { visible = false; dot.style.opacity = ring.style.opacity = "0"; };

    const loop = () => {
      // tighter follow while hovering so the filled ring locks onto targets
      const k = hovering ? 0.32 : 0.18;
      ringPos.x += (target.x - ringPos.x) * k;
      ringPos.y += (target.y - ringPos.y) * k;
      ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cur-dot" style={{ opacity: 0 }} />
      <div ref={ringRef} className="cur-ring" style={{ opacity: 0 }}>
        <span ref={labelRef} className="cur-label" />
      </div>
    </>
  );
}
