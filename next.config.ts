import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. The site is fully static with no third-party
// embeds, so everything is locked to same-origin except:
//  - 'unsafe-inline' scripts: the pre-paint theme script and Next's inline
//    bootstrap data (a nonce would force every page to render dynamically);
//  - 'unsafe-inline' styles: the design leans on inline style attributes;
//  - data:/blob: images: the tools preview generated and user-picked images
//    locally, and next/image uses data: blur placeholders;
//  - va.vercel-scripts.com: Vercel Analytics / Speed Insights load their
//    debug builds from there outside production.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${dev ? " ws: wss: https://va.vercel-scripts.com" : ""}`,
  "object-src 'self'", // the inline résumé PDF on /resume
  "frame-src 'self' blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
};

export default nextConfig;
