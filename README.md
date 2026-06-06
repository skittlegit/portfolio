# bydeepak.com

Personal portfolio + creative tools — a radical angular/editorial redesign built with Next.js 16, React 19, and Tailwind CSS v4.

The site **is** the portfolio piece: a near-brutalist, near-monochrome system with a single violet accent and a custom motion language ("TELEMETRY") — a schematic/instrumentation concept applied to the preloader, cursor, background, reveals, and interaction states. The motion concept is documented in the comment block at the top of [`app/globals.css`](app/globals.css), which is also the central design-token file (colour, type, spacing, motion easings/durations).

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4, centralized CSS design tokens
- **Type:** Space Grotesk (display/body) · Space Mono (data/labels) · Instrument Serif (accents)
- **Animation:** Framer Motion (primary) · Lenis (smooth scroll) · GSAP (ScrollTrigger helper)
- **Analytics:** Vercel Analytics + Speed Insights
- **Deployment:** Vercel

## Architecture

```
app/
├─ layout.tsx              # Root: fonts, metadata/OG, providers + global shell
├─ template.tsx            # Route transition (opacity crossfade)
├─ page.tsx                # Home — hero, about, stats, work×6, tools teaser, contact
├─ globals.css             # Design tokens + TELEMETRY motion language
├─ opengraph-image.tsx     # Dynamic OG card
├─ sitemap.ts / robots.ts  # SEO
├─ not-found.tsx           # 404
├─ resume/                 # /resume — inline PDF + download (public/resume.pdf)
├─ context/ThemeContext.tsx
├─ components/             # Nav, Cursor, Preloader, Background, Reveal, Magnetic, …
└─ tools/                  # 10 client-side tools, restyled via ToolLayout
```

## Removed in the redesign — Supabase (dead infra)

The site was wired to a Supabase project that nothing actually used. The only
consumers were "Save" buttons in a few tools, all gated behind a logged-in user —
but there is **no login route** in the live app (it lived in `_archive/`), so those
buttons could never persist anything. Per the "no sign-up, no tracking" promise,
all of it was ripped out:

- deps: `@supabase/ssr`, `@supabase/supabase-js`
- files: `lib/` (supabase client/server, `saved-items`, `profile`, `whitelist`, `chat`, `currency`, `env`, `site-url`), `app/context/AuthContext.tsx`, `app/api/wakeup` (DB keep-alive), `proxy.ts` (auth-refresh middleware), the entire `_archive/`
- the Save buttons + `useAuth`/`saveItem` wiring in the 6 tools that referenced them
- Supabase env vars, the `.env.local.example`, and the Supabase image `remotePattern` in `next.config.ts`

Tools remain **100% client-side** (no network, no accounts). The `color-converter`
and `logo-maker` routes still exist and work but aren't featured on `/tools`.

## Getting Started

```bash
npm install
npm run dev   # http://localhost:3000
```

No environment variables are required.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
