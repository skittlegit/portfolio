import type { Metadata } from "next";

// Subtree metadata for /tools and every /tools/* page. The tool pages are client
// components and can't export their own metadata, so this supplies a sensible
// static title/description; ToolLayout refines the title per-tool on the client.
export const metadata: Metadata = {
  title: { default: "Tools", template: "%s · Deepak Aeleni" },
  description:
    "Free browser-based design & dev utilities. No sign-up, no tracking — everything runs locally in your browser.",
  openGraph: {
    title: "Tools — Deepak Aeleni",
    description:
      "Free browser-based design & dev utilities. No sign-up, no tracking.",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
