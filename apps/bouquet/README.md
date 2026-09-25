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

## Running tests

```sh
cd apps/bouquet
npm install
npm test
```

`npm test` runs `node --test` over `packages/renderer/test/**/*.test.mjs`.

Other scripts:

- `npm run goldens` — capture renderer golden frames.
- `npm run secrets` — scan tracked/untracked files under `apps/bouquet` for
  forbidden paths (`node_modules/`, `.dev.vars`, `.wrangler/`) and
  secret-shaped strings.
- `npm run size` — check renderer bundle size.

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
