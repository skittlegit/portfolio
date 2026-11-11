import type { Metadata } from "next";
import { AUTHOR, pageMeta } from "../lib/seo";

// Metadata for the /tools index. Each tool has its own layout.tsx that
// overrides this with a per-tool title, description and canonical (the tool
// pages are client components and can't export metadata themselves).
export const metadata: Metadata = {
  ...pageMeta({
    title: "Tools",
    description:
      "Free browser-based design & dev utilities. No sign-up, no tracking — everything runs locally in your browser.",
    path: "/tools",
  }),
  // A plain string title here would reset the root layout's template for the
  // tool pages below, so restate it.
  title: { default: "Tools", template: `%s · ${AUTHOR}` },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
