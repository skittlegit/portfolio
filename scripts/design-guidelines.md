# Design guidelines (reusable)

A reusable design brief for a site-wide visual & motion overhaul. Paste it into
Claude Code in any repo, optionally adding reference links where indicated. Pair
it with [engineering-guidelines.md](engineering-guidelines.md), which covers the
scope rules and the build → verify process that keep this safe.

Redesign the LOOK and FEEL of this site so it's fluid, smooth, and visually
distinctive — the level of craft you'd see on an awwwards winner. This is a
reskin and motion overhaul, NOT a rebuild. Work autonomously end-to-end:
research → define → build → verify with screenshots → iterate.

## Research before designing

- First understand what this site IS — its purpose, audience, and tone — and let
  the design direction serve that, not a generic aesthetic.
- Study 2–3 strong reference sites in this site's category (from awwwards /
  godly.website / land-book — plus these if given: `[links]`). Fetch them AND
  screenshot them with headless Chrome; extract concrete moves — type scale,
  layout signatures, motion patterns, chrome details — not vibes.
- Name specifically what makes the current site feel generic or template-like.
- Write a short design-language spec before touching code, and document it as a
  comment at the top of the global stylesheet so the system stays legible later.

## Define one coherent design language

- It must NOT look AI-made. Banned: violet-to-blue gradients on white,
  glassmorphism, rounded-2xl cards with soft drop shadows, emoji in UI, default
  AI fonts (Inter/Space Grotesk-likes), the generic "hero + 3 feature cards"
  shape, marquees/tickers.
- Typography is the identity. Pick ONE distinctive variable font for display +
  body — and actually use its axes (width/optical) so display and body feel
  related but distinct — plus at most one secondary face (e.g. a characterful
  mono for metadata/labels) if it suits the site. Two families max.
- Palette: flat, confident fields. ONE accent color on less than ~5% of the
  surface. If the site has an existing brand color, keep it (tune the shade)
  rather than replacing it. If a light/dark theme toggle exists, keep it working
  — persisted and applied pre-paint to avoid flash. No gradient meshes; subtle
  film grain is fine. One corner-radius decision, applied everywhere.
- Pick 2–3 layout signatures appropriate to THIS site and repeat them on every
  page so it feels authored — e.g. oversized display headings, hairline rules
  with small index/metadata labels, edge-pinned chrome details, consistent hover
  treatments. Every fixed element (nav, footers, overlays) must share the exact
  same horizontal gutters as the content — same classes, not parallel `clamp()`
  values.
- Put every color/space/easing decision in shared tokens (CSS custom properties)
  so the whole system tunes from one place.

## Motion system — fluid, never jittery

- Smooth scrolling (Lenis or equivalent) and ONE primary easing curve: expo-out
  `cubic-bezier(0.16, 1, 0.3, 1)`. Every transition in the site uses the same
  curve family and duration scale.
- Signature entrance: line-mask reveals — text rises out of an overflow-hidden
  crop, staggered ~80ms per line. Gotcha: the in-view observer must sit on the
  OUTER crop element, not the translated child (a child translated outside an
  `overflow: hidden` parent never intersects, so it never fires).
- Route-level page transition (a quiet rise + fade on every navigation).
- Hover micro-interactions where they fit: fills that rise from an edge, images
  that scale slowly inside their frames, magnetic primary CTAs, persistent accent
  underline for the current nav item (plus `aria-current`).
- Optional, only if it suits the site's character: a brief once-per-session
  preloader (sessionStorage-gated, ~1s) and a custom cursor (precise dot + thin
  trailing ring that snaps tight and fills with the accent over targets — no
  label text, hidden on touch).
- Honor `prefers-reduced-motion` everywhere: render content static, hide any
  custom cursor, kill animations.
