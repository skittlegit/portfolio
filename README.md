# Portfolio

Personal portfolio and creative tools site — built with Next.js 16, React 19, and Tailwind CSS v4.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animation:** GSAP + Framer Motion + Lenis (smooth scroll)
- **Auth & DB:** Supabase
- **Analytics:** Vercel Analytics + Speed Insights
- **Deployment:** Vercel

## Project Structure

```
app/
+-- page.tsx              # Home — hero, projects, about, contact
+-- layout.tsx            # Root layout with theme & auth providers
+-- globals.css           # Global styles
+-- context/
¦   +-- ThemeContext.tsx  # Dark/light mode
¦   +-- AuthContext.tsx   # Supabase auth state
+-- components/           # Shared UI components
+-- tools/                # Creative tools suite
    +-- ascii-art/
    +-- color-converter/
    +-- generative-art/
    +-- gradient-generator/
    +-- halftone/
    +-- image-compressor/
    +-- images-to-pdf/
    +-- logo-maker/
    +-- palette-generator/
    +-- pattern-library/
    +-- qr-code/
    +-- vector-art/
lib/                      # Supabase helpers, utilities
public/                   # Static assets
proxy.ts                  # Dev proxy config
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
