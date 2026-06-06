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
  const [isDark, setIsDark] = useState<boolean>(false); // Default light (paper)

  useEffect(() => {
    // Sync React state with the stored theme. Deferred to the next frame so the
    // update runs from a callback rather than synchronously in the effect body.
    // The pre-paint inline script in layout.tsx already applied the correct
    // data-theme to <html>, so this only catches up the toggle icon / tool colors.
    const id = requestAnimationFrame(() => {
      const stored = localStorage.getItem("theme");
      if (stored === "light") setIsDark(false);
      else if (stored === "dark") setIsDark(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => setIsDark((d) => !d);

  // Mirror of the CSS palette tokens in globals.css (tool pages read these inline).
  const bg = isDark ? "#0a0a0b" : "#f4f2ea";
  const fg = isDark ? "#f1efea" : "#14130f";
  const fgMuted = isDark ? "#8b8884" : "#5f5c54";

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
