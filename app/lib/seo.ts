import type { Metadata } from "next";
import { TOOLS } from "./tools";

export const SITE = "https://bydeepak.com";
export const SITE_NAME = "bydeepak";
export const AUTHOR = "Deepak Aeleni";

// The shared OG card (app/opengraph-image.tsx). Listed explicitly because a
// page that sets its own `openGraph` replaces the parent's object wholesale —
// including the image the file convention would otherwise supply.
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${AUTHOR} — Internet Generalist`,
};

/**
 * Per-page metadata: title, description, a self-referencing canonical, and
 * Open Graph / Twitter tags that describe THIS page rather than the home page.
 * `title` is the short page title; the root layout's template adds the suffix.
 */
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const full = `${title} · ${AUTHOR}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: path,
      title: full,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: full,
      description,
      creator: "@itsnotskittle",
      images: [OG_IMAGE.url],
    },
  };
}

/** Metadata for one tool page, looked up from the shared tool list. */
export function toolMeta(slug: string): Metadata {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Unknown tool slug: ${slug}`);
  return pageMeta({
    title: tool.name,
    description: `${tool.description} Free, runs entirely in your browser.`,
    path: `/tools/${tool.slug}`,
  });
}
