"use client";

import ClockIST from "./ClockIST";
import { COORDS } from "../lib/projects";

// Edge HUD — tiny mono readouts pinned to the bottom of the viewport
// (coordinates left, live IST clock right). Desktop only, never interactive.
export default function Hud() {
  return (
    <div className="hud" aria-hidden="true">
      <span>{COORDS}</span>
      <span>
        HYD — <ClockIST /> IST
      </span>
    </div>
  );
}
