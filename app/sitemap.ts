import type { MetadataRoute } from "next";

const SITE = "https://bydeepak.com";

const TOOL_SLUGS = [
  "qr-code",
  "palette-generator",
  "gradient-generator",
  "ascii-art",
  "halftone",
  "image-compressor",
  "images-to-pdf",
  "pattern-library",
  "generative-art",
  "vector-art",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/resume`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
  ];
  const tools: MetadataRoute.Sitemap = TOOL_SLUGS.map((slug) => ({
    url: `${SITE}/tools/${slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.5,
  }));
  return [...base, ...tools];
}
