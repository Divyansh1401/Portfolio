# Figma API Reference — Kinko Design System

## Figma File
- **File key:** `IDT7FF4CnWEMLfuwSCFQoa`

## Variable Collections

| Collection | ID | Mode ID | Var Count |
|---|---|---|---|
| Primitives (colors) | `VariableCollectionId:2135:1590` | `2135:0` | 142 |
| Gap (spacing) | `VariableCollectionId:10:1515` | `10:5` | 11 |
| Radius | `VariableCollectionId:12:77328` | `12:6` | 12 |
| Opacity | `VariableCollectionId:24:285` | `24:0` | 5 |
| Overlay | `VariableCollectionId:2018:228` | `2018:0` | 5 |
| Border | `VariableCollectionId:2050:608` | `2050:0` | 4 |
| Semantic | `VariableCollectionId:2156:1906` | `2156:0` | 64 (62 in Figma; tooltip + dot tokens pending sync) |
| Button | `VariableCollectionId:2188:2440` | `2188:0` | 31 |
| Stepper | `VariableCollectionId:2235:3635` | `2235:4` | 8 |
| Icon Holder | `VariableCollectionId:2670:2455` | — | 1 |
| Tooltip | `VariableCollectionId:2346:67237` | `2346:15` | 3 |
| Avatar Stack | `VariableCollectionId:2384:67969` | `2384:17` | 3 |
| Card | `VariableCollectionId:2388:68089` | `2388:18` | 2 |
| Menu Item | `VariableCollectionId:3095:8` | `3095:0` | 8 |
| Date Picker | `VariableCollectionId:3134:217` | `3134:0` | 10 |
| List Item | `VariableCollectionId:3152:9` | `3152:0` | 9 |
| Price Row | `VariableCollectionId:3160:8` | `3160:0` | 7 |

## Variable Names by Collection

### Primitives (142 COLOR variables)
```
base/white, base/black

primary/green/50..900
primary/navy/50..900
primary/grey/50..900

secondary/teal/50..900
secondary/steel-blue/50..900
secondary/mint/50..900

tertiary/peach/50..900
tertiary/yellow/50..900
tertiary/coral/50..900
tertiary/purple/50..900

system/success/50..900
system/info/50..900
system/warning/50..900
system/error/50..900
```

Shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900

### Semantic (64 COLOR alias variables)
```
surface/default, surface/secondary, surface/tertiary, surface/brand, surface/inverse, surface/inverse-secondary, surface/brand-inverse

text/primary, text/secondary, text/tertiary, text/inverse, text/brand, text/error, text/on-action-primary, text/on-action-secondary

action/primary, action/primary-pressed, action/secondary, action/secondary-pressed, action/disabled, action/destructive, action/link, action/link-hover

border/default, border/strong, border/subtle, border/focus, border/error, border/selected

feedback/success, feedback/success-bg, feedback/error, feedback/error-bg, feedback/warning, feedback/warning-bg, feedback/info, feedback/info-bg
```

### Gap (11 FLOAT variables)
```
gap/2, gap/4, gap/8, gap/10, gap/12, gap/16, gap/20, gap/24, gap/32, gap/48, gap/64
```

### Radius (12 FLOAT variables)
```
radius/2, radius/4, radius/8, radius/10, radius/12, radius/16, radius/20, radius/24, radius/32, radius/48, radius/64, radius/9999
```

### Opacity (5 FLOAT variables)
```
opacity/subtle (10), opacity/medium (25), opacity/strong (50), opacity/disabled (75), opacity/backdrop (90)
```

### Overlay (5 COLOR variables)
```
overlay/20, overlay/35, overlay/50, overlay/65, overlay/80
```

### Border (4 FLOAT variables)
```
border-width/hairline (0.5), border-width/small (1), border-width/medium (1.5), border-width/large (2)
```

### Price Footer (6 COLOR alias variables → Semantic, 1 mode)
```
Collection: VariableCollectionId:3026:5747
Mode: Default (3026:0)

price-footer/bg             → surface/default    (VariableID:3026:5748)
price-footer/border         → border/default     (VariableID:3026:5749)
price-footer/label          → text/secondary     (VariableID:3026:5750)
price-footer/price          → text/primary       (VariableID:3026:5751)
price-footer/breakdown-bg   → surface/secondary  (VariableID:3026:5752)
price-footer/breakdown-icon → text/secondary     (VariableID:3026:5753)
```
Component node: `3026:5754` (COMPONENT, Footer Dock 🟡 page).
No component properties — text content set directly on layers.

---

### Alert (17 COLOR alias variables → Semantic) — REPLACES deprecated Toast
```
Collection: VariableCollectionId:3170:8
Mode: Default (3170:0)

# Status backgrounds (4)
alert/bg-info        → feedback/info-bg         (VariableID:3170:9)
alert/bg-success     → feedback/success-bg      (VariableID:3170:10)
alert/bg-warning     → feedback/warning-bg      (VariableID:3170:11)
alert/bg-error       → feedback/error-bg        (VariableID:3170:12)

# Status borders (4)
alert/border-info    → feedback/info-border     (VariableID:3170:13)
alert/border-success → feedback/success-border  (VariableID:3170:14)
alert/border-warning → feedback/warning-border  (VariableID:3170:15)
alert/border-error   → feedback/error-border    (VariableID:3170:16)

# Status icon colors — *-text 700 (4)
alert/icon-info      → feedback/info-text       (VariableID:3170:17)
alert/icon-success   → feedback/success-text    (VariableID:3170:18)
alert/icon-warning   → feedback/warning-text    (VariableID:3170:19)
alert/icon-error     → feedback/error-text      (VariableID:3170:20)

# Status heading colors — *-strong 800 (4)
alert/heading-info    → feedback/info-strong    (VariableID:3170:21)
alert/heading-success → feedback/success-strong (VariableID:3170:22)
alert/heading-warning → feedback/warning-strong (VariableID:3170:23)
alert/heading-error   → feedback/error-strong   (VariableID:3170:24)

# Body text — always text/primary (1)
alert/text-body      → text/primary             (VariableID:3170:25)
```
Component set: node `3184:16` (Alert 🟡 page, id `3171:8`). 4 Status variants × 5 boolean props (Icon=true default; Heading/Dismiss/Slot/Action=false).

**3 NEW semantic border tokens added 2026-04-29** (mirroring existing `feedback/success-border`):
- `feedback/info-border` (`VariableID:3169:8`) → `system/info/200`
- `feedback/warning-border` (`VariableID:3169:9`) → `system/warning/200`
- `feedback/error-border` (`VariableID:3169:10`) → `system/error/200`

**Deprecated 2026-04-29:** Toast component (`VariableCollectionId:2408:68426`, node `2409:68637`, "Toast" page) DELETED. Alert covers all in-page status messaging.

### Card (2 COLOR alias variables → Semantic)
```
card/bg     → surface/default  (VariableID:2388:68090)
card/border → border/default   (VariableID:2388:68091)
```
Component: node `2384:67964` ("Card 1") on Cards page. Shadow via `--shadow-low` effect (not a Figma variable).

### Tag (13 COLOR alias variables → Semantic)
```
Collection: VariableCollectionId:3253:8
Mode: Default (3253:0)

# Status backgrounds (palette-100)
tag/bg-yellow     → palette/yellow/bg-strong   (VariableID:3253:9)
tag/bg-green      → palette/green/bg-strong    (VariableID:3253:12)
tag/bg-coral      → palette/coral/bg-strong    (VariableID:3253:15)
tag/bg-purple     → palette/purple/bg-strong   (VariableID:3253:18)

# Status text + icon (palette-900)
tag/text-yellow   → palette/yellow/text-strong (VariableID:3253:10)
tag/text-green    → palette/green/text-strong  (VariableID:3253:13)
tag/text-coral    → palette/coral/text-strong  (VariableID:3253:16)
tag/text-purple   → palette/purple/text-strong (VariableID:3253:19)

# Drop shadow color (palette-800)
tag/shadow-yellow → palette/yellow/shadow      (VariableID:3253:11)
tag/shadow-green  → palette/green/shadow       (VariableID:3253:14)
tag/shadow-coral  → palette/coral/shadow       (VariableID:3253:17)
tag/shadow-purple → palette/purple/shadow      (VariableID:3253:20)

# Inset highlight — always white
tag/highlight     → text/inverse               (VariableID:3253:21)
```
Component set: node `3256:282` on **✅ Labels/ Chips/ Tags** page (id `2232:3588`). 4 Status variants (Yellow/Green/Coral/Purple). Asymmetric radius: pill-rounded left, flat right (ribbon shape). Dual-shadow effect: drop shadow + inset white. Default icon: StarFour Outline Fill (`2199:5634`) inside icon-holder--xs (`2169:2358`).

**12 NEW semantic palette tokens added 2026-04-29** (in Semantic collection):
- `palette/{yellow,green,coral,purple}-bg-strong` (`VariableID:3252:8/11/14/17`) → `*-100`
- `palette/{yellow,green,coral,purple}-text-strong` (`VariableID:3252:9/12/15/18`) → `*-900`
- `palette/{yellow,green,coral,purple}-shadow` (`VariableID:3252:10/13/16/19`) → `*-800`

These supplement the existing Label palette tokens at 50/700.

### Modal (3 COLOR alias variables → Semantic)
```
Collection: VariableCollectionId:3226:9
Mode: Default (3226:0)

modal/overlay → overlay/65       (VariableID:3226:10)
modal/bg      → surface/default  (VariableID:3226:11)
modal/border  → border/default   (VariableID:3226:12)
```
Component: node `3227:8` (single COMPONENT, no variants) on **Modal 🟡** page (id `3226:8`). 328px fixed width, mobile-only v1. Boolean prop: `Footer` (default true) toggles Footer Dock visibility. `Slot` (Figma SLOT type) hosts custom body content. Composes Header (`2413:68695`) + Footer Dock (default `Style=Flat, Layout=Dual`). Demo overlay frame at `3228:88` (360×800 mobile reference with scrim bound to `modal/overlay`).

### Avatar Stack (3 COLOR alias variables → Semantic)
```
avatar-stack/ring          → surface/default  (VariableID:2384:67970)
avatar-stack/overflow-bg   → surface/tertiary (VariableID:2384:67971)
avatar-stack/overflow-text → text/secondary   (VariableID:2384:67972)
```
Component set: node `2386:68088` — 4 variants (Size=24/32/40/64)
Boolean props: `prop3rd` (3rd avatar slot) · `prop3` (overflow badge)

### Icon Holder (no variable collection — inherits fill from inner SVG)
```
Component set node: 2169:2353   (page: Icons Foundations)
INSTANCE_SWAP inner slot property: Atom

Variant node IDs:
  xs → 2169:2358  (12px)
  sm → 2169:2352  (16px)
  md → 2169:2354  (20px)
  lg → 2169:2356  (24px)

No Figma variable collection. Size tokens use Gap collection:
  gap/12 → xs  |  gap/16 → sm  |  gap/20 → md  |  gap/24 → lg
```
Code file: `css/icon-holder.css`. Base class: `.icon-holder`.

---

### Heading (3 COLOR alias variables → Semantic)
```
Collection: VariableCollectionId:2707:8
Mode: 2707:0 (single mode)

heading/title     → text/primary    (VariableID:2707:9)
heading/desc      → text/secondary  (VariableID:2707:10)
heading/icon-fill → text/primary    (VariableID:2707:11)
```
Component set: node `2703:5541` (Buttons 🟡 page). 3 size variants (Large/Primary/Secondary).
Boolean props: `Description` · `Icon` · `Button`.

---

### Button (31 COLOR alias variables — properly aliasing Semantic tokens ✅ 3-tier compliant)
```
btn/primary/fill          → action/primary        (green-500)
btn/primary/fill-pressed  → action/primary-pressed (green-600)
btn/primary/text          → text/on-action-primary (white)
btn/secondary/fill        → action/secondary       (navy-500)
btn/secondary/fill-pressed → action/secondary-pressed (navy-600)
btn/secondary/text        → text/on-action-primary (white)
btn/ghost/text            → text/primary           (navy-900)
btn/ghost/fill-pressed    → surface/selected       (navy-50)
btn/ghost/fill-hover      → surface/secondary      (grey-50)
btn/destructive/fill      → action/destructive     (error-500)
btn/destructive/fill-pressed → action/destructive-pressed (error-700)
btn/destructive/text      → text/on-action-primary (white)
btn/ring/primary          → action/primary-pressed (green-600)
btn/ring/secondary        → action/secondary-pressed (navy-600)
btn/ring/destructive      → action/destructive-pressed (error-700)
btn/focus/ring            → action/primary         (green-500)
(+ 15 additional Stroke variant + hover state tokens)
```
Note: Button collection was fixed from direct primitive aliases to proper Semantic aliases (3-tier compliant as of 2026-04-23 audit).

## Text Styles (16 styles)

All use **Plus Jakarta Sans**, letter-spacing 0, line-height auto.

```
Title/Title-XL    — 20px Bold
Title/Title-LG    — 18px Bold
Title/Title-MD    — 16px Bold
Title/Title-SM    — 14px SemiBold
Title/Title-XS    — 13px SemiBold

Body/Body-MD      — 14px Regular
Body/Body-SM      — 12px Regular
Body/Body-XS      — 10px Regular

Label/Label-LG         — 16px SemiBold
Label/Label-LG-Medium  — 16px Medium
Label/Label-MD         — 14px SemiBold
Label/Label-MD-Medium  — 14px Medium
Label/Label-XS         — 12px Medium

Caption/Caption-MD        — 12px Regular
Caption/Caption-SM-Bold   — 10px Bold
Caption/Caption-SM-Medium — 10px Medium
```

## API Patterns

### Looking up a variable by name
```javascript
const collection = await figma.variables.getVariableCollectionByIdAsync(COLLECTION_ID);
const modeId = collection.modes[0].modeId;

// Build lookup map
const varLookup = {};
for (const vid of collection.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(vid);
  if (v) varLookup[v.name] = v;
}

// Use it
const greenVar = varLookup['primary/green/500'];
```

### Binding a color variable to a rectangle fill
```javascript
const rgb = { r: 0, g: 0.608, b: 0.102 }; // fallback color
const solidPaint = { type: 'SOLID', color: rgb };
const boundPaint = figma.variables.setBoundVariableForPaint(solidPaint, 'color', variable);
rect.fills = [boundPaint];
```

### Binding spacing to an auto-layout frame
```javascript
const gapVar = varLookup['gap/16'];
frame.setBoundVariable('itemSpacing', gapVar);
frame.setBoundVariable('paddingTop', gapVar);
frame.setBoundVariable('paddingRight', gapVar);
frame.setBoundVariable('paddingBottom', gapVar);
frame.setBoundVariable('paddingLeft', gapVar);
```

### Binding radius to a rectangle
```javascript
const radiusVar = varLookup['radius/8'];
rect.setBoundVariable('topLeftRadius', radiusVar);
rect.setBoundVariable('topRightRadius', radiusVar);
rect.setBoundVariable('bottomLeftRadius', radiusVar);
rect.setBoundVariable('bottomRightRadius', radiusVar);
```

### Applying a text style
```javascript
const allStyles = await figma.getLocalTextStylesAsync();
const style = allStyles.find(s => s.name === 'Title/Title-XL');
await textNode.setTextStyleIdAsync(style.id);
```

### Font loading (required before any text creation/editing)
```javascript
await Promise.all([
  figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Plus Jakarta Sans', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Plus Jakarta Sans', style: 'Medium' }),
  figma.loadFontAsync({ family: 'Plus Jakarta Sans', style: 'SemiBold' }),
  figma.loadFontAsync({ family: 'Plus Jakarta Sans', style: 'Bold' }),
]);
```

### Creating a new variable
```javascript
const collection = await figma.variables.getVariableCollectionByIdAsync(COLLECTION_ID);
const modeId = collection.modes[0].modeId;
const v = figma.variables.createVariable('name', collection, 'COLOR'); // or 'FLOAT'
v.setValueForMode(modeId, value);
v.scopes = ['ALL_SCOPES']; // or ['STROKE_FLOAT'] for borders, etc.
```

### Switching pages
```javascript
const page = figma.root.children.find(p => p.name === 'Page Name');
await figma.setCurrentPageAsync(page);
```

## Pages in the Figma File
```
Footer Dock 🟡       ← Footer Dock (2313:407)  [previously named "Components"]
Colors Foundations
Icons Foundations    ← Icon Holder (2169:2353)
Spacing Tokens
Text Styles
Spacing
Opacity & Overlay
Radius
Buttons 🟡           ← Button (33:5858), Icon Button (2434:80301),
                       Link Button (2691:4406), Heading (2703:5541)
Cards 🟡             ← Card (2655:3394), Card Section (2636:200), Card Tile (2630:224), Card Row (2616:234)
Alert 🟡             ← Alert (3184:16)  [page id 3171:8 — replaces deleted Toast page]
Avatar               ← Avatar (2269:5388), Avatar Stack (2386:68088)
Bottom sheet 🟡      ← Bottom Sheet (2444:82023), Filter Tab (2450:82201)  [was 🔴]
Modal 🟡             ← Modal (3227:8)  [page id 3226:8 — single mobile size, 328px fixed]
Misc. 🟡             ← iOS Notification Bar (2370:67930), Illustration Placeholder (2405:68395), Accordion (2414:70375)
Listing 🔴           ← Policy card components (WIP — do not implement yet)
✅ Heading           ← Reviewed standalone Heading instances
✅ Header            ← Reviewed standalone Header instances
Work in progress | IGNORE
```

See `.claude/indexes/figma-index.json` for the full registry of all component node IDs and page assignments.

## Common Gotchas
- `figma.currentPage = page` → ERROR. Use `figma.setCurrentPageAsync(page)`
- `getVariableCollectionById()` → ERROR. Use `getVariableCollectionByIdAsync()`
- `createVariable(name, collectionId, type)` → ERROR. Pass the collection **object**, not its ID string
- `node.textStyleId = id` → ERROR. Use `node.setTextStyleIdAsync(id)`
- Forgetting to load `Inter Regular` → ERROR when editing text nodes that default to Inter
- `v.resolvedValuesByMode` may be undefined — use `v.valuesByMode` instead
