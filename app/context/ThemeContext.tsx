"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";

type ThemeContextType = {
  isDark: boolean;
  toggle: () => void;
  bg: string;
  fg: string;
  fgMuted: string;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(true); // Default ink (dark)
  const hydrated = useRef(false);

  useEffect(() => {
    // Catch React state up with the stored theme. The pre-paint inline script in
    // layout.tsx already applied the correct data-theme to <html>, so this only
    // updates the toggle icon / tool colors. Deferred to a rAF callback so the
    // setState isn't synchronous in the effect body (react-hooks/set-state-in-effect).
    const id = requestAnimationFrame(() => {
      if (localStorage.getItem("theme") === "light") setIsDark(false);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    // Skip the initial mount run: writing here before the stored theme has been
    // read would stomp a saved "light" preference with the default "dark".
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => setIsDark((d) => !d);

  // Mirror of the CSS palette tokens in globals.css (tool pages read these inline).
  const bg = isDark ? "#100f0c" : "#e9e4d7";
  const fg = isDark ? "#e8e2d4" : "#191510";
  const fgMuted = isDark ? "#928b7a" : "#6e6759";

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
