"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ToolLayout from "../components/ToolLayout";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { isWhitelisted } from "@/lib/whitelist";

export default function Page165() {
  const { fgMuted } = useTheme();
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/165");
      return;
    }
    if (isWhitelisted(user.email, profile?.username)) {
      setAuthorized(true);
    } else {
      router.replace("/");
    }
  }, [loading, user, profile, router]);

  if (loading || !authorized) {
    return (
      <ToolLayout title="165" description="" backHref="/" backLabel="Home">
        <p style={{ color: fgMuted }}>Loading...</p>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="165" description="Private section." backHref="/" backLabel="Home">
      <div className="max-w-2xl">
        <p style={{ color: fgMuted }}>
          Welcome. This page is only visible to whitelisted users. Content coming soon.
        </p>
      </div>
    </ToolLayout>
  );
}
