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

  const handleOAuth = async (provider: "github" | "google") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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

          {/* OAuth buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              className="tool-btn"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px 16px",
                fontSize: 14,
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="tool-btn"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px 16px",
                fontSize: 14,
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div style={{ flex: 1, height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
            <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: fgMuted }}>or</span>
            <div style={{ flex: 1, height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
          </div>

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
