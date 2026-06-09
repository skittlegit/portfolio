<div align="center">

# bydeepak.com

**Deepak Aeleni — internet generalist · UI/UX-focused full-stack & app developer**

A personal portfolio and a suite of free, client-side design tools.
The site *is* the portfolio piece — craft, motion, and detail are the deliverable.

</div>

---

## Design

A near-monochrome **paper gallery**: warm off-white + near-black ink, with a single
muted electric-violet accent on well under 5% of the surface. Angular and editorial —
sharp corners, hard rules, oversized display type, generous negative space.

The motion language is **“DECODE”** (documented at the top of
[`app/globals.css`](app/globals.css), which is also the single source of truth for
every token — colour, type, spacing, motion easings/durations):

- **Type decodes** — the hero name resolves out of random glyphs and locks in (`Scramble`).
- **Custom cursor** — a precise dot + a lagging ring that fills violet and labels itself over targets.
- **Background** — a soft, slow-drifting violet/warm colour mesh under fine grain (no grid lines).
- **Reveals plot in** — clip / mask wipes, staggered (`Reveal`), with magnetic CTAs (`Magnetic`).
- **Preloader** — a once-per-session boot counter that wipes away.

Type: **Space Grotesk** (display/body) · **Instrument Serif** (accents & numerals) ·
**Space Mono** (data/labels). Full **light / dark** support and complete
`prefers-reduced-motion` and touch fallbacks throughout.

## Stack

| | |
|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS v4 + centralized CSS design tokens |
| **Motion** | Framer Motion (primary) · Lenis (smooth scroll) · GSAP (ScrollTrigger) |
| **Tooling libs** | `qrcode`, `jspdf`, `lucide-react` (icons) |
| **Analytics** | Vercel Analytics + Speed Insights |
| **Deploy** | Vercel · no environment variables required |

## Architecture

```
app/
├─ layout.tsx              # root — fonts, metadata/OG, providers, global shell
├─ template.tsx            # route transition (opacity crossfade)
├─ page.tsx                # home — hero, profile, stats, work ×6, tools teaser, contact
├─ globals.css             # design tokens + "DECODE" motion language
├─ opengraph-image.tsx     # dynamic OG card
├─ sitemap.ts · robots.ts  # SEO
├─ not-found.tsx           # 404
├─ resume/                 # /resume — inline PDF + download (public/resume.pdf)
├─ context/ThemeContext.tsx
├─ components/             # Nav, Cursor, Preloader, Background, Reveal, Magnetic,
│                          #   Scramble, SmoothScroll, ToolLayout, ColorPicker, …
└─ tools/                  # the 10 tools + ToolLayout chrome (layout.tsx supplies metadata)
public/work/              # project screenshots (statically imported → content-hashed)
```

## Tools

Ten **100% client-side** utilities — no sign-up, no tracking, nothing leaves the browser:

`QR Code` · `Color Palette` · `CSS Gradient` · `ASCII Art` · `Halftone` ·
`Image Compressor` · `Images → PDF` · `Pattern Library` · `Generative Bio Art` · `Vector Art`

(`color-converter` and `logo-maker` routes also exist and work, but aren’t featured on `/tools`.)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Notes

- **No backend.** The tools are serverless and run entirely in the browser.
- **Updating a project screenshot:** drop a new PNG in `public/work/<name>.png` and
  rebuild. Images are statically imported, so each gets a content-hashed URL that
  busts caches automatically — no hard refresh needed.
- **Tweaking the look:** everything is driven from the token block at the top of
  [`app/globals.css`](app/globals.css).
