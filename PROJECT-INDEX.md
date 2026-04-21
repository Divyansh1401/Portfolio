# Project Index — Divyansh Rastogi Portfolio

**Goal:** Get hired. Experimental / creative portfolio. Desktop-only for now.
**Stack:** Single-file HTML/CSS/JS, no build step, served with `npx serve -p 3456 .`

---

## Root Files

| File | Purpose |
|------|---------|
| `index.html` | Main light-side portfolio (~3600 lines) |
| `alter-ego.html` | Dark-side alter ego page (filmmaking / photography / art) |
| `design-system.md` | Full design token + typography reference |
| `PROJECT-INDEX.md` | This file |

---

## Page Structure Map

### index.html — Light Side

| Section | Status | Notes |
|---------|--------|-------|
| Nav | ✅ Built | Fixed top; name fades in on scroll; Resume + Let's connect buttons |
| Hero | ✅ Built | Polaroid portrait (3D flip → navigates to alter-ego.html); scroll-driven name morph |
| Featured Projects (P1 Kinko, P2 Settlr, P3 Refer & Earn) | ✅ Built | Alternating layout; P3 has parallax BG/FG thumbnail |
| More Work (4 small cards) | ✅ Built | Grayscale → color reveal from cursor; frame parallax |
| CTA Section | ✅ Built | Dark bg, orange glow, mailto link |
| Footer | ✅ Built | 3-col grid; links to LinkedIn / Behance / email |
| Case Study Overlay | ✅ Shell built | Kinko: placeholder content; Settlr: prototype viewer + placeholder copy; Refer & Earn: fully built |
| Resume Overlay | ✅ Built | Google Drive embed + download link |

### alter-ego.html — Dark Side

| Section | Status | Notes |
|---------|--------|-------|
| Nav + Hero | ✅ Built | Same structure as index.html; rotate(-1.2deg) polaroid |
| Filmmaking | ✅ Built | 3 expanding flex cards; hover expands, mouseleave resets to card 0 |
| Photography | ✅ Built | Cursor-driven stacked viewer; horizontal nav line + `<` `>` arrows; gallery overlay |
| Art & More | ✅ Built | 65/35 split layout; A/B crossfade preview; categorised thumbnail panel; autoplay; arrow nav |
| More | 🔲 Placeholder | 3 list items (Music, Writing, Experiments) — content pending |
| Footer | ✅ Built | Dark version; links to section anchors |

---

## File Relationships

```
index.html  ──[polaroid click]──▶  alter-ego.html
                ↕ flip veil (#flipVeil, clip-path circle expand)

index.html  ──[hash routing]──▶  #kinko overlay
                               ──▶  #settlr overlay
                               ──▶  #refer-earn overlay

alter-ego.html ──[no back button yet]──  (use browser back)
```

---

## Asset Map

### In Use Now

| Folder | Files | Used in |
|--------|-------|---------|
| `assets/images/refer-earn/` | 16 images (thumbnail-bg/fg, cover, approach-1/2, infographic-v1/2/3, screen-before/tooltip/final, screen-rummy/poker/adda52, treasure-1/2) | `index.html` Refer & Earn case study |

### Ready for You to Drop In

| Folder | What goes here | Used in |
|--------|---------------|---------|
| `assets/images/hero/` | `portrait.jpg` (3:4 portrait) | Both pages — hero polaroid photo |
| `assets/images/settlr/` | `thumbnail.jpg`, `cover.jpg`, `screen-*.jpg` | index.html Settlr case study |
| `assets/images/kinko/` | `thumbnail.jpg`, `cover.jpg`, `screen-*.jpg` | index.html Kinko case study |
| `assets/images/alter-ego/films/` | `film-01.jpg` to `film-03.jpg` | alter-ego.html Filmmaking section |
| `assets/images/alter-ego/photography/` | `photo-01.jpg` to `photo-08.jpg` (3:4 portrait) | alter-ego.html Photography viewer |
| `assets/images/alter-ego/art/` | `trad-01…06.jpg`, `cyano-01…03.jpg`, `digital-01…04.jpg` | alter-ego.html Art & More section |

Each folder has a `README.md` with exact specs and wiring instructions.

---

## How to Wire Images In (quick reference)

### Hero portrait (both pages)
Replace `.photo-placeholder` with `<img src="assets/images/hero/portrait.jpg" alt="Divyansh Rastogi" class="hero-portrait">` and add `.hero-portrait { width:100%; aspect-ratio:3/4; object-fit:cover; display:block; }`.

### alter-ego.html Photography section
Replace `<div class="photo-fill" style="background:#hex;">` with `<img class="photo-fill" src="assets/images/alter-ego/photography/photo-NN.jpg" alt="" style="object-fit:cover;">` in each `.photo-img-wrap`. Gallery overlay auto-populates from these.

### alter-ego.html Art section
In the `ART_CATS` JS constant, add `src` to each item: `{ bg: '#hex', src: 'assets/images/alter-ego/art/trad-01.jpg' }`. Then update `showItem()` to set an `<img src>` and update the thumbnail HTML in `panel.innerHTML`.

### alter-ego.html Filmmaking section
Inside each `.film-card-poster` div, add `<img src="assets/images/alter-ego/films/film-0N.jpg" style="width:100%;height:100%;object-fit:cover;">`.

---

## Prototype

`prototype/settlr/` — 24 interactive HTML screens + design tokens/CSS/icons (2.2 MB total).

**Featured in Settlr case study (iframe viewer, 6 screens):**
- `home-dashboard.html`
- `group-detail.html`
- `add-split.html`
- `settle-success.html`
- `activity.html`
- `settle-select.html`

All screens are **placeholder/WIP** — update when Settlr design is finalised.

---

## Pending Work (ordered)

- [ ] Drop `portrait.jpg` → `assets/images/hero/`
- [ ] Drop film poster images → `assets/images/alter-ego/films/`
- [ ] Drop photography images → `assets/images/alter-ego/photography/`
- [ ] Drop art thumbnails → `assets/images/alter-ego/art/`
- [ ] Wire all alter-ego images into code (see Asset Map above)
- [ ] Finalise Settlr prototype screens, then update iframes
- [ ] Write Settlr case study copy (replace placeholder text in JS `caseStudies.settlr`)
- [ ] Write Kinko case study copy + drop Kinko assets
- [ ] Add back-navigation / return gesture from alter-ego.html to index.html
- [ ] Antigravity hold-to-peel refinement on index.html hero (reference `_experiments/`)
- [ ] Footer links: wire Kinko + Settlr anchors in footer
- [ ] Responsive layout (after desktop is finalised)
- [ ] Netlify deployment

---

## Experiments (reference only)

`_experiments/index-antigravity.html` — full hold-to-peel SVG mask system (two layers, idle punch, hold to expand).
`_experiments/hero-experiment-antigravity.html` — 3D polaroid tilt + glare + peel on click.

Use these when refining hero interactions. Do not deploy.

---

## Design System

Full reference: `design-system.md`

**Key tokens:**
```
--c-orange: #EA7623    --c-light: #F2F0F0    --c-dark: #1B1C1A
--c-mid: #888886       --c-surface: #E6E4E4  --nav-h: 64px
```

**Dark side (alter-ego.html):**
```
--c-bg: #0D0E0C    --c-bg3: #1C1D19    --c-text: #EDECEA
--c-muted: #7A7975  --c-dim: #3A3B37   --c-accent: #EA7623
```
