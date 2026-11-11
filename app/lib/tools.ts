// Single source of truth for the toolbox — the /tools index, the home teaser,
// the sitemap, per-tool metadata and the screenshot scripts all read this list.
// Keep it free of React / Next imports so plain Node scripts can import it too.

export type Tool = {
  slug: string;
  /** full name — tool page title and index card */
  name: string;
  /** short name — home teaser strip */
  short: string;
  description: string;
};

export const TOOLS: Tool[] = [
  { slug: "qr-code", name: "QR Code Generator", short: "QR Code", description: "Generate QR codes with custom size, colors, and format." },
  { slug: "palette-generator", name: "Color Palette Generator", short: "Color Palette", description: "Generate color palettes — press space or generate." },
  { slug: "gradient-generator", name: "CSS Gradient Generator", short: "CSS Gradient", description: "Create CSS gradients or extract them from photos." },
  { slug: "ascii-art", name: "ASCII Art Generator", short: "ASCII Art", description: "Convert text or images into ASCII art." },
  { slug: "halftone", name: "Halftone Dots Effect", short: "Halftone", description: "Transform images into halftone dot patterns." },
  { slug: "image-compressor", name: "Image Compressor", short: "Image Compressor", description: "Compress images right in your browser — no uploads." },
  { slug: "images-to-pdf", name: "Images to PDF", short: "Images → PDF", description: "Combine multiple images into a single PDF." },
  { slug: "pattern-library", name: "Pattern Library", short: "Pattern Library", description: "Generate repeating SVG patterns for backgrounds." },
  { slug: "generative-art", name: "Generative Bio Art", short: "Generative Art", description: "Create organic, biology-inspired generative art." },
  { slug: "vector-art", name: "Vector Art Generator", short: "Vector Art", description: "Generate vector illustrations in various styles." },
  { slug: "color-converter", name: "Color Converter", short: "Color Converter", description: "Convert between HEX, RGB, and HSL color formats." },
  { slug: "logo-maker", name: "Shape Maker", short: "Shape Maker", description: "Create unique shape compositions with blended colors." },
];
