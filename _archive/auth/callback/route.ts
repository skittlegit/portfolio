import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Prefer NEXT_PUBLIC_SITE_URL so OAuth always lands on the real domain, not a preview URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // After OAuth login, check if user needs to pick a username
      if (next !== "/reset-password") {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", userData.user.id)
            .maybeSingle();
          if (!profile?.username) {
            return NextResponse.redirect(`${siteUrl}/choose-username`);
          }
        }
      }
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth`);
}
