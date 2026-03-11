import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

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
            return NextResponse.redirect(`${origin}/choose-username`);
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
