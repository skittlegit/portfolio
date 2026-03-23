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
  const [isDark, setIsDark] = useState<boolean>(true); // Default dark

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") setIsDark(false);
    else if (stored === "dark") setIsDark(true);
    // else keep dark as default
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => setIsDark((d) => !d);

  const bg = isDark ? "#0c0c0c" : "#faf8f5";
  const fg = isDark ? "#f0ece8" : "#1a1816";
  const fgMuted = isDark ? "#7a7670" : "#8a8580";

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
