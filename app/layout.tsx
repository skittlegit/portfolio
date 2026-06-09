import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import SmoothScroll from "./components/SmoothScroll";
import Cursor from "./components/Cursor";
import Preloader from "./components/Preloader";
import Background from "./components/Background";
import "./globals.css";

const grotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const SITE = "https://bydeepak.com";

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
  alternates: { canonical: "/" },
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
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#f4f2ea" },
  ],
  colorScheme: "light dark",
};

// Set theme before paint to avoid a flash of the wrong palette.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t='light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${grotesk.variable} ${mono.variable} ${serif.variable} antialiased`}
      >
        <a href="#main" className="skip-link mono">Skip to content</a>
        <ThemeProvider>
          <Background />
          <Preloader />
          <Cursor />
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
