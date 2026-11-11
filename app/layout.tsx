import type { Metadata, Viewport } from "next";
import { Archivo, Fragment_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import SmoothScroll from "./components/SmoothScroll";
import Cursor from "./components/Cursor";
import Preloader from "./components/Preloader";
import Background from "./components/Background";
import Hud from "./components/Hud";
import { SITE } from "./lib/seo";
import "./globals.css";

// One variable family does all the talking: Archivo's width axis spans
// 62% (the condensed display voice) to 125%. Fragment Mono is the data voice.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const mono = Fragment_Mono({
  variable: "--font-fragment",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Deepak Aeleni — Internet Generalist",
    template: "%s · Deepak Aeleni",
  },
  description:
    "Deepak Aeleni — internet generalist based in Hyderabad. Building tools, crafting interfaces, and documenting the process. UI/UX-focused full-stack & app developer.",
  keywords: [
    "Deepak Aeleni",
    "bydeepak",
    "UI/UX designer",
    "full-stack developer",
    "Next.js",
    "Hyderabad",
    "free design tools",
  ],
  authors: [{ name: "Deepak Aeleni" }],
  creator: "Deepak Aeleni",
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "bydeepak",
    title: "Deepak Aeleni — Internet Generalist",
    description:
      "Building tools, crafting interfaces, and documenting the process. UI/UX-focused full-stack & app developer in Hyderabad.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deepak Aeleni — Internet Generalist",
    description:
      "Building tools, crafting interfaces, and documenting the process.",
    creator: "@itsnotskittle",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#100f0c" },
    { media: "(prefers-color-scheme: light)", color: "#e9e4d7" },
  ],
  colorScheme: "dark light",
};

// Runs before first paint.
// 1. Theme — avoids a flash of the wrong palette. Ink (dark) is the
//    art-directed default; paper is the alternate.
// 2. Boot cover — on a first visit (no "booted" flag, motion allowed) it sets
//    data-boot, which paints a plain cover (see globals.css) until the
//    Preloader component hydrates and takes over. Without it the finished
//    page shows for a moment before the preloader appears.
const themeScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t='dark';d.setAttribute('data-theme',t);}catch(e){}try{if(sessionStorage.getItem('booted')!=='1'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.setAttribute('data-boot','1');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${archivo.variable} ${mono.variable} antialiased`}
      >
        <a href="#main" className="skip-link mono">Skip to content</a>
        <ThemeProvider>
          <Background />
          <Preloader />
          <Cursor />
          <Hud />
          <SmoothScroll>
            <ErrorBoundary>{children}</ErrorBoundary>
          </SmoothScroll>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
