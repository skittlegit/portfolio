"use client";

import { createContext, useContext, useState, useEffect } from "react";

type ThemeContextType = {
  isDark: boolean;
  toggle: () => void;
  bg: string;
  fg: string;
  fgMuted: string;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") setIsDark(true);
  }, []);

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  const bg = isDark ? "#000000" : "#ffffff";
  const fg = isDark ? "#ffffff" : "#000000";
  const fgMuted = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";

  return (
    <ThemeContext.Provider value={{ isDark, toggle, bg, fg, fgMuted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
