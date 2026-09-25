# Roadmap

Living versions of these plans (with comments) are the Bouquet User Flow,
Bouquet Build Plan and Bouquet Payment Plan pages. This file is the in-repo
summary. Updated 2026-09-25.

## Done

| Step | What | Commit |
|---|---|---|
| S0 | `.vercelignore` for `/apps`; self-contained product folder | `ff207a1` |
| P0 | Renderer split into core / painter / driver with exact parity to the portfolio loader; one paint per frame; resize fix | `de96a25` |
| Local app 1 | Five flower colour themes; ribbon colour; Node + SQLite server; recipient and sent pages | `892b80b` |
| Local app 2 | Create page, preview, create link; end-to-end and accessibility tests; screenshots | `ae17a25` |

## Next, in order

1. **One design per flower.** Remove the Full / Posy / Single stem choice from the renderer, pages, API and database.
2. **Gifts, countdown, secret question.** Photos (6), link, gift card, ticket/file; date lock with countdown and calendar link; secret question; security tests.
3. **Four new flowers.** One bloom design each, approved on a contact sheet.
4. **Pricing phases + pay-what-you-want with a pretend checkout.** Phase setting on the server (first 100 messages free → Rose free, four flowers paid → all paid, ₹30 minimum). Paid-flower badges, a sheet with ₹30 / ₹50 / ₹100 / ₹150 (every amount unlocks the same), one payment per message checked on the server, draft → paid → live, "Send it as Rose, free".
5. **Local polish and sign-off.** Recipient layout after the scatter, final colours, 5-friend phone test.
6. **Move to Cloudflare.** Workers + D1 + R2, domain, link-preview images, email gate if wanted.
7. **Real payments.** Razorpay (India) and Stripe (elsewhere), webhooks, receipts, legal pages.
8. **Launch.** Analytics funnel, device checks, landing pages.

## How steps are built

Opus plans with fixed interfaces; Sonnet builders work in parallel waves on
separate files; an Opus review gate runs the tests itself after each wave;
the result is re-tested, committed and pushed to `claude/happy-cerf-lelucw`.
The bar: full `npm test` green, zero console errors, renderer parity intact,
nothing outside `apps/bouquet` changed.

## User flow (summary)

- **Sender (`/`):** pick a flower (page and bouquet change colour together) → write a note → optional gift, open-on-date, secret question → preview → create link (paid choices open the "buy me a" sheet) → sent page.
- **Recipient (`/b/<id>`):** countdown if date-locked → secret question if set → fly-in → hold / scroll / Open → note → gifts → "Send one back".
- **Sent (`/b/<id>/sent`):** copy / share / WhatsApp, what's inside, locked / not opened / opened status.
