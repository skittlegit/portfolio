# Site visual & motion overhaul prompt (reusable)

Paste everything below into Claude Code in any repo. Optionally add reference links where indicated.

---

Redesign the LOOK and FEEL of this site so it's fluid, smooth, and visually distinctive — the level of craft you'd see on an awwwards winner. This is a reskin and motion overhaul, NOT a rebuild. Work autonomously end-to-end: research → define → build → verify with screenshots → iterate.

## 0. Hard rules — scope and preservation

- Do NOT remove or break any functionality. Every existing route, page, feature, form, flow, and interactive behavior must work exactly as before.
- Do NOT add or delete pages, change the information architecture, or restructure user flows unless I explicitly ask.
- Do NOT rewrite, trim, or invent content. All copy, data, claims, and numbers stay as they are — you may re-set them typographically, never alter their meaning.
- Restyle through shared tokens and class contracts wherever possible so functional components inherit the new look without logic changes. If a component must be touched, change its presentation only.
- Build and lint must pass at every checkpoint; if something functional regresses, fix it before moving on.

## 1. Research before designing

- First understand what this site IS — its purpose, audience, and tone — and let the design direction serve that, not a generic aesthetic.
- Study 2–3 strong reference sites in this site's category (from awwwards / godly.website / land-book — plus these if given: <links>). Fetch them AND screenshot them with headless Chrome; extract concrete moves — type scale, layout signatures, motion patterns, chrome details — not vibes.
- Name specifically what makes the current site feel generic or template-like.
- Write a short design-language spec before touching code, and document it as a comment at the top of the global stylesheet so the system stays legible later.

## 2. Define one coherent design language

- It must NOT look AI-made. Banned: violet-to-blue gradients on white, glassmorphism, rounded-2xl cards with soft drop shadows, emoji in UI, default AI fonts (Inter/Space Grotesk-likes), the generic "hero + 3 feature cards" shape, marquees/tickers.
- Typography is the identity. Pick ONE distinctive variable font for display + body — and actually use its axes (width/optical) so display and body feel related but distinct — plus at most one secondary face (e.g. a characterful mono for metadata/labels) if it suits the site. Two families max.
- Palette: flat, confident fields. ONE accent color on less than ~5% of the surface. If the site has an existing brand color, keep it (tune the shade) rather than replacing it. If a light/dark theme toggle exists, keep it working — persisted and applied pre-paint to avoid flash. No gradient meshes; subtle film grain is fine. One corner-radius decision, applied everywhere.
- Pick 2–3 layout signatures appropriate to THIS site and repeat them on every page so it feels authored — e.g. oversized display headings, hairline rules with small index/metadata labels, edge-pinned chrome details, consistent hover treatments. Every fixed element (nav, footers, overlays) must share the exact same horizontal gutters as the content — same classes, not parallel clamp() values.
- Put every color/space/easing decision in shared tokens (CSS custom properties) so the whole system tunes from one place.

## 3. Motion system — fluid, never jittery

- Smooth scrolling (Lenis or equivalent) and ONE primary easing curve: expo-out `cubic-bezier(0.16, 1, 0.3, 1)`. Every transition in the site uses the same curve family and duration scale.
- Signature entrance: line-mask reveals — text rises out of an overflow-hidden crop, staggered ~80ms per line. Gotcha: the in-view observer must sit on the OUTER crop element, not the translated child (a child translated outside an overflow:hidden parent never intersects, so it never fires).
- Route-level page transition (a quiet rise + fade on every navigation).
- Hover micro-interactions where they fit: fills that rise from an edge, images that scale slowly inside their frames, magnetic primary CTAs, persistent accent underline for the current nav item (plus aria-current).
- Optional, only if it suits the site's character: a brief once-per-session preloader (sessionStorage-gated, ~1s) and a custom cursor (precise dot + thin trailing ring that snaps tight and fills with the accent over targets — no label text, hidden on touch).
- Honor prefers-reduced-motion everywhere: render content static, hide any custom cursor, kill animations.

## 4. Process discipline (non-negotiable)

- Production build AND lint must pass clean before claiming anything.
- VERIFY VISUALLY: run the production server, screenshot every page with headless Chrome — desktop, mobile width, every theme, and hover states (move the mouse in the headless browser to capture them). Read the screenshots and critique them like a design director; fix, re-shoot, repeat. Never claim done from code alone.
- Smoke-test the functionality you restyled: click through the key flows in the headless browser and confirm they still behave (forms submit, toggles toggle, links resolve).
- Dedicated mobile pass: display type must still hit both gutters on phones (size it separately below the sm breakpoint); no dead viewport space; fixed chrome must never collide with content — cap hero-scale type with svh so the first fold always fits.
- Known traps: inline style colors defeat :hover CSS (keep stateful colors in classes); transforms on ancestors break position:fixed descendants; theme must be set pre-paint and persisted without the writer stomping the stored value on mount.
- Accessibility throughout: skip link, visible focus rings, semantic headings, alt text, aria-current.

Iterate until the site looks award-level — while behaving exactly as it did before.
