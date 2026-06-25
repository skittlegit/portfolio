# Engineering guidelines (reusable)

The scope rules and quality process for a site-wide visual & motion overhaul.
Paste it into Claude Code alongside [design-guidelines.md](design-guidelines.md),
which covers the visual and motion direction. These rules keep a reskin from
turning into a regression.

## Hard rules — scope and preservation

- Do NOT remove or break any functionality. Every existing route, page, feature,
  form, flow, and interactive behavior must work exactly as before.
- Do NOT add or delete pages, change the information architecture, or restructure
  user flows unless I explicitly ask.
- Do NOT rewrite, trim, or invent content. All copy, data, claims, and numbers
  stay as they are — you may re-set them typographically, never alter their
  meaning.
- Restyle through shared tokens and class contracts wherever possible so
  functional components inherit the new look without logic changes. If a
  component must be touched, change its presentation only.
- Build and lint must pass at every checkpoint; if something functional
  regresses, fix it before moving on.

## Process discipline (non-negotiable)

- Production build AND lint must pass clean before claiming anything.
- VERIFY VISUALLY: run the production server, screenshot every page with headless
  Chrome — desktop, mobile width, every theme, and hover states (move the mouse
  in the headless browser to capture them). Read the screenshots and critique
  them like a design director; fix, re-shoot, repeat. Never claim done from code
  alone.
- Smoke-test the functionality you restyled: click through the key flows in the
  headless browser and confirm they still behave (forms submit, toggles toggle,
  links resolve).
- Dedicated mobile pass: display type must still hit both gutters on phones (size
  it separately below the `sm` breakpoint); no dead viewport space; fixed chrome
  must never collide with content — cap hero-scale type with `svh` so the first
  fold always fits.
- Known traps: inline style colors defeat `:hover` CSS (keep stateful colors in
  classes); transforms on ancestors break `position: fixed` descendants; theme
  must be set pre-paint and persisted without the writer stomping the stored
  value on mount.
- Accessibility throughout: skip link, visible focus rings, semantic headings,
  alt text, `aria-current`.

Iterate until the site looks award-level — while behaving exactly as it did
before.
