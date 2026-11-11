<div align="center">

# bydeepak.com

**Deepak Aeleni — internet generalist · UI/UX-focused full-stack & app developer**

A personal portfolio and a suite of free, client-side design tools.
The site *is* the portfolio piece — craft, motion, and detail are the deliverable.

</div>

---

## Design

The design language is **“INDEX”** — a designer's archive. Warm black ink and warm
cream paper, **dark by default**, with a single electric-violet accent on well under
5% of the surface. Flat, confident fields: no gradients, no glass, sharp corners
everywhere. It is documented at the top of [`app/globals.css`](app/globals.css),
which is also the single source of truth for every token (colour, type, spacing,
motion easings and durations).

- **Every page opens with one giant condensed word**, set edge to edge.
- **Type arrives through line masks** — letters rise out of an overflow crop (`MaskReveal`); other content fades up on scroll (`Reveal`).
- **The work index is typographic** — rows invert on hover while a live preview card chases the cursor.
- **Chrome is an instrument** — tiny mono readouts (coordinates, a live IST clock, indices) pinned to the page edges (`Hud`).
- **Custom cursor** — a precise dot and a lagging ring that snaps around interactive targets; CTAs pull toward the pointer (`Magnetic`).
- **Preloader** — a once-per-session boot counter that wipes away.

Type: **Archivo** (one variable family — ultra-condensed caps for display, normal
width for body) and **Fragment Mono** (data and labels). Full **light / dark**
support, plus `prefers-reduced-motion` and touch fallbacks throughout.

## Stack

| | |
| --- | --- |
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS v4 + centralized CSS design tokens |
| **Motion** | Framer Motion · Lenis (smooth scroll) |
| **Tooling libs** | `qrcode`, `jspdf`, `lucide-react` (icons) |
| **Analytics** | Vercel Analytics + Speed Insights |
| **Deploy** | Vercel · Node 26 · no environment variables required |

## Architecture

```text
app/
├─ layout.tsx              # root — fonts, default metadata, providers, global shell
├─ template.tsx            # route transition (rise + fade)
├─ page.tsx                # home — hero, selected work, about teaser, tools teaser
├─ globals.css             # design tokens + the "INDEX" design language
├─ opengraph-image.tsx     # the OG card shared by every page
├─ sitemap.ts · robots.ts  # SEO
├─ not-found.tsx           # 404
├─ about/ · work/ · resume/  # /work/[slug] case studies are generated from lib/projects
├─ lib/
│  ├─ projects.ts          # projects, socials, contact details
│  ├─ tools.ts             # THE tool list — index, home teaser, sitemap, metadata, scripts
│  ├─ seo.ts               # pageMeta() / toolMeta() — per-page title, canonical, OG
│  └─ clipboard.ts         # copyText()
├─ context/ThemeContext.tsx
├─ components/             # Nav, Footer, Hud, Cursor, Preloader, MaskReveal, Reveal,
│                          #   Magnetic, SmoothScroll, ToolLayout, ColorPicker, …
└─ tools/                  # one folder per tool: page.tsx (client) + layout.tsx (metadata)
public/work/               # project screenshots (statically imported → content-hashed)
scripts/                   # headless-Chrome screenshot helpers (see below)
test/                      # checks that run against the built site
```

## Tools

Twelve **100% client-side** utilities — no sign-up, nothing leaves the browser:

`QR Code` · `Color Palette` · `CSS Gradient` · `ASCII Art` · `Halftone` ·
`Image Compressor` · `Images → PDF` · `Pattern Library` · `Generative Bio Art` ·
`Vector Art` · `Color Converter` · `Shape Maker`

**Adding a tool:** add an entry to [`app/lib/tools.ts`](app/lib/tools.ts), create
`app/tools/<slug>/page.tsx`, copy a `layout.tsx` from a sibling tool and change the
slug, then give it an icon in [`app/tools/page.tsx`](app/tools/page.tsx). The index,
home teaser, sitemap and page metadata all pick it up from the list, and `npm test`
fails if the list and the folders drift apart.

## Getting started

Requires **Node 26**.

```bash
npm install
npm run dev      # http://localhost:3000
```

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check with `tsc` |
| `npm test` | Check the built site — run `npm run build` first |

`npm test` reads the prerendered HTML and verifies that every page has its own
title, description, canonical URL and link-preview tags, and that the sitemap
and tool list are complete. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))
runs lint, type-check, build and these checks on every push and pull request.

### Screenshot scripts

The helpers in [`scripts/`](scripts/) drive headless Chrome against a running
production build and write PNGs to `scripts/shots/` (git-ignored):

```bash
npm run build && npx next start -p 3199   # in one terminal
node scripts/shoot-all.mjs                # in another
```

They look for Chrome in its default install location; set `CHROME_PATH` to use a
different browser, or `SHOT_BASE` to point at another server.

## Notes

- **No backend.** Every route is prerendered as static HTML and the tools run
  entirely in the browser.
- **Per-page metadata:** use `pageMeta()` from [`app/lib/seo.ts`](app/lib/seo.ts)
  for any new page. Don't put a canonical URL in a layout — every page beneath
  it would inherit it.
- **Security headers,** including the Content-Security-Policy, live in
  [`next.config.ts`](next.config.ts). Loading anything from a third-party
  origin (a script, font, image or embed) means adding that origin there.
- **Updating a project screenshot:** drop a new PNG in `public/work/<name>.png` and
  rebuild. Images are statically imported, so each gets a content-hashed URL that
  busts caches automatically.
- **Tweaking the look:** everything is driven from the token block at the top of
  [`app/globals.css`](app/globals.css).
