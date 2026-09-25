# Decision log

| Decision | Status | Value | Date |
|---|---|---|---|
| Code location | decided | `apps/bouquet` subfolder of the `Divyansh1401/Portfolio` repo, kept off Vercel by `/.vercelignore` | 2026-09-24 |
| Build sequencing | decided | Renderer core (P0) first, then the local app | 2026-09-24 |
| Local first | decided | Build and sign off the whole product locally (Node + SQLite) before any Cloudflare work | 2026-09-25 |
| Colours work like design-system modes | decided | Picking a flower sets both the page colours and the bouquet colours | 2026-09-25 |
| Flowers | decided | Five: Rose (free) plus Sunflower, Lavender, Marigold and a fourth (Tulip or Hydrangea), each with its own bloom design | 2026-09-25 |
| One design per flower | decided | No Full / Posy / Single stem choice; `SHAPES` is being removed | 2026-09-25 |
| Gifts | decided | Photos (up to 6), link, gift card / code, ticket / file; revealed after the note | 2026-09-25 |
| Countdown | decided | Date + time lock set by the sender; note and gifts stay on the server until then | 2026-09-25 |
| Secret question | decided | Optional question the recipient answers before opening | 2026-09-25 |
| Payments | decided, not built | Rose free. Other flowers are pay-what-you-want: ₹30, ₹50, ₹100 or ₹150, all unlocking the same thing. One payment = one message. No passes, subscriptions or lifetime access. Details in the Bouquet Payment Plan page | 2026-09-25 |
| Pricing phases | decided, not built | Phase 1: first 100 messages on the site free (all flowers). Phase 2: Rose free, four flowers paid. Phase 3 (if it takes off): every message at least ₹30, Rose included. A server setting, not a code change; never affects bouquets already sent | 2026-09-25 |
| Free features | decided | Gifts, countdown and secret question free in phases 1–2; included in every paid message in phase 3 | 2026-09-25 |
| Link lifetime | decided | 1 year for every bouquet | 2026-09-25 |
| Currency outside India | blocked-on-owner | Dollar amounts, or India only at first | 2026-09-25 |
| Timestamps | default | Epoch seconds | 2026-09-24 |
| Fly-in constants | default, owner to confirm | `flyMs = 4200`, `yawIn = -540`, `turns = 1` | 2026-09-24 |
| Fourth flower | blocked-on-owner | Tulip or Hydrangea (default Hydrangea) | 2026-09-25 |
| Email gate | deferred | Decide at the Cloudflare move | 2026-09-25 |
| SVG emitter | default | Deferred | 2026-09-24 |

**Status legend:** `decided` = settled and acted on; `default` = an assumed
value the owner can override; `planned` = agreed but not built;
`blocked-on-owner` = work cannot proceed until the owner answers;
`deferred` = parked until a later step.

Superseded: "v1 cut = 3 variants × 4 palettes × fixed ribbon" (2026-09-24)
was replaced by five flowers with one design each.
