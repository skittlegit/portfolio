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
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--background", isDark ? "#000000" : "#ffffff");
    document.documentElement.style.setProperty("--foreground", isDark ? "#ffffff" : "#000000");
    document.documentElement.style.setProperty("--foreground-muted", isDark ? "#71717a" : "#a1a1aa");
  }, [isDark]);

  const bg = isDark ? "#000000" : "#ffffff";
  const fg = isDark ? "#ffffff" : "#000000";
  const fgMuted = isDark ? "#71717a" : "#a1a1aa";

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark((d) => !d), bg, fg, fgMuted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
