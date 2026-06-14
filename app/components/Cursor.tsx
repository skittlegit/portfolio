"use client";

import { useEffect, useRef } from "react";

// Magnetic-ring cursor — a precise dot tracks the pointer instantly while a
// thin ring trails it with an elastic lag. Over an interactive target the
// lerp tightens and the ring snaps in around the pointer, filling violet;
// the dot disappears inside it. No labels, no words.
// Renders nothing on touch / reduced-motion.
const HOVER_SEL =
  "a,button,[role='button'],[data-cursor],label,summary,input,select,textarea";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { x: target.x, y: target.y };
    let visible = false;
    let hovering = false;
    let down = false;
    let raf = 0;

    const setState = () => {
      dot.dataset.state = hovering ? "hover" : "";
      ring.dataset.state = hovering ? "hover" : "";
      ring.dataset.down = down ? "1" : "0";
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
      const nextHover = !!(e.target as Element | null)?.closest(HOVER_SEL);
      if (nextHover !== hovering) {
        hovering = nextHover;
        setState();
      }
    };

    const onDown = () => { down = true; setState(); };
    const onUp = () => { down = false; setState(); };
    // Fully hide + reset on any exit so the ring never re-appears stale — old
    // position or leftover filled state — when the pointer returns or the
    // tab/window regains focus. The next mousemove snaps it back.
    const hide = () => {
      visible = false;
      hovering = false;
      down = false;
      setState();
      dot.style.opacity = ring.style.opacity = "0";
    };
    const onVisibility = () => { if (document.hidden) hide(); };

    const loop = () => {
      // elastic at rest; locks onto the pointer while over a target
      const k = hovering ? 0.45 : 0.16;
      ringPos.x += (target.x - ringPos.x) * k;
      ringPos.y += (target.y - ringPos.y) * k;
      ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", onVisibility);
    document.documentElement.addEventListener("mouseleave", hide);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", onVisibility);
      document.documentElement.removeEventListener("mouseleave", hide);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cur-dot" style={{ opacity: 0 }}>
        <span className="cur-dot-in" />
      </div>
      <div ref={ringRef} className="cur-ring" style={{ opacity: 0 }}>
        <span className="cur-ring-in" />
      </div>
    </>
  );
}
