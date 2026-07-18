# Project Index — Divyansh Rastogi Portfolio

**Goal:** get hired as a product designer. **Stack:** hand-written HTML/CSS/JS,
no build step. **Live at:** https://www.divyanshrastogi.in (GitHub Pages,
repo `Divyansh1401/Portfolio`, branch `main`).

> Rewritten 2026-07-16. The previous index described the pre-rework site
> (Montserrat, alter-ego.html, standalone prototype screens) — all gone.

## Architecture: two files + viewport router

| File | Serves | Notes |
|---|---|---|
| `index.html` | Desktop, viewport ≥ 1024px | The whole desktop site: light world + dark "alter ego" world + all overlays, one file. |
| `mobile.html` | Phones/tablets, < 1024px | The "pocket feed". Separate document, same design language. |

Each page's first `<head>` script `location.replace`s to the other across the
1024px line (debounced resize, mutually exclusive — no loop) **and forwards
`location.hash`**, so deep links survive the bounce in both directions.

## Deep links (hash router in index.html)

`#settlr` · `#refer-earn` (case-study overlays) · `#resume` (resume overlay) ·
`#hobbies` (dark world) · `#photo-N` (dark world + photography lightbox at
photo N) · `#kinko` (scrolls to the locked NDA card) · `#connect` (native
anchor). Back/Forward open/close overlays correctly; the polaroid flip and
lightbox keep the URL shareable via `replaceState`. Mobile maps `#resume` to
the hero actions and `#hobbies` / `#photo-N` to the after-hours feed
(non-persisting).

## Key systems in index.html (top → bottom of file)

- **Fonts**: local variable WOFF2 (Unbounded 200–900, PJS 200–800 + italic),
  TTF fallback, preloaded.
- **Custom cursor**: dot + lagging ring;
  disabled entirely under reduced motion (native cursor restored via CSS).
- **Card Stack engine** (`initCardStack`): sticky ScrollStack used by Featured
  (light) and Films (dark).
- **Hero**: toolbar rail · fit-to-width name (`scaleName()`) · polaroid
  (`#heroPolaroid`, keyboard-operable) that flips worlds via
  `playEgoTransition` → `setAlterEgoMode`. The nav also carries a persistent
  Work / After-hours segmented toggle (`.world-seg`, buttons classed
  `flip-trigger-btn`) whose active side is kept in sync with
  `#main-nav.is-dark` via a `MutationObserver`.
- **Receipt footers** (`initReceiptFooter`, one per world): print-on-scroll,
  scratch-off foil (ResizeObserver re-draws the dark one when it becomes
  visible), stamp, confetti.
- **Case-study overlays**: templates in the `caseStudies` object, injected
  into `#overlayBody` with lazy/async images; focus-trapped dialog; Settlr
  embeds the live SPA prototype (`prototype/settlr/`) + component playground.
- **Resume overlay**: Google Drive preview iframe, lazy src.
- **Dark world**: film stack (YouTube maxres covers) · 3D photography rotor
  (42 lazy images; render loop gated on visibility) · art section · dark
  receipt footer.

## Support directories

| Path | What |
|---|---|
| `assets/images/…` | All imagery (hero, settlr, refer-earn, kinko, small-cards, photography, Cyanotype, hydrone, watch, og-image.png) |
| `fonts/` | Unbounded + Plus Jakarta Sans (woff2 + ttf) |
| `prototype/settlr/` | Offline mirror of the Settlr SPA (seed-data mode; icons/ deliberately excluded — phosphor imports removed from `tokens/index.css`) |
| `projects/`, `.claude/`, `kinko-design-system-report.md` | **Local-only** (gitignored, scrubbed from git history 2026-07-16) |
| `serve.json` | Local server config: `cleanUrls:false` + root rewrite so `npx serve` matches GitHub Pages behavior (keeps the prototype's `<base>` shim race-free) |

## Verification

Headless Puppeteer scripts (require from `/Desktop/settlr/node_modules`) —
see session scratchpads / project memory: `verify-deeplinks.js` (20 checks),
`verify-kbd-meta.js` (16 checks), `fingerprint.js` (computed-style snapshot
across light/dark/overlay states). The in-app browser pane throttles rAF and
cannot drive this site — always verify headless.

## Deployment

GitHub Pages from the repo root. ⚠️ History was rewritten on 2026-07-16
(sensitive files scrubbed): **the next push must be
`git push --force-with-lease origin main`** — after that, normal pushes.
All pushes are held until the project thumbnails are final.
