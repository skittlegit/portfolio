"use client";

import { useState } from "react";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const { isDark, toggle, fg, fgMuted } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link.");
      }
    }

    setSubmitting(false);
  };

  return (
    <div
      className="relative flex flex-col"
      style={{
        fontFamily: "var(--font-playfair), Georgia, serif",
        color: fg,
        transition: "color 0.3s",
        minHeight: "100dvh",
        overflowX: "clip",
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 md:px-20 pt-7 pb-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm tracking-wide"
          style={{
            color: fgMuted,
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
          onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Home
        </Link>
        <button
          onClick={() => toggle()}
          aria-label="Toggle dark mode"
          style={{
            background: "transparent",
            border: "none",
            color: fg,
            padding: "12px",
            lineHeight: 0,
            transition: "color 0.3s",
          }}
        >
          {isDark ? (
            <Sun size={18} strokeWidth={1.5} />
          ) : (
            <Moon size={18} strokeWidth={1.5} />
          )}
        </button>
      </header>

      {/* Centered form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-10 md:px-20 pb-20">
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight mb-2">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p
            className="text-sm tracking-wide mb-10"
            style={{ color: fgMuted }}
          >
            {mode === "login"
              ? "Sign in to your account"
              : "Sign up with your email"}
          </p>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="tool-label">Email</label>
              <input
                type="email"
                className="tool-input"
                style={{ width: "100%" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="tool-label">Password</label>
              <input
                type="password"
                className="tool-input"
                style={{ width: "100%" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>
            )}
            {message && (
              <p style={{ color: isDark ? "#4ade80" : "#16a34a", fontSize: 13 }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 16px",
                fontSize: 14,
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: isDark ? "#000" : "#fff",
                backgroundColor: fg,
                border: "none",
                borderRadius: 10,
                transition: "opacity 0.2s",
                opacity: submitting ? 0.6 : 1,
                marginTop: 4,
              }}
            >
              {submitting
                ? "..."
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          {/* Toggle mode */}
          <p
            className="text-sm mt-8 text-center"
            style={{ color: fgMuted }}
          >
            {mode === "login"
              ? "Don\u2019t have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
                setMessage(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: fg,
                textDecoration: "underline",
                textUnderlineOffset: 4,
                fontFamily: "inherit",
                fontSize: "inherit",
                padding: 0,
              }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
