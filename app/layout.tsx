import type { Metadata } from "next";
import { DM_Serif_Display, DM_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import CursorEffect from "./components/CursorEffect";
import SmoothScroll from "./components/SmoothScroll";
import ErrorBoundary from "./components/ErrorBoundary";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Deepak — Builder & Designer",
  description:
    "Internet generalist building things and documenting the process. Tools, projects, and notes.",
  metadataBase: new URL("https://deepakness.com"),
  openGraph: {
    title: "Deepak — Builder & Designer",
    description:
      "Internet generalist building things and documenting the process.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${dmSerif.variable} ${dmMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <CursorEffect />
            <SmoothScroll>
              <ErrorBoundary>{children}</ErrorBoundary>
            </SmoothScroll>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
