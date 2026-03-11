"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { User, Mail, Calendar, Shield, LogOut, Pencil, Check, X, Camera, Loader2, Link2 } from "lucide-react";
import Link from "next/link";
import ToolLayout from "../components/ToolLayout";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getSavedItems, type SavedItem } from "@/lib/saved-items";
import { updateProfile, checkUsernameAvailable, uploadAvatar } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Single edit mode
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (authLoading || !user) {
      setLoadingItems(false);
      return;
    }
    getSavedItems()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoadingItems(false));
  }, [user, authLoading]);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
    }
    return byType;
  }, [items]);

  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const provider = user?.app_metadata?.provider;
  const providers: string[] = user?.app_metadata?.providers || [provider || "email"];
  const displayAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name;
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const startEditing = () => {
    setNameValue(displayName || "");
    setUsernameValue(profile?.username || "");
    setUsernameAvailable(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setUsernameAvailable(null);
  };

  const handleUsernameChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsernameValue(clean);
    setUsernameAvailable(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (clean.length < 3) return;
    setCheckingUsername(true);
    debounceRef.current = setTimeout(async () => {
      const ok = await checkUsernameAvailable(clean);
      setUsernameAvailable(ok);
      setCheckingUsername(false);
    }, 400);
  };

  const saveChanges = async () => {
    // Validate username if changed
    const usernameChanged = usernameValue !== (profile?.username || "");
    if (usernameChanged && usernameValue.length >= 3 && !usernameAvailable) return;
    if (usernameChanged && usernameValue.length > 0 && usernameValue.length < 3) return;

    setSaving(true);
    try {
      const updates: { display_name?: string; username?: string } = {};
      const nameChanged = nameValue.trim() !== (displayName || "");
      if (nameChanged) updates.display_name = nameValue.trim();
      if (usernameChanged && usernameValue.length >= 3) updates.username = usernameValue;

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
        await refreshProfile();
      }
    } catch {}
    setEditing(false);
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file);
      await updateProfile({ avatar_url: url });
      await refreshProfile();
    } catch {}
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const linkProvider = async (providerName: "github" | "google") => {
    setLinkingProvider(providerName);
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider: providerName,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      },
    });
    if (error) {
      setLinkingProvider(null);
    }
  };

  const inlineBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    lineHeight: 0,
    color: fgMuted,
  };

  return (
    <ToolLayout title="Profile" description="Your account details." backHref="/" backLabel="Home">
      {!authLoading && !user ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p className="text-lg mb-4" style={{ color: fgMuted }}>
            Sign in to view your profile
          </p>
          <Link
            href="/login"
            className="tool-btn"
            style={{
              padding: "12px 24px",
              fontSize: 14,
              textDecoration: "none",
              color: isDark ? "#000" : "#fff",
              backgroundColor: fg,
              borderColor: fg,
            }}
          >
            Sign in
          </Link>
        </div>
      ) : authLoading ? (
        <p style={{ color: fgMuted }}>Loading...</p>
      ) : (
        <div className="max-w-xl">
          {/* Avatar + Name */}
          <div className="flex items-center gap-5 mb-8">
            <div style={{ position: "relative" }}>
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    border: `2px solid ${borderSubtle}`,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    border: `2px solid ${borderSubtle}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  }}
                >
                  <User size={28} strokeWidth={1} style={{ color: fgMuted }} />
                </div>
              )}
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title="Change avatar"
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: `2px solid ${isDark ? "#000" : "#fff"}`,
                    backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {uploadingAvatar ? (
                    <Loader2 size={12} style={{ color: fgMuted, animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Camera size={12} style={{ color: fgMuted }} />
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: "none" }}
              />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              {editing ? (
                <>
                  <div className="mb-2">
                    <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: fgMuted }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      className="tool-input"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      style={{ fontSize: 14, padding: "6px 10px", width: "100%" }}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: fgMuted }}>
                      Username
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="tool-input"
                        value={usernameValue}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        style={{ fontSize: 14, padding: "6px 10px", paddingRight: 36, width: "100%" }}
                        placeholder="username"
                        minLength={3}
                        maxLength={30}
                      />
                      {usernameValue.length >= 3 && (
                        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", lineHeight: 0 }}>
                          {checkingUsername ? (
                            <Loader2 size={14} strokeWidth={1.5} style={{ color: fgMuted, animation: "spin 1s linear infinite" }} />
                          ) : usernameAvailable === true ? (
                            <Check size={14} strokeWidth={2} style={{ color: "#22c55e" }} />
                          ) : usernameAvailable === false ? (
                            <X size={14} strokeWidth={2} style={{ color: "#ef4444" }} />
                          ) : null}
                        </span>
                      )}
                    </div>
                    {usernameAvailable === false && (
                      <p className="text-xs mt-1" style={{ color: "#ef4444" }}>This username is taken.</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={saveChanges}
                      disabled={saving || (usernameValue !== (profile?.username || "") && usernameValue.length >= 3 && !usernameAvailable)}
                      style={{
                        padding: "6px 16px",
                        fontSize: 13,
                        fontFamily: "var(--font-playfair), Georgia, serif",
                        color: isDark ? "#000" : "#fff",
                        backgroundColor: fg,
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        opacity: saving ? 0.5 : 1,
                      }}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEditing}
                      style={{
                        padding: "6px 16px",
                        fontSize: 13,
                        fontFamily: "inherit",
                        color: fgMuted,
                        backgroundColor: "transparent",
                        border: `1px solid ${borderSubtle}`,
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium tracking-tight">
                      {displayName || "No name set"}
                    </p>
                    <button onClick={startEditing} style={inlineBtn} title="Edit profile">
                      <Pencil size={13} />
                    </button>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: fgMuted }}>
                    {profile?.username ? `@${profile.username}` : "No username set"}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: fgMuted }}>
                    {user?.email}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div
            style={{
              border: `1px solid ${borderSubtle}`,
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: fgMuted }}
            >
              Account
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Mail size={16} strokeWidth={1.5} style={{ color: fgMuted }} />
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield size={16} strokeWidth={1.5} style={{ color: fgMuted }} />
                <span className="text-sm capitalize">
                  {provider === "email" ? "Email & Password" : provider || "Email"}
                </span>
              </div>
              {joinDate && (
                <div className="flex items-center gap-3">
                  <Calendar size={16} strokeWidth={1.5} style={{ color: fgMuted }} />
                  <span className="text-sm">Joined {joinDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Linked Accounts */}
          <div
            style={{
              border: `1px solid ${borderSubtle}`,
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: fgMuted }}
            >
              Linked Accounts
            </h3>
            <div className="flex flex-col gap-3">
              {/* GitHub */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={fg}>
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span className="text-sm">GitHub</span>
                </div>
                {providers.includes("github") ? (
                  <span className="text-xs" style={{ color: "#22c55e" }}>Connected</span>
                ) : (
                  <button
                    onClick={() => linkProvider("github")}
                    disabled={!!linkingProvider}
                    style={{
                      padding: "4px 12px",
                      fontSize: 12,
                      color: fg,
                      backgroundColor: "transparent",
                      border: `1px solid ${borderSubtle}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      opacity: linkingProvider ? 0.5 : 1,
                    }}
                  >
                    {linkingProvider === "github" ? "..." : "Link"}
                  </button>
                )}
              </div>
              {/* Google */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm">Google</span>
                </div>
                {providers.includes("google") ? (
                  <span className="text-xs" style={{ color: "#22c55e" }}>Connected</span>
                ) : (
                  <button
                    onClick={() => linkProvider("google")}
                    disabled={!!linkingProvider}
                    style={{
                      padding: "4px 12px",
                      fontSize: 12,
                      color: fg,
                      backgroundColor: "transparent",
                      border: `1px solid ${borderSubtle}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      opacity: linkingProvider ? 0.5 : 1,
                    }}
                  >
                    {linkingProvider === "google" ? "..." : "Link"}
                  </button>
                )}
              </div>
              {/* Email */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail size={16} strokeWidth={1.5} style={{ color: fgMuted }} />
                  <span className="text-sm">Email & Password</span>
                </div>
                {providers.includes("email") ? (
                  <span className="text-xs" style={{ color: "#22c55e" }}>Connected</span>
                ) : (
                  <span className="text-xs" style={{ color: fgMuted }}>—</span>
                )}
              </div>
            </div>
          </div>

          {/* Saved Items Stats */}
          <div
            style={{
              border: `1px solid ${borderSubtle}`,
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-xs uppercase tracking-widest"
                style={{ color: fgMuted }}
              >
                Saved Items
              </h3>
              <Link
                href="/saved"
                className="text-xs uppercase tracking-widest"
                style={{ color: fgMuted, textDecoration: "underline", textUnderlineOffset: 4 }}
              >
                View All
              </Link>
            </div>
            {loadingItems ? (
              <p className="text-sm" style={{ color: fgMuted }}>Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-sm" style={{ color: fgMuted }}>No saved items yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  }}
                >
                  <p className="text-2xl font-light">{items.length}</p>
                  <p className="text-xs" style={{ color: fgMuted }}>Total</p>
                </div>
                {Object.entries(stats).map(([type, count]) => (
                  <div
                    key={type}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 8,
                      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    }}
                  >
                    <p className="text-2xl font-light">{count}</p>
                    <p className="text-xs capitalize" style={{ color: fgMuted }}>
                      {type.replace("-", " ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }}
              className="tool-btn"
              style={{ color: fg }}
            >
              <LogOut size={14} strokeWidth={1.5} /> Sign Out
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ToolLayout>
  );
}
