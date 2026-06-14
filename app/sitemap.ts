import type { MetadataRoute } from "next";
import { PROJECTS } from "./lib/projects";

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
  "color-converter",
  "logo-maker",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/work`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/resume`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
  ];
  const work: MetadataRoute.Sitemap = PROJECTS.map((p) => ({
    url: `${SITE}/work/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  const tools: MetadataRoute.Sitemap = TOOL_SLUGS.map((slug) => ({
    url: `${SITE}/tools/${slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.5,
  }));
  return [...base, ...work, ...tools];
}
