"use client";

import { useState } from "react";
import { ArrowLeft, Sun, Moon, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const { isDark, toggle, fg, fgMuted } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/profile");
      router.refresh();
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
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 md:px-20 pt-7 pb-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm tracking-wide"
          style={{ color: fgMuted, textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = fg)}
          onMouseLeave={(e) => (e.currentTarget.style.color = fgMuted)}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Home
        </Link>
        <button
          onClick={() => toggle()}
          aria-label="Toggle dark mode"
          style={{ background: "transparent", border: "none", color: fg, padding: "12px", lineHeight: 0, transition: "color 0.3s" }}
        >
          {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
        </button>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-10 md:px-20 pb-20">
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight mb-2">
            New password
          </h1>
          <p className="text-sm tracking-wide mb-10" style={{ color: fgMuted }}>
            Choose a new password for your account
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="tool-label">New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="tool-input"
                  style={{ width: "100%", paddingRight: 44 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: fgMuted,
                    padding: 4,
                    cursor: "pointer",
                    lineHeight: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>
            <div>
              <label className="tool-label">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="tool-input"
                style={{ width: "100%" }}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}

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
              {submitting ? "..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
