# Design System — divyanshrastogi.in

> Rewritten 2026-07-16 to match the shipped site. The previous version of this
> file documented the retired Montserrat/pill-button design and must not be
> used as reference for anything.

## Typography

| Role | Face | Notes |
|---|---|---|
| Display / name / headings | **Unbounded** (variable, 200–900) | Local: `fonts/Unbounded/Unbounded-VariableFont_wght.woff2` (ttf fallback). Hero name is fit-to-width via JS (`scaleName()`), so Unbounded's metrics are load-critical — it is `<link rel="preload">`ed on both pages. |
| Body / UI | **Plus Jakarta Sans** (variable, 200–800, + italic) | Local woff2 + ttf fallback. |
| Receipt (footer) | ui-monospace stack (Menlo/Consolas) | Intentional platform-mono look. |
| Side panels (`.overlay-body`, `.resume-panel`) | PJS body + Unbounded headings | |

Nohemi and Montserrat are **gone** — no references anywhere. `fonts/` holds the
only shipped faces.

## Color tokens (`:root` in index.html)

Two generations of tokens are currently **both live**:

```css
/* Current generation — hero, receipt, footer, focus states */
--bg:     #F5F3EE;   /* page background */
--text:   #0C0C0B;   /* primary ink */
--orange: #E06B2D;   /* accent (deeper orange) */
--grey:   #808080;   /* muted text — fails AA on --bg at small sizes, pending fix */

/* Legacy generation — case-study overlay + cursor still use these */
--c-dark: #1B1C1A;  --c-dark2: #2E2F2D;  --c-dark3: #444541;
--c-light: #F2F0F0; --c-mid: #888886;   --c-surface: #E6E4E4;
--c-orange: #EA7623; /* brand orange (brighter) */
```

⚠️ **Two oranges ship today** (`#E06B2D` hero/footer vs `#EA7623` overlays).
Consolidation is a pending design decision — do not "fix" one to the other
without the owner's call.

Dark world (alter ego) base ≈ `#0D0E0C`, ink `#EDECEA` — mostly hardcoded,
not tokenized.

## Radius & spacing

- `--radius-pill: 100px` is the only radius token; everything else is ad-hoc
  (3px polaroid, 26px card-stack, 14px receipt, …). A radius scale is a
  pending cleanup.
- Fluid spacing tokens (used consistently in current sections):
  `--pad-page`, `--pad-section`, `--pad-card`, `--gap-grid`, `--cs-pad`,
  plus per-system `--u` units inside the case-study sheets.
- Side-panel geometry: `--cs-gutter`, `--cs-peek` (collapses 120→40px before
  the sheet shrinks; see the `:root` comments in index.html).

## Buttons (two live systems)

1. **Square uppercase** — `.btn-hero` + `.btn-outline` / `.btn-solid`:
   0 radius, 12px uppercase, clip-path corner accents. Used in nav, hero
   (mobile), and footer (`.rcpt-links` carries twin selectors).
2. **Underline CTA** — `a.cs2-cta`: border-bottom text link with arrow,
   used on featured cards ("View case study →"). Real `<a href="#slug">`
   elements — keep them anchors (keyboard access depends on it).

All previous button systems (pill `.btn-primary`, wave-fill, `.film-card-behance`,
`.rcpt-pill`) were dead CSS and have been purged.

## Motion rules

- `PREFERS_REDUCED_MOTION` (JS media-query object) + CSS blocks cover: custom
  cursor (native cursor restored), polaroid tilt/flip (snap), card stacks
  (static), rotor jelly/chromatic-aberration (zeroed), blob wipe (instant
  world switch), receipt print/stamp/confetti, scroll reveals.
- Every rAF loop must idle: skip style writes when springs settle, and gate
  loops on section visibility (the 3D rotor only renders in the dark world).
  Follow this pattern for any new loop.

## Accessibility patterns in force

- Global `:focus-visible` outline (2px `--orange`) on both pages.
- Overlays are focus-managed dialogs: focus in on open, Tab trapped,
  focus restored on close; same-origin iframes forward Escape.
- `#heroPolaroid` is a `role="button"` with Enter/Space handling and a
  world-aware `aria-label`.
- Known gaps (pending): muted-text contrast, rotor image alts, h2→h4 skip
  in "More work".
