# Figma Component Usage Playbook

> Per-component, project-specific notes on how to use Kinko Design System components correctly when assembling screens in Figma via `use_figma` or by hand.
> **Always read the relevant section before instantiating a KDS component in a screen.**
> Companion machine-readable index: `.claude/indexes/component-usage.json`

---

## Mistakes & corrections log (cumulative)

| Date | Component | What I did wrong | What I should do |
|---|---|---|---|
| 2026-05-22 | (general) Auto-layout frames | Created auto-layout frames without setting `layoutSizingVertical = 'HUG'` after `appendChild`. Default is `FIXED` at h:100, causes circles/ribbon blow-ups. | Set BOTH `layoutSizingHorizontal` and `layoutSizingVertical` explicitly after every appendChild on every auto-layout frame I create. |
| 2026-05-22 | Card Row | Used lowercase `title`/`desc`/`value` for text-node lookup; `Value` was on by default showing default `₹1,000`. | Node names are `Title`/`Description`/`Value` (case-sensitive). Set boolean `Value#2616:12 = false` to hide trailing value when not needed. |
| 2026-05-22 | Footer Dock | Inner Button instance defaulted to showing Left/Right icons → ⊗ symbols on either side of CTA. | (Superseded by clearer rule below.) |
| 2026-05-22 | Footer Dock | Put `→` arrows inside Button **label text** (e.g. `"Continue →"`). Then hid both icon booleans to mask the default ⊗ icons. | Keep Label text clean — text only, NO arrows/symbols. Use the **Right Icon** boolean for the forward arrow (it loads the proper icon slot). Disable Left Icon. Same logic for back CTAs: enable Left Icon (back arrow), disable Right Icon. |
| 2026-05-22 | Footer Dock | Left T&C / disclaimer line visible on every funnel screen. | Toggle `info text#2326:91` OFF on screens where the T&C disclaimer isn't required. |
| 2026-05-22 | (general) Icon Holder | Enabled Right/Left Icon boolean expecting a forward arrow, but the slot still showed the default Atom (⊗) symbol. | Boolean only **reveals** the slot. You must also `swapComponent(realIcon)` on the inner Atom — e.g. `ArrowRight` for forward CTAs, `CaretRight` for subtler chevrons. Vector fill inherits parent's currentColor automatically. |
| 2026-05-22 | Chip | Built multi-select chip grid (PEDs screen) as **raw rounded-pill frames** instead of using the real Chip component. Missed the selection-state pattern entirely. | For multi-select scenarios, always use the KDS Chip component (`2028:379`). Unselected = `Status=Default`, both icons OFF, label only. Selected = `Status=Selected`, Icon Right ON, swap right Atom to `XCircle` (so the X-in-circle reads "tap to deselect"). Never use a checkmark for chip multi-select. |
| 2026-05-22 | Checkbox Item Boxed | Root was `lh: FIXED 328`, Label was `lh: HUG` + `textAutoResize: WIDTH_AND_HEIGHT` → wouldn't adapt to container width, label text grew beyond the box. | Fixed at component level: root → `FILL` horizontal, `HUG` vertical, all 7 state variants. Label → `FILL` horizontal + `layoutGrow: 1` + `textAutoResize: 'HEIGHT'` so it wraps within the tile. |
| 2026-05-22 | (general) Component fixes & existing instances | Updated a KDS component's auto-layout sizing — but existing instances on screens didn't visually update. | Instance children inherit auto-layout sizing at CREATION time, not live. After fixing a component, you must sync existing instances by setting their layout properties explicitly (e.g. `label.layoutSizingHorizontal = 'FILL'` on each instance). |
| 2026-05-22 | Game Card | Applied `layoutSizingHorizontal = 'FILL'` on a card that was NOT auto-layout at root. Created 30px dead space on right. | **Component has since been re-built with full auto-layout (FILL/HUG) — FILL is now the correct call.** Also re-flagged 3 internal bugs which user fixed: title FIXED→FILL, text-panel inner texts FIXED→FILL, Played bottom row counterAlign MAX→CENTER. |

---

## Per-screen audit progress

| Screen | Status | Notes |
|---|---|---|
| 01 Home | 🟡 reviewing | Game Card ✅ audited — next: Coverage Calculator card / Promo / dark hero |
| 02 Members | ⬜ pending | |
| 03 PEDs | 🟡 reviewing | Chip ✅ audited — chip grid retrofitted with real Chip instances |
| 04 Lifestyle | ⬜ pending | |
| 05 Family History | 🟡 reviewing | Checkbox Item Boxed ✅ audited + tiles synced to 175w with wrapping labels |
| 06 Coverage | ⬜ pending | |
| 07 Result | ⬜ pending | |
| 08 Plans | ⬜ pending | |

✅ audited · 🟡 in review · ⬜ pending

---

# Screen-level conventions

> Project-wide rules that apply to every screen, regardless of component composition.

## Background hierarchy (HARD RULE)

- **Screen background** = `surface/secondary` (grey-50 / `--surface-secondary`)
  - This is the canvas color BEHIND all content.
- **Cards on top of the screen** = `surface/default` (white / `--surface-default`)
  - Any card, card-row, list-item, banner, list group, etc. that sits on the screen → white.
- Exception: dark/inverse heroes (e.g. navy-900 dark hero block) override with `surface/inverse` or palette primitives. Document each case.

### Why this matters
- I previously bound screen backgrounds to `surface/default` (white) AND content frames to `grey-100` — both wrong. The screen surface should be `surface/secondary` consistently so cards "lift" off the canvas without needing extra shadow.

### Correct call pattern
```js
// Screen frame bg
const surfaceSecondary = await figma.variables.importVariableByKeyAsync('<surface-secondary-key>');
let bg = [{ type: 'SOLID', color: { r: 0.97, g: 0.97, b: 0.95 } }];
bg[0] = figma.variables.setBoundVariableForPaint(bg[0], 'color', surfaceSecondary);
screen.fills = bg;

// Card on top of the screen
const surfaceDefault = await figma.variables.importVariableByKeyAsync('b22ea27c40ddeb773caf29ed63918f8678883d11');
let cardBg = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
cardBg[0] = figma.variables.setBoundVariableForPaint(cardBg[0], 'color', surfaceDefault);
card.fills = cardBg;
```

---

# Components

## Game Card

✅ **AUDITED 2026-05-22** — fully responsive after a round of fixes.

**Figma:** component set `3603:13082` on page **Cards 🟡** · key `2964cb5e0c202b82135225e7a74d79a24a3cc0e7`
**Native size at preview:** 328w (HUG height ~212) — but root is **FULLY responsive** (`FILL` horizontal, `HUG` vertical, STRETCH align), so the card adapts to any container width.
**Layout mode at root:** `VERTICAL` auto-layout
**Used on:** screen 01 Home (frame `1313:20949`, instance `1315:21274`)

### Variants

| Property | Values | Variant keys |
|---|---|---|
| `Property 1` | `Default`, `Played` | Default: `0a13430258040ba9818889c4cf4b7f6f7eb0e75e` · Played: `dbac8ebee6adf6fad21c05813a04d12c480f6c8a` |

No boolean props on the set itself — only the variant switcher.

### Anatomy (Default variant, top → bottom)

```
Card 328×210 (radius mixed)
├─ Top region 326×101  (image card area, padding 10/10/10/0)
│  └─ Image card 306×90  (radius 4)
│     ├─ Image rectangle 191×90  ← "image 4326" — game artwork fill
│     └─ Text panel 115×90       — vertical auto-layout, gap 25, padding 6/6/8/8
│        ├─ Text "LIFE SIMULATOR Time: 8 MIN" (10pt, h:HUG)
│        └─ Text "Insurance explained to 100+ people." (10pt, h:HUG)
└─ Bottom region 326×107  (padding 12)
   ├─ Title + CTA row 303×36 (gap 31, horizontal, h:HUG)
   │  ├─ Text "Step into real scenarios…" (14pt, w:175 FIXED, h:HUG)
   │  └─ CTA Button instance (Play Now / Play Again)
   └─ Players + count row 298×36 (gap 155, horizontal, h:HUG)
      ├─ Avatar group (74×36, pill, 2 ellipses) — Default variant
      ├─ [Played variant only] Button Base instance — ghost link
      └─ Count badge 64×34 (pill, 12/12/8/8 padding) — dots indicator
```

### Played variant — what changes

- CTA Button text changes from `Play Now` → `Play Again`
- Adds a `Button Base` (ghost link) between avatar group and count badge

### Sizing rules

- ✅ Root is fully auto-layout — `layoutSizingHorizontal = 'FILL'` works correctly. Card stretches to container width.
- ✅ Vertical is `HUG` — card height grows/shrinks with content.
- ✅ Title text inside title+CTA row is `FILL` + `layoutGrow: 1` → absorbs extra width when card is wide.
- ✅ Inner text-panel labels are `FILL` → no clipping when panel resizes.
- Inside a 358-wide content frame: set `gc.layoutSizingHorizontal = 'FILL'` — that's the correct call now.

### Text overrides

- No componentProperties for text → cannot override text via `setProperties`.
- Text nodes are named after their default content (e.g. `LIFE SIMULATOR Time: 8 MIN`). Find by ID or by `characters` match.
- TBD: confirm with user whether text is intended to be overridden per-instance or always shows "Life Simulator" (i.e. this card is a fixed promo, not a template).

### Image fill

- Image rectangle id `image 4326` — at native node id `3603:12965` (Default) / `3603:12998` (Played).
- Fill is image type → either keep default artwork or replace via image-fill upload.

### Common mistakes & corrections

- ❌ **Mistake (2026-05-22 — pre-fix):** Card root was not auto-layout. Calling FILL just left 30px gap on the right.
- ✅ **Fixed (2026-05-22):** Component re-wired with full auto-layout. FILL is now correct. Internal text-FILL bugs and Played counterAlign mismatch also fixed.

### Correct call pattern

```js
const gameCard = await figma.importComponentByKeyAsync('0a13430258040ba9818889c4cf4b7f6f7eb0e75e');
const gc = gameCard.createInstance();
parent.appendChild(gc);
gc.layoutSizingHorizontal = 'FILL';  // ✅ now works — fully auto-layout
// To switch to Played variant:
// gc.setProperties({ 'Property 1': 'Played' });
// Text overrides require finding text nodes by ID and setting `characters`
// (no componentProperty-based text overrides exist on this component).
```

### Deferred items (need explicit user decision before changing)

- **Root padding 1px** — left as-is. May be intentional for an inset stroke effect.
- **Combined text "LIFE SIMULATOR Time: 8 MIN"** — single text node. Not split into title/duration. Design choice; revisit only if a layout calls for differently-styled title vs duration.
- **No text-override component properties** — text changes require finding nodes by ID. Acceptable if Game Card is a fixed promo. If it ever becomes a template (multiple game variants), add `Game name#xx` / `Duration#xx` / `Description#xx` / `CTA Label#xx` properties.

---

## Footer Dock

✅ **AUDITED 2026-05-22** — usage rules locked in.

**Figma:** component set `2313:407` on page **Footer Dock 🟡** · key `0b810407ddb0c0de42efaf3a7974ba174d83c081`
**Used on:** funnel screens 02 Members, 03 PEDs, 04 Lifestyle, 05 Family History, 06 Coverage

### TL;DR — how to use this concisely

1. **Pick the variant** — `Style` (Flat / Bordered / Elevated) + `Layout` (Single / Dual / Trio). Bordered + Single is the safe default for funnel screens.
2. **Disclaimer** — `info text#2326:91` is **OFF** by default. ON only on consent-bearing screens (account creation, purchase, OTP, data-share).
3. **Inner Button — Label is text only.** No `→`, `›`, `←` in the string. Use `Label#33:604`.
4. **Direction** — enable the icon side that matches the action, disable the other:
   - Forward CTA → `Right Icon#33:457` = ON, `Left Icon#33:408` = OFF
   - Back CTA → `Left Icon` = ON, `Right Icon` = OFF
   - Neutral CTA → both OFF
5. **Swap the actual icon.** The boolean only reveals the slot — the inner `Atom` is still ⊗ until you `swapComponent(...)` it. Traverse `Button → Icon holder (visible) → Atom` and swap:
   - Forward → `ArrowRight` Outline/Regular · `5806f10d649c9538176bf89e3a8b753e8bdd6c8e`
   - Back → `ArrowLeft` (look up)
   - List/nav chevron → `CaretRight` Outline/Regular · `8a44804ca2f7198ecaa5edc493681842d1b6bb66`
6. **Color is automatic** — Atom's Vector fill inherits `currentColor` from the button. Don't override.
7. **Sizing** — `footer.layoutSizingHorizontal = 'FILL'` after appending. Vertical stays HUG.

#### Common mistakes
- ❌ `→` in label string
- ❌ Hiding both icon booleans to mask ⊗
- ❌ T&C always ON
- ❌ Enabling Right Icon without swapping the Atom

### Variants

| Property | Values |
|---|---|
| `Style` | `Flat`, `Bordered`, `Elevated` |
| `Layout` | `Single`, `Dual`, `Trio` (depending on how many CTAs) |
| `info text#2326:91` (boolean) | controls visibility of the T&C / disclaimer line at the top of the dock |

### Composition

Footer Dock = **disclaimer line** (boolean-toggled) + **Button instance(s)**.

### HARD RULES — how to use this correctly

#### Rule 1 — Disclaimer line is opt-in
Toggle `info text#2326:91` based on the screen's intent:
- **OFF** on most funnel/utility screens (steps 1–5 of the coverage calculator, etc.)
- **ON** only when the screen genuinely needs the "By continuing, you agree to our Terms & Privacy Policy." disclaimer (e.g. account creation, purchase confirmation, OTP, data-share consent).

#### Rule 2 — Button Label is text only
The inner Button has separate slots for `Left Icon`, `Label`, and `Right Icon`. **Never** put arrows / symbols / icons inside the Label string.

| What I want | How to do it |
|---|---|
| Continue → | Label = `"Continue"` · `Right Icon#33:457` = ON · `Left Icon#33:408` = OFF |
| ← Back | Label = `"Back"` · `Left Icon#33:408` = ON · `Right Icon#33:457` = OFF |
| Just "Save" | Label = `"Save"` · both icons OFF |
| Loading | `Loader Visible#33:555` = ON · Label hidden via `Label Visible#33:506` = OFF |

❌ DO NOT:
- `Label = "Continue →"`
- `Label = "See my recommendation →"`
- `Label = "← Back"`

✅ DO:
- Use the correct icon side via boolean toggle. Disable the unused side. Strip arrows from label text.

### Correct call pattern

```js
// Footer Dock (Bordered + Single layout) instance
const footerDock = await figma.importComponentByKeyAsync('89ff6a02005a106acaa55945ef8217aceaed7e86');
const f = footerDock.createInstance();
screen.appendChild(f);
f.layoutSizingHorizontal = 'FILL';

// Hide T&C disclaimer (most funnel screens don't need it)
f.setProperties({ 'info text#2326:91': false });

// Set CTA label (text only — no arrows!)
const btn = f.findOne(n => n.type === 'INSTANCE' && n.mainComponent?.parent?.name?.toLowerCase?.().includes('button base'));
btn.setProperties({
  'Label#33:604': 'See my recommendation',
  'Right Icon#33:457': true,   // ✅ this loads the proper arrow icon slot
  'Left Icon#33:408': false,
});
```

### Common mistakes & corrections

- ❌ Setting Label = `"Continue →"` and then hiding both icons → produces a CTA without a real icon and with an unwanted unicode char in the string.
- ❌ Leaving `info text#2326:91` ON when the screen has no T&C → adds visual noise + extra height.
- ✅ Use Label for text only, use icon booleans for icons, toggle disclaimer off when not needed.

### Rule 3 — Icon Holder needs an icon swap (Right/Left Icon boolean is not enough)

Setting `Right Icon#33:457 = true` only **shows** the Icon Holder slot. The slot's inner element ("Atom") still renders as the default placeholder atom-symbol (⊗) until you swap it with a real icon component.

**To swap:** traverse `Button → Icon Holder (Right) → Atom (instance child)` and call `atom.swapComponent(realIcon)`.

**Recommended icons:**
- Forward CTA → `ArrowRight` Outline/Regular · key `5806f10d649c9538176bf89e3a8b753e8bdd6c8e`
- Back CTA → `ArrowLeft` (lookup if/when needed)
- Subtler chevron (lists/nav) → `CaretRight` Outline/Regular · key `8a44804ca2f7198ecaa5edc493681842d1b6bb66`

**Color binding:** The Atom's Vector fill is bound to `currentColor` → inherits the button's text color automatically. No manual color override needed.

### Updated correct call pattern

```js
// Footer Dock (Bordered + Single layout) instance
const footerDock = await figma.importComponentByKeyAsync('89ff6a02005a106acaa55945ef8217aceaed7e86');
const arrowRight = await figma.importComponentByKeyAsync('5806f10d649c9538176bf89e3a8b753e8bdd6c8e');

const f = footerDock.createInstance();
screen.appendChild(f);
f.layoutSizingHorizontal = 'FILL';
f.setProperties({ 'info text#2326:91': false });   // hide T&C

// Configure inner Button
const btn = f.findOne(n => n.type === 'INSTANCE' && n.mainComponent?.parent?.name?.toLowerCase?.().includes('button base'));
btn.setProperties({
  'Label#33:604': 'See my recommendation',
  'Right Icon#33:457': true,
  'Left Icon#33:408': false,
});

// CRITICAL — swap the inner Atom on the visible Right Icon Holder
const rightHolder = btn.findAll(n => n.type === 'INSTANCE' && n.name === 'Icon holder' && n.visible)[0];
const atom = rightHolder.findOne(n => n.type === 'INSTANCE' && n.name === 'Atom');
atom.swapComponent(arrowRight);
```

### Retrofit log

Applied 2026-05-22 to Section 2 (`1349:19570`) funnel screens:
- ✅ Step 1 Members (`1316:21471`) → `"Check coverage for 1 member"` · Right Icon ON+ArrowRight · disclaimer OFF
- ✅ Step 2 PEDs (`1319:21447`) → `"Finish & continue"` · Right Icon ON+ArrowRight · disclaimer OFF
- ✅ Step 3 Lifestyle (`1319:21532`) → `"Continue"` · Right Icon ON+ArrowRight · disclaimer OFF
- ✅ Step 4 Family History (`1319:21635`) → `"Continue"` · Right Icon ON+ArrowRight · disclaimer OFF
- ✅ Step 5 Coverage (`1320:21589`) → `"See my recommendation"` · Right Icon ON+ArrowRight · disclaimer OFF

---

## Chip

✅ **AUDITED 2026-05-22**

**Figma:** component set `2028:379` on page **✅ Labels/ Chips/ Tags** · key `733c8ae10e0b6b9ef8e10c88ce143e7bebbeff69`
**Used on:** screen 03 PEDs chip grid (retrofitted 2026-05-22)

### TL;DR — how to use Chip for multi-select

Multi-select scenarios (conditions, filters, tag pickers) ALWAYS use this component — never raw rounded-pill frames.

| State | Variant | Booleans | Icon |
|---|---|---|---|
| **Unselected** (default) | `Status=Default` | `Icon Left=false`, `Icon Right=false` | none |
| **Selected** | `Status=Selected` | `Icon Left=false`, `Icon Right=true` | swap right Atom → `XCircle` (X-in-circle) |

**Why X-in-circle (not a checkmark):**
- It signals "tap to deselect" — active/removable affordance.
- Consistent with applied-filter chips elsewhere in the system.

### Variants

| Property | Values |
|---|---|
| `Size` | `SM` (32h) · `MD` (36h, default for forms) · `LG` (48h) |
| `Status` | `Default`, `Success`, `Info`, `Warning`, `Error`, `Selected` |
| `Icon Left#2028:54` | boolean, default `true` (turn OFF for multi-select chips) |
| `Icon Right#2032:2` | boolean, default `true` (OFF when unselected, ON when selected) |

### Variant keys (MD — default for form/filter use)

- Default / MD: `7acc0ddb99f15242f3129a6acd95069fb28eaf87`
- Selected / MD: `32de1428e7ed626f1a4ed982e6beb63edb1d3e3d`
- (Other Status×Size combos: see Figma — 18 variants total)

### Text node

- Inner label is a TEXT node named **`label`** (lowercase, not "Label"). Override via `findOne(n => n.type === 'TEXT' && n.name === 'label')`.

### Icon for selected state

- `XCircle` Outline/Regular · key `3009aaaa8e5ea38eba9be6c833df0197d26f8515`
- Vector fill inherits `currentColor` — no manual color override needed.

### Correct call pattern

```js
const chipDefault  = await figma.importComponentByKeyAsync('7acc0ddb99f15242f3129a6acd95069fb28eaf87');
const chipSelected = await figma.importComponentByKeyAsync('32de1428e7ed626f1a4ed982e6beb63edb1d3e3d');
const xCircle      = await figma.importComponentByKeyAsync('3009aaaa8e5ea38eba9be6c833df0197d26f8515');

const makeChip = async (parent, labelText, selected) => {
  const inst = (selected ? chipSelected : chipDefault).createInstance();
  parent.appendChild(inst);
  inst.setProperties({
    'Icon Left#2028:54': false,
    'Icon Right#2032:2': selected,
  });
  const labelNode = inst.findOne(n => n.type === 'TEXT' && n.name === 'label');
  await figma.loadFontAsync(labelNode.fontName);
  labelNode.characters = labelText;
  if (selected) {
    const rightHolder = inst.findAll(n => n.type === 'INSTANCE' && n.name === 'Icon holder' && n.visible).slice(-1)[0];
    const atom = rightHolder.findOne(n => n.type === 'INSTANCE' && n.name === 'Atom');
    atom.swapComponent(xCircle);
  }
};
```

### Common mistakes
- ❌ Building chips as raw rounded-pill frames (lose the design system + variant-state wiring)
- ❌ Using a checkmark icon on selected chips (passive, doesn't signal deselect)
- ❌ Leaving `Icon Left` ON for chips that have no leading icon — adds a default ⊗ slot
- ❌ Forgetting to swap the right Atom after enabling `Icon Right` — same ⊗ issue as Footer Dock

### Retrofit log

- 2026-05-22 — Screen 03 PEDs grid (`1319:21430`) → 8 raw frames replaced with 8 Chip MD instances. "Hypertension / BP" and "Thyroid" demonstrated as Selected with XCircle dismiss icon.

---

## Checkbox Item Boxed

✅ **AUDITED 2026-05-22** — root + label sizing fixed in all 7 variants.

**Figma:** component set `2237:3870` on page **Checkbox 🟡** · key `68d13c5664307ff9235be966dbfcb29be8a9ed26`
**Used on:** screens 04 Lifestyle (Smoking / Drinking row), 05 Family History (2-col grid + "None of these" full-width)

### Variants

| Property | Values |
|---|---|
| `State` | `Default`, `Hover`, `Focused`, `Checked`, `Checked Hover`, `Disabled`, `Disabled Checked` |

### Variant keys

| State | Key |
|---|---|
| Default | `60952f2e3bb0f7f105dd04c36c59e1e24997f740` |
| Hover | `d71f68af45dd5c954af4a149c2f3398babca443c` |
| Focused | `fa1db6fe9e53f161bc6815aaa4c428a8976dd608` |
| Checked | `ea8f1d9e39744a77d205f1e01d00c8f7e6d96b18` |
| Checked Hover | `ed7dd34c7a03b981f68fd14e06e9e8bb9ed5e6e9` |
| Disabled | `9e4936d192411cc2eded9e73b1cc3415c8767bf0` |
| Disabled Checked | `20b9e40c2dd90104834a8443ce958a6753a60315` |

### Sizing rules

- **Root** — `lh: FILL`, `lv: HUG` → adapts to container width, height grows with multi-line labels
- **Label** — `lh: FILL`, `layoutGrow: 1`, `textAutoResize: 'HEIGHT'` → wraps inside the tile instead of clipping
- **Inner Checkbox Control** — `FIXED 24×24` (correctly fixed)

### Common layouts

**Single column (full-width):**
- Drop into a vertical auto-layout container. Tile FILLs to container width. Use case: "None of these" row.

**2-column wrap grid:**
- Container: `HORIZONTAL + WRAP`, `gap: 8`, container `FILL` horizontal
- Tile width: container width = 358 → `(358 − 8) ÷ 2 = 175` per tile (FIXED width)
- Labels wrap to 2 lines automatically. Tile height HUGs the tallest label.

### Text node

- Label TEXT node is named `Label` (Capitalised, case-sensitive)
- Font is Plus Jakarta Sans Medium — must `figma.loadFontAsync({ family: 'Plus Jakarta Sans', style: 'Medium' })` before changing `characters`

### Common mistakes

- ❌ Setting tile width too small (148 or less) → labels truncate on common condition names
- ❌ Not setting `textAutoResize: 'HEIGHT'` on the Label → text fights with FILL
- ❌ Forgetting that existing instances **don't auto-pickup** component sizing changes — must sync manually

### Correct call pattern

```js
await figma.loadFontAsync({family:'Plus Jakarta Sans', style:'Medium'});

const cbDefault = await figma.importComponentByKeyAsync('60952f2e3bb0f7f105dd04c36c59e1e24997f740');
const cbChecked = await figma.importComponentByKeyAsync('ea8f1d9e39744a77d205f1e01d00c8f7e6d96b18');

// 2-col grid container
const grid = figma.createFrame();
grid.layoutMode = 'HORIZONTAL';
grid.layoutWrap = 'WRAP';
grid.itemSpacing = 8;
grid.counterAxisSpacing = 8;
parent.appendChild(grid);
grid.layoutSizingHorizontal = 'FILL';
grid.layoutSizingVertical = 'HUG';

// Tile
const tile = cbDefault.createInstance();
grid.appendChild(tile);
tile.resize(175, tile.height);  // 2-col math: (358 − 8) / 2
const label = tile.findOne(n => n.type === 'TEXT' && n.name === 'Label');
label.textAutoResize = 'HEIGHT';
label.layoutSizingHorizontal = 'FILL';
label.layoutGrow = 1;
label.characters = 'Neurological (Parkinson\'s, etc.)';
// label now wraps to 2 lines instead of clipping
```

### Retrofit log

- 2026-05-22 — Component update: all 7 variants now have root `FILL/HUG` + Label `FILL + textAutoResize HEIGHT`
- 2026-05-22 — Screen 05 Family History (`1313:21021`) — 7 instances resized to 175w, label sizing synced. All labels now wrap properly.
