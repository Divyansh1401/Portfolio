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
| Payments | planned, not built | Rose free; "buy me a tea / coffee / brownie" unlocks other flowers and extras per bouquet; details in the Bouquet Payment Plan page | 2026-09-25 |
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
