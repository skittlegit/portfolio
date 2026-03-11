// Site URL helper — resolves the canonical site URL for OAuth redirects.
// Set NEXT_PUBLIC_SITE_URL in your environment (Vercel project settings) to your
// production domain so OAuth callbacks always land on the real site, not a preview URL.

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}
