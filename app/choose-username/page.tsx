"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ToolLayout from "../components/ToolLayout";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { checkUsernameAvailable, updateProfile } from "@/lib/profile";

export default function ChooseUsernamePage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // If user already has a username, redirect to profile
  useEffect(() => {
    if (!authLoading && profile?.username) {
      router.replace("/profile");
    }
  }, [authLoading, profile, router]);

  const handleChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(clean);
    setAvailable(null);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (clean.length < 3) {
      setAvailable(null);
      return;
    }

    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      const ok = await checkUsernameAvailable(clean);
      setAvailable(ok);
      setChecking(false);
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!available || username.length < 3) return;
    setError(null);
    setSubmitting(true);

    try {
      await updateProfile({ username });
      await refreshProfile();
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setSubmitting(false);
  };

  if (authLoading) return null;
  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <ToolLayout title="Choose Username" description="Pick a unique username for your account." backHref="/" backLabel="Home">
      <div className="max-w-md">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label className="tool-label">Username</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="tool-input"
                style={{ width: "100%", paddingRight: 40 }}
                value={username}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="your-username"
                minLength={3}
                maxLength={30}
                required
                autoFocus
              />
              {username.length >= 3 && (
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    lineHeight: 0,
                  }}
                >
                  {checking ? (
                    <Loader2 size={16} strokeWidth={1.5} style={{ color: fgMuted, animation: "spin 1s linear infinite" }} />
                  ) : available === true ? (
                    <Check size={16} strokeWidth={2} style={{ color: "#22c55e" }} />
                  ) : available === false ? (
                    <X size={16} strokeWidth={2} style={{ color: "#ef4444" }} />
                  ) : null}
                </span>
              )}
            </div>
            <p className="text-xs mt-2" style={{ color: fgMuted }}>
              3–30 characters. Letters, numbers, hyphens, and underscores only.
            </p>
            {available === false && (
              <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
                This username is taken.
              </p>
            )}
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting || !available || username.length < 3}
            style={{
              padding: "12px 16px",
              fontSize: 14,
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: isDark ? "#000" : "#fff",
              backgroundColor: fg,
              border: "none",
              borderRadius: 10,
              transition: "opacity 0.2s",
              opacity: submitting || !available || username.length < 3 ? 0.4 : 1,
            }}
          >
            {submitting ? "..." : "Continue"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "none",
              color: fgMuted,
              fontFamily: "inherit",
              fontSize: 13,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Skip for now
          </button>
        </form>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </ToolLayout>
  );
}
