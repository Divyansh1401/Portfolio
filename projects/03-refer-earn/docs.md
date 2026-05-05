# Refer & Earn — Project Documentation
> All documentation for the Refer & Earn case study (Head Digital Works · A23 Games).

---

## Project Meta
- **Company**: Head Digital Works · A23 Games
- **Project trigger**: `data-project="refer-earn"` (homepage case study overlay)
- **Status**: Case study built in index.html. Homepage thumbnail fully implemented.

---

## Homepage Card
| Field | Value |
|-------|-------|
| Label | 03 |
| Title | Refer & Earn |
| Company | Head Digital Works · A23 |
| Thumbnail | `thumbnail.webp` (single image, full bleed) |

### Thumbnail
- Single image at `assets/images/refer-earn/thumbnail.webp`, set as `<img class="exp-card-img">` inside the homepage Featured Projects card.
- Replaces the earlier layered BG/FG parallax approach (those `thumbnail-bg.png` / `thumbnail-fg.png` files are no longer used).

---

## Image Assets
All in `/Users/divyanshrastogi/Desktop/Website/assets/images/refer-earn/`

### ✅ In use (linked in index.html; all verified loading)

| File | Where used |
|------|------------|
| `thumbnail.webp` | Homepage Featured Projects card (single image, replaced 2026-05-05) |
| `cover.webp` | Case study hero image, top of overlay (replaced 2026-05-05) |
| `approach-1.png` | Ideation: Approach 1 — Minimal UI + Gamification Layer |
| `approach-2.png` | Ideation: Approach 2 — Contextual Primary CTA |
| `infographic-v1.png` | Iteration: infographic structure v1 (light list) |
| `infographic-v2.png` | Iteration: infographic structure v2 (dark two-column grid) |
| `infographic-v3.png` | Iteration: infographic structure v3 — selected (dark numbered steps) |
| `screen-before.png` | Before/After section — original screen |
| `screen-tooltip.png` | Before/After section — tooltip state |
| `screen-final.png` | Before/After section — final redesign |
| `screen-rummy.png` | Multi-brand: A23 Rummy variant |
| `screen-poker.png` | Multi-brand: A23 Poker variant |
| `screen-adda52.png` | Multi-brand: Adda52 variant |
| `treasure-1.png` | Treasure Referrals dark section — chest modal mockup |
| `treasure-2.png` | Treasure Referrals dark section — contacts list mockup |

### 🗂 In folder, not yet wired up

| File | Likely purpose |
|------|----------------|
| `deep-dive.png` | Deep-dive / research section asset |
| `final-dark.png` | Final design on dark background |
| `iterations-1.png` | Design iteration round 1 |
| `iterations-2.png` | Design iteration round 2 |
| `iterations-3.png` | Design iteration round 3 |
| `key-challenges.png` | Key challenges diagram |
| `re-banner.png` | Refer & Earn banner asset |
| `screen-referred.png` | Post-referral / referred user screen |
| `screen-rummy-alt.png` | A23 Rummy alternate variant |
| `solution-space.png` | Solution space / opportunity map |
| `three-brands.png` | Three-brand overview image |
| `treasure-referrals.png` | Treasure Referrals hero or overview |
| `wireframes.png` | Wireframe explorations |

---

## Case Study — Built Sections (all verified in preview)

### Hero
- `cover.webp` — full-width banner at top of overlay

### The Challenge
- Stats + copy (no images)

### Research — Three Lenses
- User quotes + IA Audit / PRD Alignment / Hallway Testing cards (no images)

### Ideation — Two Approaches
- `approach-1.png` — Minimal UI + Gamification Layer
- `approach-2.png` — Contextual Primary CTA

### Iteration — Infographic Structure
- `infographic-v1.png` — v1 light list
- `infographic-v2.png` — v2 dark two-column grid
- `infographic-v3.png` — v3 dark numbered steps (selected)

### Design Decisions
- Stats / copy blocks (no images)

### Before / After
- 3-column grid: `screen-before.png` | `screen-tooltip.png` | `screen-final.png`
- "BEFORE" label: `grid-column: 1` | "AFTER" label: `grid-column: 2 / 4`
- Static, no animation

### Multi-Brand
- Three phones: `screen-rummy.png` | `screen-poker.png` | `screen-adda52.png`

### Treasure Referrals (Dark Section — `.cs-dark-section`)
Single-column stacked:
1. `.cs-tag` chip
2. `h2.cs-section-title`
3. `.cs-dark-desc` — `font-size: 16px; opacity: 0.6; max-width: 60ch`
4. `.cs-treasure-mockups` — `treasure-1.png` + `treasure-2.png` side by side
5. `.cs-treasure-points` — 3-col grid with top border: Gamified Growth · Retention Loop · Discovery via Randomisation

---

## Case Study Copy (current in index.html)
> To be updated when final copy is written.

- Case study is accessed at hash `#refer-earn`
- Content defined in `caseStudies['refer-earn']` JS object in index.html

---

## What's Still Needed
- [ ] Final written copy for all case study sections (user to write)
- [ ] Any additional screen exports if needed
