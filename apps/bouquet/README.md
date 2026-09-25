# Bouquet

This folder is the Bouquet product: a voxel-bouquet renderer and the tooling
around it. It lives as a subfolder of the `Divyansh1401/Portfolio` repo for
now, but it is a separate product, not portfolio content.

## What "P0" means here

The build starts with **P0 = the renderer core** — the voxel bouquet
fly-in/dispersal renderer itself (`mount(canvas)`, cell generation, the
per-frame `draw()` pipeline). Everything else (UI shell, variants, palettes,
deployment target) is sequenced after P0 is solid and tested. See
`docs/decision-log.md` for what's been decided vs. still open.

## It must never be served by the portfolio site

`apps/` is listed in the repo-root `.vercelignore`. The portfolio
(`index.html`, `mobile.html`, and everything else at the repo root) is a
static site served by Vercel from the repo root — `.vercelignore` keeps this
folder out of every production and preview deployment of that site. Do not
remove or narrow that entry without understanding why it's there.

## Self-contained by design

Nothing under `apps/bouquet` imports or reads files outside `apps/bouquet` at
runtime. The only link to the portfolio's shipping loader
(`assets/js/bouquet-loader.js`) is a vendored, byte-identical reference copy
at `packages/renderer/reference/bouquet-loader.ref.js` (provenance recorded
alongside it) — that copy is read at build/test time, not fetched from the
portfolio at runtime.

This means the folder can be extracted into its own repository later with:

```sh
git subtree split --prefix=apps/bouquet -b bouquet-extract
```

## Run it locally

The whole product runs on your machine with nothing but Node — no
Cloudflare, no Astro, no external services. Data lives in a local SQLite
file.

```sh
cd apps/bouquet
npm install
npm run dev
```

`npm run dev` builds `styles/modes.css` from `packages/modes/modes.js`,
bundles the three client entry points into `app/dist/`, then starts the
server. It prints the URLs to use:

```
bouquet dev server:
  local:  http://localhost:4321/
  LAN:    http://192.168.x.x:4321/
```

Open the `local` URL on your own machine, or the printed `LAN` URL from a
phone on the **same Wi-Fi** to try the real send → open flow on a phone
screen. `PORT` and `HOST` env vars override the defaults if you need to.

Every bouquet you create is stored in `app/.data/bouquet.sqlite` (plus its
`-wal`/`-shm` files). That folder is git-ignored — it's your local dev
database, not sample content. **Delete `app/.data/` to reset to a clean
slate**; the server recreates it on next start.

### Running tests

```sh
npm test
```

`npm test` runs `node --test` over every `packages/**/test/**/*.test.mjs`
and `app/test/**/*.test.mjs` file — the renderer/modes/shapes packages and
the server/client app together.

Other scripts:

- `npm run build:css` — regenerate `app/styles/modes.css` from `modes.js`
  (also run automatically by `npm run dev`).
- `npm run build:client` — bundle `app/client/*.page.js` into `app/dist/`
  (also run automatically by `npm run dev`).
- `npm run goldens` — capture renderer golden frames.
- `npm run secrets` — scan tracked/untracked files under `apps/bouquet` for
  forbidden paths (`node_modules/`, `.dev.vars`, `.wrangler/`) and
  secret-shaped strings.
- `npm run size` — check renderer bundle size.

## The 5 flower themes

Picking a mode on the create page (`/`) recolours the whole page — ground,
text, accent, buttons — as well as the bouquet renderer's flower/ribbon
colours. Full token tables are in
[`packages/modes/README.md`](packages/modes/README.md); the headline colours:

| Mode | Petals (deep → light) | Ground | Accent |
|---|---|---|---|
| Rose (default) | `#C41E5A` → `#FFB3C6` | `#FBF1F3` | `#C41E5A` |
| Sunflower | `#E0A000` → `#FFD84D` | `#FFF8E1` | `#F5C518` |
| Lavender | `#6B4AA8` → `#C9B6EC` | `#F5F1FB` | `#6B4AA8` |
| Marigold | `#D9531A` → `#FFB347` | `#FFF3E6` | `#C4530F` |
| Hydrangea | `#2F5FA8` → `#A9C6F0` | `#F0F5FC` | `#2F5FA8` |

See the screenshots below for what each looks like end to end.

## The 3 shapes

Defined in `packages/renderer/src/shapes.js`:

- **Full** — today's default bouquet: the full dome of blooms, collar,
  wrapped handle and bow.
- **Posy** — a smaller, rounder hand-tied bunch: roughly half the blooms on
  a smaller dome, with the collar/handle scaled down to match.
- **Stem** — a single bloom (or a few) on a tall stem, with no collar (or a
  tiny one).

## Screenshots

Captured with `playwright-core` at a 390×844 phone viewport, one per mode:
the create page (`docs/screens/create-<mode>.jpg`) and a recipient page
after opening (`docs/screens/recipient-<mode>.jpg`). Opening a bouquet
disperses the flower away to reveal the note underneath, so the "revealed"
shots show the note card on that mode's background, not the bouquet itself.

| Mode | Create page | Opened bouquet |
|---|---|---|
| Rose | ![Rose create page](docs/screens/create-rose.jpg) | ![Rose opened](docs/screens/recipient-rose.jpg) |
| Sunflower | ![Sunflower create page](docs/screens/create-sunflower.jpg) | ![Sunflower opened](docs/screens/recipient-sunflower.jpg) |
| Lavender | ![Lavender create page](docs/screens/create-lavender.jpg) | ![Lavender opened](docs/screens/recipient-lavender.jpg) |
| Marigold | ![Marigold create page](docs/screens/create-marigold.jpg) | ![Marigold opened](docs/screens/recipient-marigold.jpg) |
| Hydrangea | ![Hydrangea create page](docs/screens/create-hydrangea.jpg) | ![Hydrangea opened](docs/screens/recipient-hydrangea.jpg) |

## Chromium

Tests and tooling that need a real browser use `playwright-core` (already a
devDependency) pointed at the Chromium binary that's already installed on
this machine:

```js
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--disable-gpu', '--no-sandbox'],
});
```

**Never run `playwright install` or otherwise download browsers.** The
pinned `executablePath` above is the only Chromium this project uses.
