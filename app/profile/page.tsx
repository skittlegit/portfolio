"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { User, Mail, Calendar, Shield, LogOut, Pencil, Check, X, Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import ToolLayout from "../components/ToolLayout";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getSavedItems, type SavedItem } from "@/lib/saved-items";
import { updateProfile, checkUsernameAvailable, uploadAvatar } from "@/lib/profile";

export default function ProfilePage() {
  const { fg, fgMuted, isDark } = useTheme();
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
  const displayAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name;
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const startEditName = () => {
    setNameValue(displayName || "");
    setEditingName(true);
  };

  const saveName = async () => {
    setSaving(true);
    try {
      await updateProfile({ display_name: nameValue.trim() || undefined });
      await refreshProfile();
    } catch {}
    setEditingName(false);
    setSaving(false);
  };

  const startEditUsername = () => {
    setUsernameValue(profile?.username || "");
    setUsernameAvailable(null);
    setEditingUsername(true);
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

  const saveUsername = async () => {
    if (!usernameAvailable || usernameValue.length < 3) return;
    setSaving(true);
    try {
      await updateProfile({ username: usernameValue });
      await refreshProfile();
    } catch {}
    setEditingUsername(false);
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: "none" }}
              />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              {/* Display Name */}
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="tool-input"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    style={{ fontSize: 16, padding: "4px 8px", width: "100%" }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                  />
                  <button onClick={saveName} disabled={saving} style={inlineBtn} title="Save">
                    <Check size={16} style={{ color: "#22c55e" }} />
                  </button>
                  <button onClick={() => setEditingName(false)} style={inlineBtn} title="Cancel">
                    <X size={16} style={{ color: "#ef4444" }} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-lg font-medium tracking-tight">
                    {displayName || "No name set"}
                  </p>
                  <button onClick={startEditName} style={inlineBtn} title="Edit name">
                    <Pencil size={13} />
                  </button>
                </div>
              )}

              {/* Username */}
              {editingUsername ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm" style={{ color: fgMuted }}>@</span>
                  <input
                    type="text"
                    className="tool-input"
                    value={usernameValue}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    style={{ fontSize: 13, padding: "3px 6px", width: "100%" }}
                    autoFocus
                    placeholder="username"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveUsername();
                      if (e.key === "Escape") setEditingUsername(false);
                    }}
                  />
                  {usernameValue.length >= 3 && (
                    checkingUsername ? (
                      <Loader2 size={14} style={{ color: fgMuted, animation: "spin 1s linear infinite" }} />
                    ) : usernameAvailable === true ? (
                      <Check size={14} style={{ color: "#22c55e" }} />
                    ) : usernameAvailable === false ? (
                      <X size={14} style={{ color: "#ef4444" }} />
                    ) : null
                  )}
                  <button onClick={saveUsername} disabled={saving || !usernameAvailable} style={inlineBtn} title="Save">
                    <Check size={16} style={{ color: "#22c55e" }} />
                  </button>
                  <button onClick={() => setEditingUsername(false)} style={inlineBtn} title="Cancel">
                    <X size={16} style={{ color: "#ef4444" }} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm" style={{ color: fgMuted }}>
                    {profile?.username ? `@${profile.username}` : "No username set"}
                  </p>
                  <button onClick={startEditUsername} style={inlineBtn} title="Edit username">
                    <Pencil size={11} />
                  </button>
                </div>
              )}

              <p className="text-sm mt-1" style={{ color: fgMuted }}>
                {user?.email}
              </p>
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
