"use client";

import { useEffect, useState } from "react";

// Live Hyderabad clock — instrument readout. Formatter cached at module level.
const IST_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export default function ClockIST() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const raf = requestAnimationFrame(() => setTime(IST_FMT.format(new Date())));
    const id = setInterval(() => setTime(IST_FMT.format(new Date())), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);
  return <span suppressHydrationWarning>{time}</span>;
}
