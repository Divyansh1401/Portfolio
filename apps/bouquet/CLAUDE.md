# Bouquet

Send someone a voxel bouquet with a note. The sender picks a flower, writes a
note, optionally adds gifts, a countdown and a quiz, and shares a link. The
recipient opens it on a page ported from the owner's birthday page.

Owner: Divyansh Rastogi. Started inside `Divyansh1401/Portfolio`
(`apps/bouquet`, branch `claude/happy-cerf-lelucw`); moved to its own project
on 2026-09-25 with its git history (`git subtree split`).

## Run it

```sh
npm install
npm run dev          # builds CSS + client, serves http://localhost:4321 (and the LAN URL)
npm test             # node --test: renderer parity, modes, pricing, server, a11y + e2e in Chromium
```

Node 22+, no framework, no runtime dependencies: `node:http`, `node:sqlite`
(`app/.data/`, gitignored), esbuild for the client bundles (`app/client/*.page.js`
→ `app/dist/`). The browser suites use `playwright-core`; `scripts/chromium.mjs`
picks the browser: `$CHROMIUM_PATH`, else the cloud box's
`/opt/pw-browsers/chromium-1194/...`, else your installed Google Chrome. Never
`playwright install`.

`BQ_FREE_LIMIT=0 npm run dev` shows the "free Roses used up" state.

## Map

- `packages/renderer` — the voxel bouquet (v6 from the birthday experiment),
  pure core + canvas painter, byte-parity with the portfolio loader
  (`reference/bouquet-loader.ref.js`, goldens in `test/goldens`). Do not
  "tidy" float expression order: parity tests will catch it.
- `packages/modes` — the five flowers (Rose, Sunflower, Lavender, Marigold,
  Hydrangea): bouquet palettes + UI tokens; `scripts/build-mode-css.mjs` →
  `app/styles/modes.css`.
- `packages/pricing` — free flower, free limit (100), amounts
  (₹30/50/100/150, $2/5/10/15), currency guess.
- `app/server` — `index.js` (routes), `db.js` (SQLite, all data access),
  `gifts.js` (validation, file sniffing, secret hashing, tokens, limiter),
  `text.js`, `ids.js`.
- `app/pages` + `app/client` + `app/styles` — `create` (sender), `bouquet`
  (recipient, also `/preview`), `sent` (share + receipt), `wilted` (404).
- `reference/birthday/birthday.html` — the design source for the recipient
  page (QR removed). Its timings/copy comments explain every constant.
- `docs/` — `decision-log.md` (what is decided), `ROADMAP.md`, `A11Y.md`.

## How it works now

- **Sender (`/`)**: live bouquet hero (sticky on desktop), launch promo
  banner, flower catalogue cards (no prices), note + from, "Make it special"
  (gifts), "Countdown" (switch + occasion + date/time), "Quiz them first".
  Preview = the real recipient page in a full-screen frame (`/preview`,
  postMessage, nothing saved). Create → paid flowers save a draft
  (`202 needs_payment`) → pay-what-you-like sheet → **pretend checkout**.
- **Recipient (`/b/:id`)**: white gate + "open" (quiz here if set) → 5 s
  fly-in → scroll: hold, disperse, dome swells, note one word per scroll,
  "from <name>", countdown "until <occasion>", then at zero the scratch-foil
  card with the first gift (tilt, confetti, "see all gifts"). No countdown →
  card right after the words. No gifts → ends on "send one back".
- **Locks (server-side)**: quiz keeps note + gifts out of the page until
  answered; countdown keeps only the gifts out until the time
  (`POST /api/bouquet/:id/unlock` returns what is open now). Gift files need
  a signed token when there is a quiz. Links last a year from going live.

## Open / next

- Rethink pricing strategy and where the price shows (owner, open).
- Fourth-flower call: Tulip or Hydrangea (default Hydrangea); own bloom
  designs per flower (today all use the rose bloom recoloured).
- Real payments (Razorpay for ₹, Stripe for $) replacing the pretend checkout.
- Maybe: a "keep it a surprise" link preview (the birthday page used decoy
  "Order Receipt" metadata).
- Later: Cloudflare (Workers + D1) port — SQL is plain SQLite on purpose;
  email gate decided then.

## Rules that bit before

- The font is licensed: `app/fonts/*.woff2|otf` are gitignored. The server
  only declares `@font-face` when the file exists (`/styles/fonts.css`).
- `overflow-x: hidden` on html+body breaks `position: sticky`; base.css uses
  `clip` (hidden as fallback).
- A 4xx logs a console error in every browser, and the bar is zero console
  errors: wrong quiz answers are `200 {wrong:true}`, drafts are `202`.
- Theme colour transitions are 300 ms: tests reading computed colours run
  with reduced motion.
- Commit trailer used so far:
  `Co-Authored-By: Claude …` + `Claude-Session: …` (keep whatever the new
  project's instructions say).
