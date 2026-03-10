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
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", isDark ? "dark" : "light");
    root.style.setProperty("--background", isDark ? "#000000" : "#ffffff");
    root.style.setProperty("--foreground", isDark ? "#ffffff" : "#000000");
    root.style.setProperty("--foreground-muted", isDark ? "#71717a" : "#a1a1aa");
    root.style.setProperty("--border", isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)");
    root.style.setProperty("--border-subtle", isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => setIsDark((d) => !d);

  const bg = isDark ? "#000000" : "#ffffff";
  const fg = isDark ? "#ffffff" : "#000000";
  const fgMuted = isDark ? "#71717a" : "#a1a1aa";

  return (
    <ThemeContext.Provider value={{ isDark, toggle, bg, fg, fgMuted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
