# @bouquet/modes

Colour "modes" for the bouquet app: five presets that each recolour both the
bouquet renderer (flower material palette) and the page UI (background,
text, accent, focus, borders). Picking a mode is the whole product-facing
idea: choose yellow, the site's bouquet turns yellow.

`modes.js` exports:

- `MODES` — the 5 modes below, in this order.
- `DEFAULT_MODE` — `'rose'`.
- `MODE_IDS` — `MODES.map(m => m.id)`.
- `getMode(id)` — looks up a mode, falling back to `rose` for an unknown id.
- `triple(hex)` — derives a `[hex, hex×0.78, hex×0.56]` per-channel shading
  triple used by the renderer's lighting.
- `paletteFor(modeOrId)` — the 11-triple renderer material palette for a
  mode (see slot layout below). `paletteFor('rose')` returns the reference
  loader's original 10 triples verbatim for slots 0-9 (byte-identical to
  today's default render), with slot 10 (ribbon) a copy of slot 0.

`lint-modes.mjs` exports `lintModes(modes)` (returns `[]` when every mode
passes) and doubles as a CLI (`node lint-modes.mjs`) that prints a
pass/fail table and exits 1 on any failure. It checks:

- WCAG contrast: `ink`/`ground` ≥ 4.5, `ink`/`surface` ≥ 4.5, `muted`/`ground`
  ≥ 4.5, `onAccent`/`accent` ≥ 4.5, `accent`/`ground` ≥ 3, `focus`/`ground`
  ≥ 3, `border`/`ground` ≥ 1.3.
- Shading: every rendered material triple (`paletteFor()` output) has
  strictly decreasing luminance top → mid → dark.
- Every colour slot is a valid `#rrggbb` string.
- `paletteFor` always returns 11 triples.
- `paletteFor('rose')` slots 0-9 deep-equal the reference loader's
  `DEFAULT_PALETTE` (`../renderer/src/core.js`), copied into this package as
  `REFERENCE_PALETTE` since `core.js` does not export it.

## Renderer palette slot layout

`paletteFor()` returns 11 `[hex, hex, hex]` shading triples:

| # | Slot |
|---|------|
| 0 | deep petal |
| 1 | deep centre |
| 2 | mid petal |
| 3 | mid centre |
| 4 | light petal |
| 5 | light centre |
| 6 | paper |
| 7 | olive |
| 8 | dark green |
| 9 | bright green |
| 10 | ribbon |

Slots 6-9 (paper/greens) are shared across every mode — only the flowers
and ribbon change.

## The 5 modes

### Rose (default)

| Role | Value |
|---|---|
| Petals (deep / mid / light) | `#C41E5A` / `#FB6F92` / `#FFB3C6` |
| Centres (deep / mid / light) | `#7A1338` / `#9C455B` / `#9E6F7B` |
| Ribbon | `#C41E5A` |
| ground | `#FBF1F3` |
| surface | `#F6E4E8` |
| ink | `#3A1320` |
| muted | `#6E4450` |
| accent | `#C41E5A` |
| onAccent | `#FFFFFF` |
| focus | `#C41E5A` |
| border | `#E4CBD1` |

### Sunflower

| Role | Value |
|---|---|
| Petals (deep / mid / light) | `#E0A000` / `#F5C518` / `#FFD84D` |
| Centre | `#5A3A12` |
| Ribbon | `#6B3F12` |
| ground | `#FFF8E1` |
| surface | `#FBEFC6` |
| ink | `#2E2106` |
| muted | `#5C4A16` |
| accent | `#8A5A00` |
| onAccent | `#FFFFFF` |
| focus | `#8A5A00` |
| border | `#E9D9A0` |

### Lavender

| Role | Value |
|---|---|
| Petals (deep / mid / light) | `#6B4AA8` / `#8E6CC4` / `#C9B6EC` |
| Centre | `#3B2760` |
| Ribbon | `#F1E6D6` |
| ground | `#F5F1FB` |
| surface | `#E9E0F5` |
| ink | `#241A36` |
| muted | `#4F3D6E` |
| accent | `#6B4AA8` |
| onAccent | `#FFFFFF` |
| focus | `#6B4AA8` |
| border | `#D8CBEC` |

### Marigold

| Role | Value |
|---|---|
| Petals (deep / mid / light) | `#D9531A` / `#F28C28` / `#FFB347` |
| Centre | `#7A300A` |
| Ribbon | `#C41E5A` |
| ground | `#FFF3E6` |
| surface | `#FBE2C8` |
| ink | `#33190A` |
| muted | `#6B3616` |
| accent | `#C4530F` |
| onAccent | `#FFFFFF` |
| focus | `#C4530F` |
| border | `#EFCFA9` |

### Hydrangea

| Role | Value |
|---|---|
| Petals (deep / mid / light) | `#2F5FA8` / `#5B8DD9` / `#A9C6F0` |
| Centre | `#1E3A6B` |
| Ribbon | `#F1E6D6` |
| ground | `#F0F5FC` |
| surface | `#DDE9F8` |
| ink | `#14233D` |
| muted | `#3C5478` |
| accent | `#2F5FA8` |
| onAccent | `#FFFFFF` |
| focus | `#2F5FA8` |
| border | `#C4D6ED` |

## Notes for downstream tasks

- Single-centre modes (sunflower, lavender, marigold, hydrangea) declare
  `centres` as `[c, c, c]` — the same hex three times. `paletteFor` still
  runs each through `triple()` independently, so the renderer's own
  deep/mid/light shading (×1, ×0.78, ×0.56) still applies to that one
  centre colour; only the "one centre colour vs three" distinction
  collapses, matching the contract's "derive the three centres from the one
  value (same value is fine)".
- `ui.muted`/`ui.border`/`ui.focus`/`ui.surface` were the values left free
  by the contract ("adjust ONLY the ui/muted/border/focus/surface values
  ... to pass"); the flower/ribbon colours and every other named `ui` value
  are exactly the contract's draft values, unchanged.
- `build-mode-css.mjs` (owned by a different task) is expected to read
  `MODES` and emit `html[data-mode="<id>"] { --ground ... }` blocks from
  `ui`; it should not need any change here.
