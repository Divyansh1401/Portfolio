# Decision log

| Decision | Status | Value | Date |
|---|---|---|---|
| Code location | decided | `apps/bouquet` subfolder of the `Divyansh1401/Portfolio` repo, kept off Vercel by `/.vercelignore` | 2026-09-24 |
| Build sequencing | decided | Renderer core (P0) first, then the local app | 2026-09-24 |
| Local first | decided | Build and sign off the whole product locally (Node + SQLite) before any Cloudflare work | 2026-09-25 |
| Colours work like design-system modes | decided | Picking a flower sets both the page colours and the bouquet colours | 2026-09-25 |
| Flowers | decided | Five: Rose (free for the first 100 messages) plus Sunflower, Lavender, Marigold and a fourth (Tulip or Hydrangea), each with its own bloom design | 2026-09-25 |
| One design per flower | decided | No Full / Posy / Single stem choice; `SHAPES` is being removed | 2026-09-25 |
| Gifts | decided | Photos (up to 6), link, gift card / code, ticket / file; revealed after the note | 2026-09-25 |
| Countdown | decided | Its own section with an on/off switch and "counting down to" (occasion). Locks **only the gifts**: the bouquet and the note are always open; the gifts stay on the server until the time | 2026-09-25 |
| Quiz (secret question) | decided | Its own "Quiz them first" section. Sits on the recipient's gate; the note and gifts stay on the server until it is answered | 2026-09-25 |
| Payments | decided, pretend checkout built | Pay-what-you-want: ₹30, ₹50, ₹100 or ₹150 in India, $2, $5, $10 or $15 elsewhere, all unlocking the same thing. One payment = one message. No passes, subscriptions or lifetime access. Details in the Bouquet Payment Plan page | 2026-09-25 |
| Pricing | decided, built locally (placement to be rethought) | Sunflower, Lavender, Marigold and the fifth flower paid from day one. Rose free only for the site's first 100 messages (all messages counted); from message 101 every message costs at least ₹30 (or $2 outside India). Limit is a server setting; never affects bouquets already sent | 2026-09-25 |
| Free features | decided | Gifts, countdown and secret question free during the first 100 messages; included in every paid message after that | 2026-09-25 |
| Link lifetime | decided | 1 year for every bouquet | 2026-09-25 |
| Currency outside India | decided, not built | Dollars, starting higher: $2 / $5 / $10 / $15. Country guessed from location (Cloudflare country header; timezone locally), with a manual ₹/$ switch; checkout method settles it (UPI / Indian cards in ₹ via Razorpay, international cards in $). $2 floor because fees eat about a third of $1 | 2026-09-25 |
| Recipient page | decided | A port of the owner's birthday page (`reference/birthday/`): gate, fly-in, scroll-scrubbed dispersal, dome, one word per scroll, countdown, scratch-foil gift card. Same timings, type and motion; colours per flower | 2026-09-25 |
| Font | decided | TAN Mon Cheri (licensed, not in git; `app/fonts/`), Georgia fallback | 2026-09-25 |
| Flower picker | decided | Catalogue of picture cards (a still of each bouquet); no prices in the picker | 2026-09-25 |
| Launch offer | decided | Promo banner: "Rose is free for the first 100 bouquets", meter, "Send a Rose, free" | 2026-09-25 |
| Pricing placement | open | Owner wants to rethink the pricing strategy and where the price appears | 2026-09-25 |
| Timestamps | default | Epoch seconds | 2026-09-24 |
| Fly-in constants | decided | Recipient page: `FLY_MS = 5000`, `turns = 1`, `yawIn = -540` (the birthday page's values). The create page's hero keeps 4200 | 2026-09-25 |
| Fourth flower | blocked-on-owner | Tulip or Hydrangea (default Hydrangea) | 2026-09-25 |
| Email gate | deferred | Decide at the Cloudflare move | 2026-09-25 |
| SVG emitter | default | Deferred | 2026-09-24 |

**Status legend:** `decided` = settled and acted on; `default` = an assumed
value the owner can override; `planned` = agreed but not built;
`blocked-on-owner` = work cannot proceed until the owner answers;
`deferred` = parked until a later step.

Superseded: "v1 cut = 3 variants × 4 palettes × fixed ribbon" (2026-09-24)
was replaced by five flowers with one design each.
