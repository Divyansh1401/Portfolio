# Kinko Design System — Changelog

## 2026-05-18 (Input family Figma audit — Input / Search / Textarea / OTP)
User-driven update to the four input-related component sets in Figma (file `IDT7FF4CnWEMLfuwSCFQoa`). Figma is canonical for this pass; all changes flow into code. **No new tokens introduced. No semantic alias changes. All component-token bindings unchanged.**

### Figma → Code drift fixes

- **Input Field (`2051:694`)** — outer wrapper radius bumped `radius/8` → `radius/10` (inner field stays `radius/8`). Label rebound to `Label/Label-XS` (12 Medium), helper to `Body/Body-SM` (12 Regular). 23 component tokens in `VariableCollectionId:2225:3238` unchanged.
- **Search / Chat (`2876:4955`)** — pill radius preserved. Helper rebound to `Body/Body-SM` (12 Regular). Label was already `Label/Label-XS`. Reuses Input collection — no new vars.
- **Chat Box smart filter (`2876:5262`)** — frame renamed from "Textarea Input" → "Chat Box smart filter" (node ID unchanged). Outer wrapper radius bumped `radius/8` → `radius/10`. Wrapper min-height 104px unchanged. Reuses Input collection — no new vars.
- **OTP (`2231:3454`)** — digit-wrapper radius bumped `radius/8` → `radius/10` (digit box stays `radius/8`). Figma variable name path is now `otp/digit/cursor` (was `otp/cursor`) — variable ID stable. Assistive-row typography rebound: label → `Body/Body-XS` (10 Regular), hint + error → `Body/Body-SM` (12 Regular). 13 component tokens unchanged.

### Code patches

- **`css/input.css`** — `.input__wrapper { border-radius: var(--radius-10) }`.
- **`css/search-input.css`** — no CSS change; typography is applied via class on the HTML element, which the spec now documents.
- **`css/textarea-input.css`** — `.textarea-input__wrapper { border-radius: var(--radius-10) }`.
- **`css/otp.css`** — `.otp__digit-wrapper { border-radius: var(--radius-10) }`; CSS var `--otp-cursor` renamed `--otp-digit-cursor` (also updated the `caret-color` reference).
- **`components/input.md`** — Typography table refreshed (label `.text-label-xs`, helper `.text-body-sm`); Sizing table now lists outer wrapper radius + inner field radius separately; all HTML examples updated; 2026-05-18 changelog entry added.
- **`components/search-input.md`** — Helper class swapped to `.text-body-sm` in all HTML examples; Design-rules typography line updated; 2026-05-18 changelog entry added.
- **`components/textarea-input.md`** — Figma-name line added documenting the rename, Dimensions table split into wrapper / inner-field radii, Design-rules wrapper-radius note updated; 2026-05-18 changelog entry added.
- **`components/otp.md`** — Token table renamed `--otp-cursor` → `--otp-digit-cursor`; Sizing table wrapper radius 8 → 10; all HTML examples rebound to `.text-body-xs` / `.text-body-sm`; new 2026-05-18 changelog entry at the top.
- **Indexes** — `.claude/indexes/code-index.json`: Input + Search Input + Textarea Input + OTP Input entries gained `typography`, `radii`, expanded `subClasses` + `modifiers`, and updated `note`. `.claude/indexes/figma-index.json`: Input nodeId resolved (`TBD` → `2051:694`); Textarea entry now carries `figmaName` + `renamedFrom`; OTP nodeId resolved (`TBD` → `2231:3454`); notes updated.
- **`MEMORY.md`** — Input Field / Search Input / Textarea Input / OTP Input rows in the Components Built table updated with the 2026-05-18 audit details.

### Known follow-ups (logged, no action this pass)

- **Stale OTP node IDs.** The previously documented `2081:1528` (6 Digit OTP composite) and `2291:65586` (Input / Dial Code Addon) no longer resolve via `mcp__figma__get_metadata`. The current "4 Digit" variant in Figma actually renders 6 digit slots — variant name is misleading. Left as TBD pending designer follow-up.
- **Out of scope for this pass (per user direction):** `Frame 1410104613` (Search/chat with green circular send button) and the standalone `+91` country-code dropdown component visible in the canvas screenshot. Not formalized.
- **Pre-existing CSS hygiene note:** `.input__text`, `.search-input__text`, `.textarea-input__text`, `.otp__digit` set `font-size:` / `font-weight:` via raw `--font-size-*` / `--font-weight-*` tokens rather than applying a `.text-*` class — this predates the audit and was not changed.

## 2026-05-18 (Contact Us Card — new component, final-card exception)
- **Figma — new COMPONENT `Contact Us Card`** (`3662:13285`) on **Misc. 🟡** page (`2370:67895`). Promoted from the existing frame `3659:13264` (previously named `Need Help — C · Brand Hero Green`) by the user; the frame→component conversion reassigned the node ID and the rename was applied by the user before the audit. Dimensions 328×136 (mobile, fixed width × hug height).
- **Figma — gradient rebind on `3662:13285`** (the only outstanding §2a violation):
  - `gradientStops[0]` (inner) rebound from primitive `primary/green/800` (`VariableID:2135:1599`) → palette alias **`palette/green/shadow`** (`VariableID:3252:13`). Same `#003e0a` value.
  - `gradientStops[1]` (outer) rebound from primitive `primary/green/900` (`VariableID:2135:1600`) → palette alias **`palette/green/text-strong`** (`VariableID:3252:12`). Same `#001f05` value.
  - Pixel-identical render — no visual change.
- **Figma — final-card exception applied (CLAUDE.md §2a).** No `Contact Us Card` variable collection created. Layers / styles bind directly to semantic / palette tokens. Sibling exception member alongside Insurer Card. All other bindings on the component (padding, gap, radius, surface, text colors, INNER_SHADOW colors, icon Vector fills) were already correct — no other rebinds required.
- **Code — new spec `components/contact-us-card.md`** modeled on Insurer Card. Anatomy: text stack (title + subtitle) → 12px gap → tile row (3 × flex 1 tiles). Documents the final-card exception, the icon-color rule's brand-tinted-surface clause (tile icon `--text-brand` differs from tile label `--text-primary`), and the literal-1px-inset-shadow exception (no `--spacing-1` token).
- **Code — new CSS `css/contact-us-card.css`.** No `--contact-us-card-*` token layer. `.contact-us-card` width: 328px fixed, `.contact-us-card--fluid` modifier for 100%. Radial wash: `radial-gradient(ellipse 75% 110% at 27% 15%, var(--palette-green-shadow) 0%, var(--palette-green-text-strong) 100%)`. Tiles: `flex: 1 0 0`, `var(--surface-brand)` bg, `box-shadow: inset 0 1px 0 0 var(--surface-default), inset 0 -1px 0 0 var(--palette-green-text-strong)`, `color: var(--text-brand)` for icon currentColor, `.contact-us-card__tile-label` overrides to `var(--text-primary)`. `:focus-visible` ring uses `--border-focus` with offset `2px`. Imported in `css/index.css` after `insurer-card.css`.
- **Indexes — `.claude/indexes/code-index.json`:** new `Contact Us Card` entry with class, spec/css paths, sub-classes, modifier, Figma node, and composes list.
- **Indexes — `.claude/indexes/figma-index.json`:** new `Contact Us Card` entry on Misc. 🟡 (`2370:67895`) with dimensions, final-card-exception block listing all direct bindings, composes list (Icon Holder LG ×3 + Atom swaps), and the rebind note. `codeConnect: false` (pending mapping).
- **Design system — `design-system.md` Phase Status:** Contact Us Card row appended after Insurer Card.
- **MEMORY.md:** new Components Built row for Contact Us Card; Key Rules final-card exception line updated to list Contact Us Card alongside Insurer Card.
- **No new tokens.** Plan originally proposed adding `--palette-green-surface-deep` for the gradient inner stop, but `--palette-green-shadow` (`var(--color-primary-green-800)`) was already in `tokens/semantic.css:92` — reused directly.

## 2026-05-15 (Alert — Dark variant added)
- **Figma — new `Status=Dark` variant** (`3644:137`) in the Alert component set (`3184:16`). Cloned from `Status=Info`, then rebound. The set now has 5 variants total (Info / Success / Warning / Error / Dark). The `Status` variant property auto-extended to include `"Dark"` as a valid option.
- **Figma — 3 new component tokens** in collection `Alert` (`VariableCollectionId:3170:8`, now 17 → 20 vars):
  - `alert/bg-dark` (`VariableID:3643:8`) → semantic `text/primary` (navy-900) — root fill on dark variant
  - `alert/heading-dark` (`VariableID:3643:9`) → semantic `feedback/info-bg` (info-50) — heading text + info icon Vector + dismiss X Vector (icon-color hard rule)
  - `alert/text-body-dark` (`VariableID:3647:8`) → semantic `text/tertiary` (grey-500) — message body text on dark bg
- **Figma — bindings on the new variant** (`3644:137`):
  - Root fill → `alert/bg-dark`
  - Root stroke → kept as `alert/border-info` (info-200) — info-blue accent ring
  - Heading text → `alert/heading-dark`
  - Info icon Vector → `alert/heading-dark`
  - Dismiss X Vector → `alert/heading-dark`
  - Message text → `alert/text-body-dark`
  - 2 drop-shadow effects added (offsets 0/4 radius 12 + 0/2 radius 4 — matches Shadow/shadow/md pattern from the reference)
- **CSS — `css/alert.css`:** 3 new `:root` token aliases (`--alert-bg-dark` → `var(--text-primary)`, `--alert-heading-dark` → `var(--feedback-info-bg)`, `--alert-text-body-dark` → `var(--text-tertiary)`). New `.alert--dark` modifier — self-contained, sets bg + border-color + color (drives icon + dismiss via currentColor) + `box-shadow: var(--shadow-medium)`. Scoped overrides for `.alert--dark .alert__heading` and `.alert--dark .alert__message`.
- **Spec — `components/alert.md`:** Status table + Component Tokens table extended with the Dark row; variant count + token count bumped (4 → 5 variants, 17 → 20 tokens). New 2026-05-15 changelog entry.
- **Indexes — `.claude/indexes/code-index.json`:** Alert entry — `modifiers` extended with `alert--dark`, `componentTokens.figmaCovered` extended with the 3 new dark tokens, new `darkVariant` block (variant id, CSS modifier, token aliases, border inheritance, shadow). Note text updated. `lastUpdated` bumped.
- **Indexes — `.claude/indexes/figma-index.json`:** Alert entry — `variantCount` bumped 4 → 5, new `variants` map listing all 5 variant nodeIds (including `Status=Dark: 3644:137`), new `varCount: 20`, new `darkVariantTokens` block with the 3 new variable IDs, note text updated. `lastUpdated` bumped.
- **MEMORY.md:** Alert row updated — 17 → 20 vars, 4 → 5 variants, dark variant details appended.
- **No new semantic tokens.** All 3 new component tokens alias existing semantic tokens. Action link kept as `.link-btn.link-btn--info.link-btn--sm` — info-blue stays legible on the navy bg.
- **Border inheritance pattern:** the dark variant borrows the existing `alert/border-info` token instead of getting its own dedicated border token — per user direction to "only create tokens that are used in this reference only".

## 2026-05-15 (Comparison Table → Table Cell — full rename incl. tokens)
- **Figma — page renamed.** `Comparison Table 🟡` (`3039:8`) → `Table Cell 🟡`.
- **Figma — component set renamed.** `Comparison Table Cell` (`3041:40`) → `Table Cell`. All 49 variants (7 Type × 7 Tint) keep their existing nodeIds and variable bindings — only the parent set name changed.
- **Figma — variable collection renamed.** `Comparison Table` (`VariableCollectionId:3038:8`) → `Table Cell`. 34 variables renamed (variable IDs stable, names changed): every `comp-table/<rest>` → `table-cell/<rest>`. List:
  - Invariants (4): `comp-table/border` / `text-primary` / `text-secondary` / `text-disabled` → `table-cell/border` / `text-primary` / `text-secondary` / `text-disabled`
  - Bg per tint (15): `comp-table/bg/{default,neutral,brand,peach,navy,teal,mint,steel-blue,yellow,coral,purple,success,info,warning,error}` → `table-cell/bg/{...}`
  - Header-text per tint (15): same set, under `header-text/`
- **Figma — verification pass:** all 49 cell variants still render correctly; zero broken bindings since variable IDs are stable, only names changed.
- **Code — file renames:** `css/comp-table.css` → `css/table-cell.css`, `components/comp-table.md` → `components/table-cell.md`, `screens/comp-table-test.html` → `screens/table-cell-test.html`.
- **CSS — `css/table-cell.css` rewrite:** every `--comp-table-*` custom property renamed `--table-cell-*` (34 vars). Class renames: `.comp-table` (wrapper) → `.table-cell-grid`; `.comp-table__cell` (cell base) → `.table-cell`; `.comp-table__cell-title/-desc/-body/-slot` → `.table-cell__title/__desc/__body/__slot`; `.comp-table__cell--{type}` → `.table-cell--{type}` (7 types); `.comp-table__cell--tint-{tint}` → `.table-cell--tint-{tint}` (15 tints); `.comp-table--cols-{N}/--rounded/--bordered` → `.table-cell-grid--cols-{N}/--rounded/--bordered`; `.comp-table-stacked*` → `.table-cell-stacked*`. CSS variable `--comp-table-stacked-cols` → `--table-cell-stacked-cols`. **No new tokens, no semantic changes** — pure surface rename.
- **CSS — `css/index.css`:** import changed from `@import './comp-table.css';` to `@import './table-cell.css';`.
- **Spec — `components/table-cell.md`:** rewritten with the new class/variable surface; title changed `# Comparison Table` → `# Table Cell`; all code examples regenerated. Historical changelog entries (2026-05-04/06/08) left in place — they reference the names that were true at the time.
- **Screens — `screens/table-cell-test.html`:** all `.comp-table*` class references swapped to the new prefix. Title changed `Comparison Table — Component Test` → `Table Cell — Component Test`.
- **Indexes — `.claude/indexes/code-index.json`:** `Comparison Table` key renamed to `Table Cell`. Re-keyed `subClasses`, `containerModifiers`, `cellTypeModifiers`, `cellTintModifiers`, `stackedComposition` wrapper/group/values/modifiers. Added `renamedFrom`, `figmaNode`, `figmaPage`, `variableCollection` fields. Note text updated. `lastUpdated` bumped.
- **Indexes — `.claude/indexes/figma-index.json`:** page key `Comparison Table 🟡` → `Table Cell 🟡` (id `3039:8` preserved). Component map key `Comparison Table` → `Table Cell`. Inside the component entry: `page` updated, `collectionName` → "Table Cell", `varCount` corrected (32 → 34), all 34 `componentTokens` entries renamed, `codeFile` → `css/table-cell.css`, `note` updated. Added `renamedFrom` field. `lastUpdated` bumped.
- **`.claude/launch.json`:** preview server entry renamed `comp-table-test` → `table-cell-test` (port 3461 preserved).
- **MEMORY.md:** Components Built row renamed from "Comparison Table" → "Table Cell (was Comparison Table — renamed 2026-05-15)"; class names + variable names updated throughout the row.
- **Stale curl entries in `.claude/settings.local.json`** referencing the old `/screens/comp-table-test.html` URL left in place (permission entries — old URLs simply return 404 if reused; harmless).
- **No new tokens, no semantic changes, no Figma-binding changes.** This is a pure name migration so future readers / agents see "Table Cell" as the canonical name everywhere.

## 2026-05-15 (Filter Bar — removed from the design system)
- **Figma — component set deleted.** `Filter Bar` COMPONENT_SET (`2468:84432`) on `Buttons 🟡` page (`2193:2997`) was removed via `figma_use`. The set had 8 variants (State × Active Side: Default/Hover/Pressed/Focused/Disabled × None/Left/Right). Pre-deletion scan confirmed **zero INSTANCEs anywhere in the file** — no orphaned references after removal.
- **Figma — variable collection deleted.** `Filter Bar` variable collection (`VariableCollectionId:2468:84320`, 7 tokens: `filter-bar/bg`, `filter-bar/side-bg-hover`, `filter-bar/side-bg-pressed`, `filter-bar/text`, `filter-bar/icon`, `filter-bar/focus-ring`, `filter-bar/divider`) removed.
- **Code — files removed:** `css/filter-bar.css`, `components/filter-bar.md`, `filter-bar-test.html`.
- **Code — `css/index.css`:** removed `@import './filter-bar.css';` line.
- **Code — `.claude/launch.json`:** removed the `filter-bar-test` server entry (was on port 3458).
- **Indexes — `.claude/indexes/code-index.json`:** removed the `Filter Bar` entry.
- **Indexes — `.claude/indexes/figma-index.json`:** removed `Filter Bar` from the `components` map AND from the Buttons 🟡 page's `components` array. `lastUpdated` bumped to "Filter Bar removed from the system".
- **Docs — `design-system.md`:** Filter Bar row removed from the Phase Status table.
- **Docs — `components/chip-tag.md`:** descriptive reference reworded — "filter-bar navigation" → "chip-filter-bar navigation" (the mention was about `.chip-tab`, not the deleted Filter Bar component).
- **MEMORY.md:** Filter Bar row removed from the Components Built table. `--surface-inverse-hover` annotation updated to note the token is kept for reuse although its original consumer (Filter Bar) was removed.
- **No new tokens, no new components.** Pure removal. Two screens / concepts were scanned for `.filter-bar` consumers — none found, so no screen updates required.

## 2026-05-15 (Insurer Card — component tokens removed, final-card exception added)
- **CLAUDE.md §2a — new Exception clause** for *final / terminal composition cards* (non-interactive, leaf-level cards whose washes / gradients are re-skinned per use-case). Such components may skip the component-level token collection and bind layers / styles directly to semantic (or palette) tokens. Future cards that look like candidates must be **approved by the user before** skipping the component-token tier. Current members: **Insurer Card**.
- **Figma — deleted variable collection `Insurer Card`** (`VariableCollectionId:3550:9`) and its 6 vars:
  - `insurer-card/bg-top` (`VariableID:3550:10`) — was alias → `palette/steel-blue/bg-strong`
  - `insurer-card/bg-bottom` (`VariableID:3550:11`) — was alias → `surface/default`
  - `insurer-card/border` (`VariableID:3550:12`) — was alias → `border/subtle`
  - `insurer-card/highlight` (`VariableID:3550:13`) — was alias → `surface/default`
  - `insurer-card/title` (`VariableID:3550:14`) — was alias → `text/primary`
  - `insurer-card/description` (`VariableID:3550:15`) — was alias → `text/secondary`
- **Figma — rebound 6 layer bindings on the Insurer Card component (`3553:8`, `3553:26`, `3553:27`)** directly to the semantic / palette vars they previously aliased: gradient stop 0 → `palette/steel-blue/bg-strong`, gradient stop 1 → `surface/default`, stroke → `border/subtle`, INNER_SHADOW color → `surface/default`, title text fill → `text/primary`, description text fill → `text/secondary`. No visual change.
- **CSS — `css/insurer-card.css` rewritten:** entire `:root { … }` block removed (all 13 `--insurer-card-*` vars: 6 colors + 7 dimensional helpers). Selectors now reference base / semantic tokens directly (`--spacing-{4,8,12,24}`, `--radius-12`, `--border-width-small`, `--border-subtle`, `--palette-steel-blue-bg-strong`, `--surface-default`, `--text-primary`, `--text-secondary`, `--opacity-strong`). Width literal `235px` retained inline; file-header comment updated to flag the §2a exception.
- **Spec — `components/insurer-card.md`:** "Variable collection" line now reads "_none_ — final / terminal card, exception to CLAUDE.md §2a"; §Anatomy & specs token column reformatted to reference base tokens directly; §Tokens used → Component tokens table replaced with a single Exception note + "Semantic / palette tokens consumed directly" table; Changelog entry appended.
- **Indexes:**
  - `code-index.json` — Insurer Card entry: `variableCollection` removed, `tokens.figmaCovered` replaced with `{ componentLayer: false, note: "..." }`, note trimmed.
  - `figma-index.json` — Insurer Card 🟡 page note + Insurer Card component entry: `variableCollection`, `collectionName`, `tokens`, `variableIds` removed; notes trimmed; root `lastUpdated` bumped to 2026-05-15.
- **MEMORY.md:** Insurer Card row in the Components Built table refreshed (Figma Collection column → "_none_ — final card exception …"); new Key Rules bullet added for the final-card exception class.

## 2026-05-15 (Heading — Secondary size updated to Overline MD typography)
- **Spec — `components/heading.md`:** Secondary size now uses **`.text-overline-md`** (12 px ExtraBold, UPPERCASE, letter-spacing 2, line-height 1.5) — was previously `.text-title-xs` (13 px SemiBold). Reflects updated Figma source at node `2703:5541` (Buttons 🟡 page), variant `State=Secondary` (`2703:5539`). Primary and Large unchanged.
- **CSS — `css/heading.css`:** `.heading__text` gap reduced from `--spacing-4` to `--spacing-2` (4 px → 2 px) to match Figma source which uses `gap/2` between title and description. No new tokens introduced; structure, variants, props, and the existing 3 component tokens (`--heading-title`, `--heading-desc`, `--heading-cta`) all unchanged.
- **Spec HTML examples:** both Secondary HTML examples updated to use `.text-overline-md` on `.heading__title` instead of `.text-title-xs`. Note added that Overline MD is uppercase by design — content authors should write title-case text (e.g. "Section Title") and let the CSS apply uppercasing.
- **MEMORY.md:** Heading row in the Components Built table refreshed with the new Secondary typography and gap change.

## 2026-05-15 (Policy Detail screen — new canonical product screen)
- **New screen at `screens/policy-detail/index.html`** rebuilding the Editorial "Premium narrative" concept (`concepts/editorial/index.html`) using ONLY existing Kinko DS components and semantic tokens — zero hardcoded hex, zero hardcoded font-size / font-weight, zero new components, zero new tokens.
- 9 sections composed from DS primitives: dark hero (`.section--hero` + `.top-nav--dark` + `.card` on `--surface-brand`), stats strip (`.stats-strip` with per-instance light-bg overrides via `--stats-strip-value-color` / `--stats-strip-label-color`), policy info 2-col grid (`.card-row.card-row--white` + `.icon-box--md`), family members horizontal scroll (`.avatar` + `.label`), key-dates timeline (composition: vertical `.kn-timeline__line` + `.kn-timeline__dot` + content rows — gap-fill until a real `.timeline` component is formalised), transaction receipt (`.card-section--tinted` + `.price-row--total` + `.link-btn`), active claim card (`.card` + `.label--warning` + `.divider` + 2-col stack), portability teaser (`.list-item` with `.icon-box--sm` lead + `.link-btn--brand`), and KINKO CARE footer CTA (custom `.footer-cta` wrapper bound to `--surface-inverse` + nested `.btn--primary--sm`).
- New screen-local layout file at `screens/policy-detail/css/layout.css` mirroring the pattern at `screens/PolicyAnalyser/css/layout.css` (global box-sizing reset; section padding scale; `.h-scroll`, `.grid-2`, `.stack`, `.row` helpers; timeline composition utilities `.kn-timeline-*`).
- Responsive across mobile (375), tablet (768), desktop (1280+); section padding scales 16 → 24 → 32 via media queries.
- `.claude/launch.json` — added `policy-detail` server entry on port 3478 (autoPort).
- `.claude/launch.json` — also added `editorial-concept` entry on port 3477 to serve the original capture for side-by-side reference during iteration; the file `concepts/editorial/index.html` is a verbatim copy of the original `~/Downloads` HTML (unmodified, no embedded analytics).
- `.claude/indexes/code-index.json` — registered the new screen under `screens.policyDetail`.
- Three documented acceptable-literal exceptions in `layout.css` (no spacing token exists for these): viewport max-widths (600/768/1024px) and `.member-tile { width: 124px }` for horizontal-scroll tile sizing (analogous to the same pattern in the existing PolicyAnalyser screens; mobile-only literal). `.sr-only` accessibility helper uses the standard 1px / -1px values.

## 2026-05-14 (Insurer Card — new component)
- **Figma — new dedicated page `Insurer Card 🟡`** (`3550:8`) hosting the Insurer Card component.
- **Figma — new variable collection `Insurer Card`** (`VariableCollectionId:3550:9`, single mode `Default`) — 6 component tokens, all aliased to semantic (no primitive aliases). Scopes set explicitly per token.
  - `insurer-card/bg-top` (`VariableID:3550:10`) → `palette/steel-blue/bg-strong` — `[FRAME_FILL, SHAPE_FILL]`
  - `insurer-card/bg-bottom` (`VariableID:3550:11`) → `surface/default` — `[FRAME_FILL, SHAPE_FILL]`
  - `insurer-card/border` (`VariableID:3550:12`) → `border/subtle` — `[STROKE_COLOR]`
  - `insurer-card/highlight` (`VariableID:3550:13`) → `surface/default` — `[FRAME_FILL, SHAPE_FILL, EFFECT_COLOR]`
  - `insurer-card/title` (`VariableID:3550:14`) → `text/primary` — `[TEXT_FILL]`
  - `insurer-card/description` (`VariableID:3550:15`) → `text/secondary` — `[TEXT_FILL]`
- **Figma — new component `Insurer Card`** (`3553:8`) — single Default variant (no variant property) + 4 boolean component properties (`Logo#3553:0`, `Label#3553:1`, `Description#3553:2`, `Link#3553:3`, all default true). Composes existing components only: Illustration Placeholder 48 (`2405:68397`), Label SM Neutral (`3003:342`), Link Button Info SM Default (`2691:4286`). Boolean visibility wired via `componentPropertyReferences = { visible: 'Logo#3553:0' }` etc. The card's container fill is a GRADIENT_RADIAL paint with two stops, each stop's color bound to the relevant component token (top → `insurer-card/bg-top`, bottom → `insurer-card/bg-bottom`). Stroke bound to `insurer-card/border` (INSIDE, 1px). 2px top white highlight applied as an INNER_SHADOW effect with `color` bound to `insurer-card/highlight`. Title + description text fills bound to their respective component tokens.
- **Figma — spacing + radius tokens bound** on the component and its inner frames: card `paddingLeft/Right/Top/Bottom` → `gap/12` (`VariableID:10:1519`), card `itemSpacing` → `gap/24` (`VariableID:10:1522`), card corner radii (4 corners) → `radius/12` (`VariableID:12:77332`), Body frame `itemSpacing` → `gap/8` (`VariableID:10:1518`), Text stack `itemSpacing` → `gap/4` (`VariableID:10:1517`). No raw px values left in the component definition.
- **CSS — new file `css/insurer-card.css`:** 6 component tokens + 4 dimensional tokens at `:root` (all aliasing semantic). Selectors: `.insurer-card` (root: flex column, gap-block, padding 12, radius 12, 1px subtle border, radial-gradient bg, `box-shadow: inset 0 2px 0 0 var(--insurer-card-highlight)` for the top emboss), `.insurer-card--fluid` (width 100%), `.insurer-card--disabled` / `[aria-disabled="true"]` (`opacity: var(--opacity-strong)` + `pointer-events: none`), `.insurer-card__header` (flex row, space-between), `.insurer-card__body` (flex column, gap 8), `.insurer-card__text` (flex column, gap 4), `.insurer-card__title` (color only), `.insurer-card__description` (color only).
- **CSS — `css/index.css`:** new `@import './insurer-card.css';` appended.
- **Spec — `components/insurer-card.md`:** anatomy diagram, use cases (insurer listings — health/motor/life), props table, 3-tier token table, base tokens consumed, composed-components list, HTML for canonical + no-description + no-label + fluid + disabled, layout notes (horizontal scroll, single-column grid), distinct-from table (vs Promo Card / Content Card / Card Row / Hospital Row / Checkbox Card / Card), accessibility notes, changelog.
- **Indexes:** `code-index.json` `lastUpdated` bumped + new `Insurer Card` entry under `components`. `figma-index.json` `lastUpdated` bumped + new `Insurer Card 🟡` page entry + new `Insurer Card` component entry with all 6 component-token IDs recorded.
- **`design-system.md`:** new Phase Status row added under the Phase 1 list.
- **MEMORY.md:** new Insurer Card row appended to the Components Built table.
- **Decisions captured:**
  - Card is **non-interactive** — only the inner Link Button carries states (matches Promo Card pattern). User chose this over a whole-card hit-target.
  - Fixed 235px width matches the original Figma frame (`3548:1772`) + `.insurer-card--fluid` modifier for single-column grids.
  - Radial gradient stops are bound to component tokens — Figma supports `boundVariables.color` on individual `ColorStop` entries.
  - 2px inset top highlight rendered as Figma `INNER_SHADOW` (with `color` bound to `insurer-card/highlight`) and as CSS `box-shadow: inset 0 2px 0 0` — there is no separate "highlight" semantic token in the system; both layers alias `surface/default`.
  - No new semantic, primitive, or palette tokens introduced.
  - The original loose reference frame at `3548:1772` (Listing 🔴 page) is left in place for historical reference; the canonical component is `3553:8`.

## 2026-05-08 (Comparison Table — Brand tint accent rebound)
- **Figma — `comp-table/header-text/brand`** (`VariableID:3329:5877`) re-aliased: `palette/green/text` (green-700, `#005d10`) → `text/brand` (green-600, `#007c15` — system brand green, same value as `--action-primary`).
- **Figma — Brand-variant text fills re-bound to component token** (3-tier restored). Cells affected: `Type=Header, Tint=Brand` (`3329:5944`) HEADER text → `3329:5946`; `Type=Content, Tint=Brand` (`3329:5949`) "No room rent cap" title → `3329:5952`; `Type=Value, Tint=Brand` (`3329:5956`) "₹50,000" amount → `3329:5957`. All three were previously bound directly to the semantic token `text/brand` (a 3-tier violation introduced when the user tested the new color); they now bind back to `comp-table/header-text/brand`. Other Brand-variant text (description / "Per day" / Slot / Link Button) untouched.
- **CSS — `css/comp-table.css`:** `--comp-table-header-text-brand: var(--palette-green-text)` → `var(--text-brand)`. Single-line edit cascades to all three consumers: `.comp-table__cell--header.--tint-brand`, `.comp-table__cell--content.--tint-brand .cell-title`, `.comp-table__cell--value.--tint-brand .cell-title`.
- **Spec — `components/comp-table.md`:** tint table Brand row, "Brand exception" paragraph parenthetical, and component-token reference snippet all updated to `--text-brand`. New 2026-05-08 changelog entry added.
- **MEMORY.md:** Comparison Table row updated with the new brand alias note.
- **Other tints unchanged.** Neutral, palette (8 colors), and feedback (4 status) bg + header-text bindings untouched.
- **No new semantic tokens, no new primitives, no new CSS rules.**

## 2026-05-08 (Bottom Nav — new component)
- **Figma — page renamed** from `Bottom Nav` → `Bottom Nav 🟡` (page id `3491:14888`). The source frame was already on this page as an unwired `COMPONENT_SET` at `3491:14917`.
- **Figma — new variable collection `Bottom Nav`** (`VariableCollectionId:3499:40`, single mode `Default`) — 6 component tokens, all aliased to semantic (no primitive aliases). Scopes set explicitly per token.
  - `bottom-nav/bg` (`VariableID:3499:41`) → `surface/default` — `[FRAME_FILL, SHAPE_FILL]`
  - `bottom-nav/border` (`VariableID:3499:42`) → `border/subtle` — `[STROKE_COLOR]`
  - `bottom-nav/tab-bg-active` (`VariableID:3499:43`) → `palette/green/bg-strong` — `[FRAME_FILL, SHAPE_FILL]`
  - `bottom-nav/tab-border-active` (`VariableID:3499:44`) → `palette/green/text-strong` — `[STROKE_COLOR]`
  - `bottom-nav/tab-text` (`VariableID:3499:45`) → `text/secondary` — `[TEXT_FILL, SHAPE_FILL]`
  - `bottom-nav/tab-text-active` (`VariableID:3499:46`) → `surface/brand-inverse` — `[TEXT_FILL, SHAPE_FILL]`
- **Figma — variants renamed** from `Active=Home/People/Activity/Active4` → `Active=Home/Explore/Policies/Claims`. Inner tab frames in every variant also renamed `Home/People/Activity/Activity` → `Home/Explore/Policies/Claims` for layer-panel clarity.
- **Figma — token bindings applied** to all 4 variants × 4 tabs (52 mutated nodes): pill bar fill→`bottom-nav/bg`, stroke→`bottom-nav/border`, drop shadow `0 4 4 rgba(0,0,0,0.09)` retained as a Figma effect (no var, directional shadow). For each variant the active tab's fill→`bottom-nav/tab-bg-active`, stroke→`bottom-nav/tab-border-active`, label fill→`bottom-nav/tab-text-active`, with inner SVG Vector fills bound to the SAME `tab-text-active` token (icon-color hard rule). Inactive tabs cleared fill/stroke; label + icon Vector fills bound to `bottom-nav/tab-text`. White inset 2px top highlight on the active tab kept as a Figma `INNER_SHADOW` effect.
- **Figma — text style binding:** every label set to `Caption/Caption-SM-Medium` (`S:18bc0cf5ce2194aea93e196d229bd6fd64ea8635,`) via `setTextStyleIdAsync` — no unbound size/weight overrides.
- **Figma — `arrange_component_set`** run for the standard purple-dashed visualization. The arrange operation replaced the original `3491:14917` set; canonical component set is now `3491:15095`, container `3491:15096`.
- **CSS — new file `css/bottom-nav.css`:** 6 component tokens + 2 CSS-only composites (`--bottom-nav-shadow`, `--bottom-nav-tab-highlight`) at `:root` (all aliasing semantic). Selectors: `.bottom-nav` (outer wrapper, 16px gutters + 16px bottom safe-area), `.bottom-nav--fixed` (pin to viewport bottom, z-index 50), `.bottom-nav__bar` (flex row, padding 4, gap 10, `--radius-pill`, white bg + 1px subtle border + drop shadow), `.bottom-nav__tab` (flex 1 0 0, py 6, `--radius-pill`, transparent border-color so the active modifier can repaint without layout shift), `.bottom-nav__tab--active` (green-100 bg, green-900 stroke, inset white highlight, label/icon switch to green-800), `.bottom-nav__label`. Anchor and button both supported as inner tap targets.
- **CSS — `css/index.css`:** new `@import './bottom-nav.css';` appended.
- **Spec — `components/bottom-nav.md`:** anatomy diagram, properties table, 3-tier token table, fill/outline icon swap table per tab, HTML for default + `--fixed`, do/don'ts (locked label set, no add/remove tabs in v1), accessibility notes, changelog.
- **Indexes:** `code-index.json` `lastUpdated` bumped + new `Bottom Nav` entry under `components`. `figma-index.json` `lastUpdated` bumped + new `Bottom Nav 🟡` page entry + new `Bottom Nav Bar` component entry with all 6 component-token IDs recorded.
- **MEMORY.md:** new Bottom Nav row appended to the Components Built table.
- **Decisions captured:**
  - 4 fixed tabs locked (per user). Labels are not TEXT props — they're hardcoded Home/Explore/Policies/Claims to mirror the Kinko app IA.
  - Per icon-color hard rule, only ONE pair of label/icon tokens per state — no separate `bottom-nav/tab-icon*` tokens.
  - Pill drop shadow lives as a CSS composite, not a Figma var — directional shadows are not part of any token collection (same precedent as `--footer-dock-shadow-elevated`).
  - v1 ships default + active states only; pressed/hover deferred to v2.

## 2026-05-08 (Social Proof — new component)
- **Figma — new dedicated page `Social Proof 🟡`** (`3477:8`) hosting the Social Proof component set.
- **Figma — new variable collection `Social Proof`** (`VariableCollectionId:3477:9`, single mode) — 5 component tokens, all aliased to semantic (no primitive aliases): `social-proof/bg`→surface/default, `social-proof/bg-tinted`→surface/brand, `social-proof/text`→text/secondary, `social-proof/text-emphasis`→text/primary, `social-proof/icon-star`→palette/yellow/text-strong. Scopes set explicitly per token (FRAME_FILL/SHAPE_FILL for bg, TEXT_FILL for text, SHAPE_FILL+TEXT_FILL for icon).
- **Figma — new component set `Social Proof`** (`3483:51`) — 2 variants on `Tinted` property (False/True) plus 3 boolean component properties (`Avatar#3483:0` default true, `Rating#3483:3` default false, `Link#3487:0` default false). Each variant is 360×48 (mobile width). Composes existing components only: Avatar Stack 24 (`2386:67980`, with internal booleans 3rd=true / 3+=false → 3 visible avatars no overflow), Icon Holder XS (`2169:2358`) wrapping StarFour Outline-Fill (`2199:5634`), Link Button Info/SM/Default (`2691:4286`). Statement text "40L+ families insured with us" bound to Title-XS style; rating value "4.8" Title-XS; rating label "rated" Caption-MD. Boolean visibility wired via `componentPropertyReferences = { visible: 'Avatar#3483:0' }` etc.
- **Figma — demo wrapper** `Social Proof — Combinations` (`3488:154`) on the same page — renders 6 useful prop combinations side-by-side as a visual reference.
- **CSS — new file `css/social-proof.css`:** 5 component tokens at `:root` (all aliasing semantic) + 5 layout-only tokens (padding-y/x, gap-group/rating/right). Selectors: `.social-proof` (flex row, justify-between, flex-wrap), `.social-proof--tinted` (modifier — bg swap), `.social-proof__group`, `.social-proof__statement` (color only — typography via `.text-title-xs` class on markup), `.social-proof__right`, `.social-proof__rating` (gap 4 cluster), `.social-proof__star` (color inheritance), `.social-proof__rating-value`, `.social-proof__rating-label`. No interactive states.
- **CSS — `css/index.css`:** new `@import './social-proof.css';` appended.
- **Spec — `components/social-proof.md`:** anatomy diagram, slot table, properties table (Tinted variant + 3 booleans), 3-tier token table, typography table, 6 HTML examples (default / with rating / with link / statement only / tinted full / tinted minimal), do/don'ts, "Tinted vs Card Section" clarification, changelog.
- **Indexes:** `code-index.json` — new `Social Proof` entry with class names, modifiers, figma node, variable collection, token list, and contextual note. `figma-index.json` — new `Social Proof 🟡` page entry, new component entry with composition list (Avatar Stack 24, Icon Holder XS, StarFour-Fill, Link Button Info/SM), variant + boolean properties, demo frame reference.
- **MEMORY.md:** appended Social Proof row to component table.
- **No new semantic tokens.** All required colors (surface/default, surface/brand, text/secondary, text/primary, palette/yellow/text-strong) already exist.
- **Known constraint:** when `Rating` and `Link` are both on at viewport <360px, content overflows the strip horizontally. Documented in spec do/don'ts — guidance is to pick one in tight contexts.
- **Use cases:** above primary CTAs (quote/sign-up screens), top of landing pages, plan-listing screens, empty states, bottom-sheet headers.

## 2026-05-07 (Content Card / Image Top — sibling component)
- **Figma — new component set `Content Card / Image Top`** (`3468:387`, on **Cards 🟡** page) — sibling of `Content Card`. Built by cloning each of the 5 Content Card variants and reordering each variant's children with `insertChild(0, media)` so the media zone renders FIRST (visually on top in the auto-layout vertical structure). Then `combineAsVariants` to create the new component set.
- **Figma — page consolidation:** the Content Card 🟡 page (`3452:8`) created earlier the same day was merged into the existing **Cards 🟡** page (`2383:67950`). Both `Content Card` (`3460:48`) and `Content Card / Image Top` (`3468:387`) now live on Cards 🟡 alongside the existing Card / Card Section / Card Tile / Card Row / Hospital Row / Promo Card.
- **Figma — properties on the sibling set:** 5 State variants (Default/Hover/Pressed/Focused/Disabled) + 4 booleans (`Image#3468:0` / `Meta#3468:6` / `Label#3468:12` / `Slot Present#3470:0`, all default true). The original Figma SLOT property degraded to a regular FRAME during cloning — consumers fill the inner frame directly. **No new variable collection** — sibling reuses the same `VariableCollectionId:3452:9` (Content Card, 11 tokens).
- **CSS — `css/content-card.css`:** new modifier `.content-card--media-top`. Two declarations only:
  1. `.content-card--media-top { flex-direction: column-reverse; }` — flips the visual order
  2. `.content-card--media-top .content-card__top { padding-top: 0; padding-bottom: var(--content-card-padding); }` — flips `__top` padding so content has 12px breathing room from the bottom edge of the card (the media zone now provides the top edge).
- **Spec — `components/content-card.md`:** new modifier row in the CSS surface table; new "Image Top" HTML example added under "Variants"; changelog entry added.
- **Test page — `content-card-test.html`:** new section "Image Top variant" with 5 demo cards (default / info / no-meta / disabled / with-slot).
- **Indexes:** `code-index.json` — modifier list extended with `content-card--media-top`; `figmaPage` updated to `Cards 🟡 (2383:67950)`; `figmaSiblingNode` + `figmaSiblingName` fields added; note expanded. `figma-index.json` — Cards 🟡 page entry now lists Content Card + Content Card / Image Top; old Content Card 🟡 page entry marked `status: MERGED`; new top-level `Content Card / Image Top` entry with full property + variant + dimension info.
- **MEMORY.md:** Content Card row updated with the page move + sibling component info.
- **Use case:** hero / featured cards in editorial layouts where the image leads visually (recipe of the day, article-of-the-week, top-of-feed promotion).

## 2026-05-07 (Content Card — new component)
- **Figma — new page `Content Card 🟡`** (id `3452:8`) hosting the new component.
- **Figma — new variable collection `Content Card`** (`VariableCollectionId:3452:9`, 11 vars, single Default mode). All 11 tokens alias semantic vars — no primitive aliases.
  - Bg: `content-card/bg` → surface/default · `bg-hover` → surface/secondary · `bg-pressed` → surface/disabled.
  - Border: `border` → border/subtle · `border-hover` → border/default · `border-focused` → border/focus.
  - Text: `title` → text/primary · `title-disabled` → text/disabled · `meta` → text/tertiary · `meta-disabled` → text/disabled.
  - Media: `media-bg` → surface/secondary.
- **Figma — Component set `Content Card`** (`3460:48`) with 5 State variants (Default / Hover / Pressed / Focused / Disabled) and 4 boolean + 1 SLOT component properties: `Image#3460:0` / `Meta#3460:6` / `Label#3460:12` / `Slot Present#3448:217` (all default true) + `Slot#3448:223` (Figma SLOT type). Whole-card interactive — Focused uses 2px green ring (`--border-focus`); Pressed dims via `surface/disabled`.
- **Figma — Composition:** each variant uses an instance of the existing **Label SM Default** (`2041:388`) for the leading chip — consumer instance-swaps to any `.label--success/--info/--navy/--coral/...` variant. Title text bound to `Title-XS` style (`S:332080eed8e6442a4dd992c9dc08c33f8b19e99e,`); meta bound to `Caption-SM-Medium` (`S:18bc0cf5ce2194aea93e196d229bd6fd64ea8635,`). Title `maxLines: 2`, `textTruncation: "ENDING"`. Media zone is 172×93 flush full-width, anchored to bottom of auto-layout.
- **CSS — `css/content-card.css`:** new file. 11 component tokens at top (`:root`) aliasing semantic. Card root is `display: flex; flex-direction: column` with fixed `width: 172px; height: 218px; overflow: hidden`. 5 states via `:hover`, `:active`, `:focus-visible`, `.content-card--disabled`/`[aria-disabled="true"]`. Title clamped to 2 lines via `-webkit-line-clamp: 2`. Disabled dims label + media to `--opacity-strong` (0.50) and swaps title/meta to `--text-disabled`. Media uses `object-fit: cover` for inner `<img>`.
- **Spec — `components/content-card.md`:** new file. Documents 8 use cases (article / video / guide / podcast / webinar / etc) — all driven by free-text meta + consumer-chosen `.label--<variant>`. Distinct-from-other-cards table compares to `card`, `card-section`, `card-row`, `card-tile`, `promo-card`, `hospital-row`. Deferred items: landscape variant, hero variant, video play overlay, ribbon Tag overlay, multi-line meta.
- **CSS index — `css/index.css`:** `@import './content-card.css';` added after promo-card.
- **Indexes:** `code-index.json` and `figma-index.json` updated with the new component entry; `lastUpdated` bumped to 2026-05-07.
- **MEMORY.md:** Components Built table extended with the Content Card row.
- **Source design:** original 1-off "Health article" frame at `3444:14042` is the reference; component now supersedes it.
- **Deviations from original Figma reference (accepted):** title typography uses `.text-title-xs` (13 SemiBold) — closest token to original 12 SemiBold; media is now flush full-width (no 2/3px inset) with auto-layout vertical structure (per user updates during build review).

## 2026-05-06 (Checkbox Card — text color cascade rework)
- **Figma — new component token `checkbox-card/title-idle`** (`VariableID:3436:8`) added to `VariableCollectionId:3416:8` (collection now 15 vars). Aliases semantic `text/secondary` → grey-500.
- **Figma — 4 layers rebound** from semantic `text/secondary` direct → `checkbox-card/title-idle` (3-tier compliance fix). Affected layers across 3 variants: `State=Default` (icon Vector + title), `State=Hover` (icon Vector), `State=Focused` (title).
- **CSS — `css/checkbox-card.css`:**
  - Added `--checkbox-card-title-idle: var(--text-secondary)` to the Layer 3 token block.
  - Default state: both `.checkbox-card__icon-holder` and `.checkbox-card__title` now use `--checkbox-card-title-idle` (was `--checkbox-card-title`).
  - Hover state: title is promoted to `--checkbox-card-title` (navy-900); icon stays idle grey.
  - Focused state: icon is promoted to `--checkbox-card-title` (navy-900); title stays idle grey.
  - Selected / Selected Hover: both icon and title use `--checkbox-card-title` (navy-900) — explicit override added since the new default is grey.
  - Disabled / Disabled Selected: unchanged (still `--checkbox-card-title-disabled`).
- **Spec — `components/checkbox-card.md`:** Variants table expanded with Icon/Title color columns. Token mapping table now lists 4 text tokens (was 3). Changelog entry added.
- **Indexes:** `code-index.json` and `figma-index.json` token lists updated; `varCount` bumped 14 → 15; `lastUpdated` bumped.
- **Visual outcome:** card reads as low-emphasis grey by default; title lifts to navy on hover; icon lifts to navy on focus; both lift on selection. The "card lifts to active" interaction is now explicit, not implicit.

## 2026-05-06 (Checkbox Card — new component)
- **Figma — new page `Checkbox Card 🟡`** (id `3415:8`) hosting the new component.
- **Figma — new variable collection `Checkbox Card`** (`VariableCollectionId:3416:8`, 14 vars, single Default mode). All 14 tokens alias semantic vars (no primitive aliases).
  - Bg: `checkbox-card/bg` → surface/default · `bg-hover` → surface/secondary · `bg-disabled` → surface/disabled · `bg-selected-start` → surface/default · `bg-selected-end` → surface/brand · `bg-selected-hover-end` → surface/brand-hover.
  - Border: `border` → border/default · `border-hover` → border/strong · `border-selected` → action/primary · `border-disabled` → border/default · `border-disabled-selected` → action/disabled.
  - Text: `title` → text/primary · `title-disabled` → text/disabled · `description` → text/secondary.
- **Figma — Component set `Checkbox Card`** (`3426:40`) with 7 State variants (Default/Hover/Focused/Selected/Selected Hover/Disabled/Disabled Selected) and 2 boolean component properties (`Icon#3427:0` default true, `Description#3427:8` default false). Inner Checkbox Control instances per-state reuse the existing Checkbox Control set (`2237:3817` variants). Inner Icon Holder LG (`2169:2356`) icon Vector fill bound to `checkbox-card/title` (or `checkbox-card/title-disabled` on disabled states) — icon shares the title token rather than carrying a separate `icon` token.
- **Figma — Demo frame** built at `3428:40` showing 3 Checkbox Card instances composed as a time-slot multi-select group.
- **Figma — Cleanup:** the obsolete 2-variant prototype frame `3408:9923` (was on `Checkbox 🟡` page, misleadingly named `Property 1=Radio, Property 2=Item Boxed` despite using checkbox controls) was deleted. The new component supersedes it.
- **CSS — new file `css/checkbox-card.css`** (16 component tokens — 14 color + 2 composite gradient). Uses Layer 3 token block pattern (A: color tokens, B: composite gradients) mirroring `css/checkbox.css`. Two composite gradient tokens are CSS-only and not represented in Figma: `--checkbox-card-bg-selected` (linear-gradient white→green-50) and `--checkbox-card-bg-selected-hover` (linear-gradient white→green-100). Component selectors drive 7 states via `:has()` pseudo-classes. Width modifier: `.checkbox-card--fluid` switches from fixed 100px to 100%.
- **CSS — `css/index.css`:** added `@import './checkbox-card.css';` line after `checkbox.css`.
- **Spec — new file `components/checkbox-card.md`** with Overview, Changelog, Figma references, Variants/States table, Sub-elements + Sizing table, full Token Mapping table (Layer 3 → Layer 2 trace), Use Cases section (time-slot multi-select / coverage feature toggles / document-type pickers / service add-ons grids / hospital filters / symptom multi-select / appointment slot picker), HTML examples (Default / Selected with description / Disabled / Fluid / Group fieldset), and Do's/Don'ts.
- **Indexes:**
  - `code-index.json` — added `Checkbox Card` component entry under `components` block (subClasses, modifiers, figmaNode, variableCollection, componentTokens covered, full note).
  - `figma-index.json` — added `Checkbox Card 🟡` page entry and `Checkbox Card` component entry (page, nodeId, variantCount, variableCollection, varCount, componentTokens, booleanProps, innerComponentReuse).
- **First-time pattern in the system:** vertical gradient bg on a boxed-selection state. All previous boxed selections (radio-item--boxed, checkbox-item--boxed) use solid fills. Memory updated with this gotcha + the convention that in-card icons should bind to the same component token as the label text.

## 2026-05-06 (Divider — Gradient variant added)
- **Figma — Divider COMPONENT_SET (`2270:5446`):** Added `Type=Horizontal, Style=Gradient` variant (node `3402:9809`). Horizontal linear gradient: `transparent 0% → divider/color 50% → transparent 100%`. Reuses existing `divider/color` token (`#c4c8ce`) — no new Figma variable, no semantic token change.
- **CSS — `css/divider.css`:** Added `.divider--gradient` modifier rendering `linear-gradient(to right, transparent 0%, var(--divider-color) 50%, transparent 100%)`. No new component-level token.
- **Spec — `components/divider.md`:** Updated variant table and HTML examples to include gradient. Changelog entry added.
- **Indexes:** `code-index.json` Divider entry now lists modifiers; `figma-index.json` Divider entry now lists all 7 variant node IDs (was `nodeId: TBD`).

## 2026-05-06 (Comparison Table — Stacked-row composition pattern)
- **New pattern documented:** stacked-row plan comparison (mixed full-width rows + N-col value rows). Reuses existing comp-table cells — no new component or cell variant. Reference Figma frame: node `3373:9448`.
- **CSS — `css/comp-table.css`:** Added `.comp-table-stacked` / `.comp-table-stacked__group` / `.comp-table-stacked__values` wrapper classes (flex-based, painted-bg + 1px gap divider trick at each nested level). `--grid` modifier on values row for parameterised column count. `--rounded` and `--bordered` outer chrome modifiers mirror `.comp-table`.
- **Spec — `components/comp-table.md`:** New "Stacked-row plan comparison" section under HTML examples with structure diagram, cell mapping, full HTML recipe, wrapper CSS, and usage notes (when to use, how to highlight a recommended plan column with `--tint-brand`, why this can't be retrofit into `.comp-table--cols-3`). Changelog entry added.
- **No new tokens, no new cell types.** Pure composition pattern — Content + Header cells with existing tints, just rearranged.

## 2026-05-06 (Comparison Table — Brand tint redesigned)
- **Figma — Comparison Table collection (`VariableCollectionId:3038:8`):**
  - `comp-table/bg/brand` (`VariableID:3329:5863`) rebound: `surface/brand` (green-50) → `surface/default` (white).
  - `comp-table/header-text/brand` (`VariableID:3329:5877`) unchanged — still aliases `palette/green/text`.
- **Figma — Cell variants (set `3041:40`):** Brand variant text fills extended beyond Header. Type=Content, Tint=Brand (`3329:5949`) and Type=Value, Tint=Brand (`3329:5944`/`3329:5957`) now have their primary text bound to `comp-table/header-text/brand` (was `comp-table/text-primary`). Description / secondary text unchanged.
- **CSS — `css/comp-table.css`:**
  - `--comp-table-bg-brand` alias: `var(--surface-brand)` → `var(--surface-default)`.
  - Added rule pairing `.comp-table__cell--content.comp-table__cell--tint-brand .comp-table__cell-title` and `.comp-table__cell--value.comp-table__cell--tint-brand .comp-table__cell-title` to `var(--comp-table-header-text-brand)`. All other tints unaffected.
- **Spec — `components/comp-table.md`:** Tint table updated (Brand row bg = white). Tint section gains a "Brand exception" note. Component tokens block + Figma docs reflect new bg alias. Changelog entry added.
- **Visual outcome:** Brand column now reads "white bg + green text" — distinguished from Default (white bg + navy text) by text color alone.

## 2026-05-06 (Color tokens — scope opened to ALL_SCOPES)
- **Figma — bulk variable scope update.** All 764 COLOR variables across all 47 collections (Primitives, Semantic, Overlay, and 44 component collections) now have `scopes = ['ALL_SCOPES']`. 229 variables updated this run (535 already had ALL_SCOPES). This makes every color token pickable in every property picker — Fill on Frame/Shape/Text, Stroke, Effects.
- **Affected collections (229 vars updated):** Semantic (52), Button (15), Label (20), Avatar Stack (3), Heading (3), Chat Message (5), Hospital List Item (13), Price Footer (6), Comparison Table (34), Menu Item (8), Date Picker (10), List Item (10), Price Row (7), Alert (17), Modal (3), Tag (13), Toast (7), Stats Strip (3).
- **No code-side change** — scopes are a Figma-only metadata property that only affect the property-picker UX. CSS surface and token aliases are unchanged.
- **Trade-off:** Property pickers will now list every color in the system (vs. the previous narrow-scope filtering). This was an explicit design decision to maximise flexibility for designers.

## 2026-05-05 (Radio Item Boxed — Selected/Focused state redesign)
- **Item Boxed Selected** now reads white bg + green border (2px) — was navy-50 bg + green border (1px). The white-bg+green-border look is the new "selected" affordance.
- **Item Boxed Focused** now visually matches Default at the box level (white bg + grey-200 border, 1px). Focus is signalled by the inner Control's existing green focus ring. Box-level focus styling is intentionally minimal.
- **Figma — Radio variable collection (`VariableCollectionId:2235:3605`):**
  - `radio/boxed/bg-selected` (`VariableID:2235:3625`) rebound: `surface/selected` → `surface/default`.
  - `radio/boxed/bg-selected-hover` (`VariableID:2235:3626`) rebound: `surface/active-tint` → `surface/secondary`.
  - **Deleted** `radio/boxed/border-focused` (was `VariableID:2235:3630`). Collection now has 27 vars (was 28).
- **Figma — Variants (Forms / Radio / Item Boxed `2082:1514`):**
  - State=Focused (`2082:1486`): stroke rebound from `radio/boxed/border-focused` → `radio/boxed/border`; strokeWeight 2 → 1.
  - State=Selected (`2082:1491`): fill rebound from direct `surface/default` semantic → `radio/boxed/bg-selected` component token (3-tier compliance fix; visual unchanged).
- **CSS — `css/radio.css`:**
  - `--radio-boxed-bg-selected` alias: `--surface-selected` → `--surface-default`.
  - `--radio-boxed-bg-selected-hover` alias: `--surface-active-tint` → `--surface-secondary`.
  - Removed `--radio-boxed-border-focused` token and the `.radio-item--boxed:has(.radio-item__input:focus-visible)` rule.
  - `.radio-item--boxed:has(.radio-item__input:checked)` now sets `border-width: var(--border-width-large)` (2px) to match Figma Selected variant.
- **Spec — `components/radio.md`:** Changelog entry added. State table updated. Boxed Background and Border token tables updated. "New Semantic Token Added" subsection (referring to `--surface-selected`) removed since the token is no longer added by Radio.
- **Semantic tokens unchanged:** `--surface-selected` and `--surface-active-tint` are kept (used by Button stroke hover/pressed, Checkbox boxed checked, OTP, Input, Textarea, Search Input).

## 2026-05-04 (Stats Strip — provisional component, code + Figma)
- **New page:** `Stats Strip 🟡` (`3331:6227`).
- **Variable collection** `Stats Strip` (`VariableCollectionId:3331:6228`) — single mode (Default), 3 vars: `stats-strip/label` (`VariableID:3331:6229`) → text/tertiary, `stats-strip/value` (`VariableID:3331:6230`) → text/inverse, `stats-strip/icon` (`VariableID:3331:6231`) → text/inverse.
- **`Stats Strip Column` COMPONENT_SET** (`3331:6246`) — 3 Type variants: Trigger / Static / Link. Trigger has trailing `.icon-holder--xs` caret-down; Link has underline; Static has neither. Component-set background is bound to navy-900 to mirror real-world dark header context. All text + icon fills bound to component tokens.
- **`Stats Strip` parent COMPONENT** (`3331:6247`) — 360×64 horizontal assembly, navy-900 bg, 3 column instances (2 × Trigger + 1 × Link, each `layoutSizingHorizontal=FILL`). Default text matches Listing screen reference (Active Coverage / Change plan type / Hospital Cover).
- **Tinted usage example frame** (`3331:6265`) — demonstrates per-instance fill rebind pattern: ₹5L → `system/success/200`, Platinum → `tertiary/purple/200`, 1500+ → `system/info/300`.
- **Code:** `css/stats-strip.css` + `components/stats-strip.md` + import in `css/index.css`. `code-index.json` and `figma-index.json` Stats Strip entries added; MEMORY.md row added.
- **Status: PROVISIONAL.** Intentionally minimal — no Tint variant in Figma, no interactive states, accents use primitives directly. Follow-up tracked in TodoWrite to add Tint variants + semantic accent tokens + interactive states.

## 2026-05-04 (Comparison Table — token architecture restructured)
- **Why:** Figma library cap is 10 modes; the Comparison Table collection had hit 15. Migrated to a Label-style flat-token architecture so the collection is single-mode again.
- **Figma — Variables (`VariableCollectionId:3038:8`):**
  - Renamed `comp-table/bg` → `comp-table/bg/default` (existing ID `VariableID:3038:9`).
  - Renamed `comp-table/header-text` → `comp-table/header-text/default` (existing ID `VariableID:3038:10`).
  - Created **28 new tint-specific vars**: 14 × `comp-table/bg/{tint}` (`VariableID:3329:5862` → `:5875`) + 14 × `comp-table/header-text/{tint}` (`VariableID:3329:5876` → `:5889`). Each aliases the corresponding semantic token (`surface/*`, `palette/{color}/{bg|text}`, `feedback/{x}-{bg|text}`).
  - Deleted 14 modes (Neutral / Brand / Peach / Navy / Teal / Mint / Steel Blue / Yellow / Coral / Purple / Success / Info / Warning / Error). Only `Default` (mode `3038:0`) remains.
  - Final shape: **1 mode × 32 vars** (4 invariants + 14 bg + 14 header-text). Was: 15 modes × 6 vars.
- **Figma — Cell component set (`3041:40`):**
  - Added `Tint` as a real Figma variant property with 7 values: `Default · Neutral · Brand · Success · Info · Warning · Error`.
  - Cloned each of the 7 existing Type variants 6 times (one per non-default tint), rebinding `bg` and (for Header) icon Vector + HEADER text fills to the appropriate `comp-table/{bg,header-text}/{tint}` var. Now **49 variants** (7 Type × 7 Tint), arranged in a clean 7×7 grid (rows = Type, cols = Tint).
  - Existing 7 Type variants renamed to `Type=X, Tint=Default`.
  - **Palette tints** (Peach / Navy / Teal / Mint / Steel Blue / Yellow / Coral / Purple) are intentionally NOT exposed as variants. To use them, designers detach the cell instance's bg paint binding and rebind it to `comp-table/bg/{tint}` (and `comp-table/header-text/{tint}` for Headers) via the Variables panel.
- **Figma — Templates updated:** 26 instance variant-tint mode-overrides swapped to the new `Tint` variant property; 6 Peach instances in the 2-col Reference template (`3043:22`) rebound at the instance level. All explicit-mode overrides cleared. Three demo frames render visually identically to before.
- **CSS — `css/comp-table.css`:** Header comment updated to describe the new architecture. **No structural CSS changes** — the existing token fan-out (`--comp-table-bg-{tint}`, `--comp-table-header-text-{tint}`) and 15 `.comp-table__cell--tint-*` modifier classes were already aligned with this design and continue to work unchanged.
- **Spec — `components/comp-table.md`:** Changelog entry appended; Figma section rewritten to document the Tint variant + palette-rebind hybrid; component token list expanded.
- **Indexes:** `figma-index.json` Comparison Table entry rewritten with the new variant grid, full 32-token map, palette-tint note, and varCount/modeCount. `code-index.json` note updated.
- **MEMORY.md:** Comparison Table row rewritten to reflect 1-mode + 49-variant structure and the variant-vs-rebind tint split.

## 2026-04-30 (Avatar — ring refactor + checkbox anchoring)
- **Figma cleanup** — removed the sibling `ring` FRAME on all 14 Avatar variants under component set `2269:5388`. The 2px INSIDE stroke (bound to `avatar/ring` = `VariableID:2269:5274`, green-500) is now applied directly to the `avatar-circle` FRAME on the 7 Selected=True variants. Selected=False variants have no stroke.
- **Figma layout update (by user)** — variant outer dimensions are now exactly Size×Size (24, 32, 40, 64, 72, 90, 124). The Checkbox Control instance is now `layoutPositioning='ABSOLUTE'`, anchored to the top-right corner *inside* the variant bounds (e.g. for 72: checkbox at `(48, 0)`).
- **CSS — `css/avatar.css`:**
  - Removed `.avatar::after` and `.avatar--selected::after` rules.
  - Added `border: 2px solid transparent` + `box-sizing: border-box` to `.avatar__circle`. Selected color toggles via `.avatar--selected .avatar__circle { border-color: var(--avatar-ring); }`.
  - `.avatar__check` repositioned from `top:-6px right:-2px` (outside bounds) to `top:0 right:0` (inside bounds) — matches the new Figma anchoring.
- **Spec — `components/avatar.md`:** Visual Structure tree updated; "Don't" rule rephrased to reference `.avatar__circle`; Changelog entry appended.
- **No token changes.** `--avatar-ring` (green-500) and `--avatar-ring-default` (grey-200) remain defined; Figma variable `avatar/ring` (`VariableID:2269:5274`) unchanged.

## 2026-04-29 (Palette strong tokens — full color symmetry)
- **15 NEW palette strong/shadow tokens** added for the 5 colors that previously only had `bg` + `text` (navy/teal/steel-blue/mint/peach), so all 9 palette colors now share the same 5-variant shape (`bg`, `bg-strong`, `text`, `text-strong`, `shadow`).
  - **Figma:** created in Semantic collection (`VariableCollectionId:2156:1906`) under nested names `palette/{navy,teal,steel-blue,mint,peach}/{bg-strong,text-strong,shadow}`. IDs `VariableID:3264:5479` → `:5493`. Each aliases its corresponding primitive (100 / 900 / 800). Scopes: `FRAME_FILL, SHAPE_FILL, TEXT_FILL, STROKE_COLOR, EFFECT_COLOR`.
  - **CSS:** added 15 matching `--palette-{color}-{bg-strong, text-strong, shadow}` vars to `tokens/semantic.css`. Strong section reordered to match the soft section's color order (navy → green → teal → steel-blue → mint → peach → yellow → coral → purple).
  - **No source JSON** — palette tokens remain CSS-only by convention.
- Total palette tokens now: 45 — 9 colors × 5 variants. Previous: 30 (9 × 2 soft + 4 × 3 strong).
- No existing components currently consume the new tokens; available for future Tag-style components targeting cool/neutral hues (e.g. navy/teal accents).

## 2026-04-29 (Figma rename — palette token reorg)
- **Figma-only rename** of the 12 strong palette tokens added yesterday for the Tag component. Tokens regrouped under each color so the Variables panel nests cleanly by color, then role:
  - `palette/yellow-bg-strong` → `palette/yellow/bg-strong`
  - `palette/yellow-text-strong` → `palette/yellow/text-strong`
  - `palette/yellow-shadow` → `palette/yellow/shadow`
  - `palette/green-bg-strong` → `palette/green/bg-strong`
  - `palette/green-text-strong` → `palette/green/text-strong`
  - `palette/green-shadow` → `palette/green/shadow`
  - `palette/coral-bg-strong` → `palette/coral/bg-strong`
  - `palette/coral-text-strong` → `palette/coral/text-strong`
  - `palette/coral-shadow` → `palette/coral/shadow`
  - `palette/purple-bg-strong` → `palette/purple/bg-strong`
  - `palette/purple-text-strong` → `palette/purple/text-strong`
  - `palette/purple-shadow` → `palette/purple/shadow`
- Result: in Figma's Semantic collection panel, every color now groups its 5 variants together — `palette/yellow/{bg, bg-strong, text, text-strong, shadow}`, etc. — alongside the already-nested soft tokens for navy, teal, steel-blue, mint, peach.
- **Variable IDs unchanged** — Tag component bindings on `tag/bg-yellow`, `tag/text-*`, `tag/shadow-*` remain valid (Figma renames preserve IDs).
- **CSS untouched** — `--palette-{color}-{role}` naming (e.g. `--palette-yellow-bg-strong`) already mirrors the new Figma slash hierarchy via `-` ↔ `/` mapping. No rename needed in `tokens/semantic.css` or any component CSS.
- **Source JSON unchanged** — palette tokens are CSS-only by convention (no entry in `tokens/source/semantic-colors.json`).
- Updated `references/figma-api.md` — Tag alias table now references the nested names.
- 18 soft palette tokens (navy/green/teal/steel-blue/mint/peach/yellow/coral/purple at `bg`/`text`) were already correctly nested — no change there.

## 2026-04-29 (New component — Chatbox; index sync)
- **New component — Chatbox** (`2914:9286`) on **Chatbot 🟡** page (`2905:8`). Chat thread message bubble for the Kinko AI assistant.
  - Variable collection: **"Chat Message"** (`VariableCollectionId:2908:8`) — 5 component tokens, prefix `chat-msg/` (collection name differs from component name; CSS class + `--chatbox-*` prefix follow the component name).
  - 3 Type variants (AI / User / Follow-ups) × `Ai CTA` boolean (default `true`).
  - AI bg → `surface/brand` (green-50). User bg → `surface/chat-user` (#fbf3e1, tertiary-yellow-100). CTA strip bg → `surface/brand-hover` (green-100). Text → `text/primary`. Time → `text/secondary`.
  - Asymmetric tail radius: 12/12/12/2 for AI/Follow-ups (bottom-left pinched), 12/12/2/12 for User (bottom-right pinched). `overflow: hidden` on `.chatbox__container` so the bubble + CTA strip share one rounded clip.
  - Body text = `.text-body-sm` (12 Regular). Time = `.text-caption-sm-medium` (10 Medium). Follow-ups stacks `.chip.chip--info` instances. CTA inside the strip is always `.btn.btn--ghost.btn--sm`.
  - **Code:** `css/chatbox.css` + `components/chatbox.md` added; `@import './chatbox.css';` registered in `css/index.css` (46 imports total).
- **Index sync — `figma-index.json` brought up to date with codebase:**
  - Added 5 missing component entries: `Search Input` (`2876:4955`), `Textarea Input` (`2876:5262`), `List Item` (`3154:28`), `Price Row` (`3166:120`), `Chatbox` (`2914:9286`).
  - Added 4 missing page entries: `Tooltip 🟡` (`2342:67091`), `Tabs 🟡`, `Progress Bar 🟡`, `Chatbot 🟡` (`2905:8`).
  - Bumped `lastUpdated` on both `code-index.json` and `figma-index.json` to `2026-04-29`.
- **MEMORY fix:** Chatbox row corrected — page was previously listed as `Misc. 🟡`, actual page is `Chatbot 🟡`; token prefix corrected from `chatbox/` to `chat-msg/`; `cta-bg` alias corrected from `surface/default` to `surface/brand-hover`.
- **Out of scope (skipped per user direction):** Page-key renames to add the `✅` checkmark prefix on `Icons Foundations`, `Spacing Tokens`, `Text Styles`, and `Radius` — those format mismatches remain.
- Resolves all High / Medium / Hygiene findings from the 2026-04-29 audit (`Discrepancies.md`) except the deliberately-deferred Low-severity page renames.

## 2026-04-29 (New component — Tag)
- **Page renamed:** `Labels` → `✅ Labels/ Chips/ Tags` (`2232:3588`) — now hosts Tag alongside the existing Labels and Chip component sets.
- **Tag** (`3256:282`) — promotional ribbon-shape badge for content emphasis ("Best Value", "New", "Limited", "Featured"). **Distinct from Label** (status indicators) and **Chip** (filter pills).
  - 4 Status variants: Yellow / Green / Coral / Purple.
  - Variable collection `VariableCollectionId:3253:8` "Tag" with **13 component tokens** (12 status × 3 + 1 shared white highlight).
  - **Signature ribbon shape:** asymmetric radius — `--radius-pill` (left), `0` (right). Flat right edge points away from the card corner it's anchored to.
  - **Dual-shadow emboss:** `box-shadow: 0 1px 0 0 var(--tag-shadow-{status}), inset 0 1px 0 0 var(--tag-highlight)` — drop shadow at the bottom (palette-800) + white inset at the top — paper-ribbon depth without a real border.
  - **No border** (per design decision).
  - Default icon: **StarFour Outline Fill** (`2199:5634`) wrapped in `.icon-holder--xs` (12px). Icon color inherits text via `currentColor`.
  - Padding `4 4 4 8` (top/bottom/right/left), gap `4`, label uses `.text-caption-sm-medium` (10 Medium).
- **12 NEW semantic palette tokens** added to `tokens/semantic.css` (CSS-only — palette tokens don't have a JSON source):
  - `--palette-{yellow,green,coral,purple}-bg-strong` → palette `*-100`
  - `--palette-{yellow,green,coral,purple}-text-strong` → palette `*-900`
  - `--palette-{yellow,green,coral,purple}-shadow` → palette `*-800`
  - These supplement existing Label palette tokens (`*-bg`/`*-text` at 50/700) — same 4 colors, stronger shades, plus a shadow shade.
- **Code:** `css/tag.css` (13 component tokens, ribbon shape, dual shadow per modifier) + `components/tag.md` (full spec with 4 recipes + card-anchor pattern) added; import added to `css/index.css`; `tag-test.html` covers all 4 variants and a card-anchor demo — verified in preview server (port 3464).
- **Indexes:** `code-index.json`, `figma-index.json`, `MEMORY.md`, `references/figma-api.md`, `design-system.md` updated.
- Completes plan to-do item #6 (Tags). Items #4 (Skeleton) and #5 (Breadcrumbs) remain deferred.

## 2026-04-29 (New component — Modal)
- **New page:** `Modal 🟡` (`3226:8`).
- **Modal** (`3227:8`) — center-anchored mobile overlay panel. **Single component, no variants.** Fixed 328px width (mobile-only v1).
  - Variable collection `VariableCollectionId:3226:9` "Modal" with 3 component tokens — all alias existing semantic tokens (no new semantics introduced):
    - `modal/overlay` → `overlay/65`
    - `modal/bg` → `surface/default`
    - `modal/border` → `border/default`
  - Composition: `Header` (single component `2413:68695`) + `Slot` (Figma SLOT type for body) + `Footer Dock` (default `Style=Flat, Layout=Dual`).
  - Boolean prop: `Footer` (default true) toggles Footer Dock visibility.
  - Border radius `--radius-16` on all 4 corners; 1px hairline border via `border/default`; max-height `90vh` with `.modal__content` internal scroll.
  - `.modal-overlay` is `position: fixed`, `inset: 0`, with 16px padding gutter so the panel never touches viewport edges on tiny screens.
  - **Header padding override (hard rule):** `.modal .top-nav { padding: 0 var(--spacing-16) }` neutralises Header's responsive padding (16/24/32/48). Only allowed override of Header from a consumer; never fork Header.
  - **No animation, no a11y wrapper in v1** — both are screen-level concerns. Markup uses `role="dialog"` + `aria-modal="true"`; click-outside / ESC dismissal handled at screen level.
- **Code:** `css/modal.css` + `components/modal.md` added; import added to `css/index.css`; `modal-test.html` covers all 5 recipes (title only / title+close+single CTA / form fields / destructive / long-content scroll) — verified in preview server (port 3463).
- **Footer Dock fix (caught during Modal build):** `.footer-dock` was missing `box-sizing: border-box`. With `width: 100%` + 16px horizontal padding, its outer width was 32px wider than its parent — which inside Bottom Sheet (full-width on mobile) clipped invisibly off-screen, but inside Modal (328px) clipped visibly on the right edge. Added `box-sizing: border-box` globally to `.footer-dock`. No regression: Bottom Sheet still renders identically since its `overflow: hidden` was already clipping the overflow.
- **Indexes:** `code-index.json`, `figma-index.json`, `MEMORY.md`, `references/figma-api.md`, `design-system.md` updated.

## 2026-04-29 (New component — Alert; Toast deprecated)
- **New page:** `Alert 🟡` (`3171:8`).
- **Alert** (`3184:16`) — inline persistent alerts for regulatory notices, claim status, validation, payment errors. 4 Status variants (Info / Success / Warning / Error) × 5 boolean props (`Icon`=true default; `Heading` / `Dismiss` / `Slot` / `Action`=false).
  - Variable collection `VariableCollectionId:3170:8` "Alert" (17 component tokens, 3-tier).
  - Bg=`feedback/{status}-bg` (50), border=`feedback/{status}-border` (200), icon=`feedback/{status}-text` (700), heading=`feedback/{status}-strong` (800), body=`text/primary` (always navy-900 — legibility against tinted bg).
  - Padding 12 all sides, gap 8 root + body internal. Heading and dismiss live inline in `.alert__row`; message + slot + action stack below.
  - Typography: Heading=`.text-title-xs` (13 SemiBold), Message=`.text-body-sm` (12 Regular).
  - Action uses `.link-btn.link-btn--info.link-btn--sm` (info-blue regardless of status — keeps action quieter than the status tint). Dismiss uses `.icon-btn.icon-btn--ghost.icon-btn--xs`.
- **3 NEW semantic tokens** added to `tokens/semantic.css` + `tokens/source/semantic-colors.json` (mirroring existing `--feedback-success-border`):
  - `--feedback-info-border` → `system-info-200`
  - `--feedback-warning-border` → `system-warning-200`
  - `--feedback-error-border` → `system-error-200`
- **Toast DEPRECATED + DELETED** — replaced entirely by Alert. Removed:
  - Figma: `Toast` component set (`2409:68637`), `Toast` page (`2405:68377`), `Toast` variable collection (`VariableCollectionId:2408:68426`).
  - Code: `css/toast.css`, `components/toast.md`. `css/index.css` import replaced with `alert.css`.
  - Indexes: `code-index.json`, `figma-index.json`, `MEMORY.md`, `references/figma-api.md` updated.
  - The `--feedback-{status}-strong` semantic tokens originally added for Toast are retained — they now back `--alert-heading-{status}`.
- **Code:** `css/alert.css` + `components/alert.md` added; `alert-test.html` covers all 4 statuses + slot combos (verified in preview server).
- **Decisions during build:**
  - Body text always uses `--text-primary` (navy-900) for legibility — never status-colored.
  - Action stays info-blue across all statuses to read as a separate affordance, not an extension of the status tint.
  - Slot is a Figma SLOT type for native composition; CSS exposes a generic `.alert__slot` flex column.

## 2026-04-29 (New components — List Item + Price Row)
- **New page:** `List Item 🟡` (`3152:8`) — dedicated page for both row primitives.
- **List Item** (`3154:28`) — flexible row primitive for content lists. 6 State variants (Default/Hover/Pressed/Focused/Disabled/**Highlight**) × 5 boolean props (Lead/Description/Meta/Trail/Divider). Variable height (hugs content), width 100%. Top-aligned lead+body, center-aligned trail. Static by default; opt-in to interactivity via `.list-item--interactive`. Use cases: policy/claim/document lists, transaction/activity feeds, settings rows. Lives **alongside** `.card-row` and `.hospital-row` — does not replace.
  - Variable collection `VariableCollectionId:3152:9` "List Item" (9 component tokens, 3-tier).
  - Typography: Title=`.text-title-xs` (13 SemiBold), Desc=`.text-caption-md` (12 Regular), Meta=`.text-caption-sm-medium` (10 Medium).
- **Price Row** (`3166:120`) — read-only display row for billing/price breakdowns. 2 State variants (Item / **Total**) × 3 boolean props (Description / Sub-amount / Divider). Total state: green-100 bg + brand-green amount.
  - Variable collection `VariableCollectionId:3160:8` "Price Row" (7 component tokens, 3-tier).
  - Typography: Item label uses `.text-body-md` (Regular); Total label uses `.text-title-sm` (SemiBold). Amount always `.text-title-sm` (14 SemiBold). Sub-amount `.text-caption-sm-medium` (10 Medium). Description `.text-caption-md` (12 Regular).
  - Built specifically for billing summary recipe (matches the bottom-sheet billing pattern: Base premium / GST / Discount / Annual Total).
- **Code:** `css/list-item.css` + `components/list-item.md` + `css/price-row.css` + `components/price-row.md` added. `css/index.css` updated with both imports.
- **Indexes:** `code-index.json`, `figma-index.json`, `references/figma-api.md`, `MEMORY.md` updated.
- **Decisions during build:**
  - List Item lives alongside (not replacing) existing card-row / hospital-row — keeps existing screens stable.
  - Variable height (one size, hugs content) instead of fixed SM/MD/LG — most flexible.
  - Default static + `.list-item--interactive` opt-in modifier for hover/pressed.
  - Highlight as 6th State variant (not boolean) — mirrors Figma's variant approach.
  - Top-align lead+body but center-align trail (per design feedback during build).
  - Price Row: separate component from List Item (don't shoehorn billing into general row).
  - Price Row Total as State variant (not boolean) for cleaner mutual-exclusivity.

## 2026-04-29 (New component — Date Picker, popover variant #3)
- **Figma:** Date Cell component set `3134:238` on **Dropdown 🟡** page (5 state variants: Default / Today / Selected / Disabled / OutsideMonth — 40×40 fixed, 8px radius). Variable collection `VariableCollectionId:3134:217` "Date Picker" with **10 component tokens** (3-tier compliant): 7 cell-level + 3 picker chrome.
- **3 demo frames on Dropdown 🟡 page:** Calendar `3139:217` (April 2026, Apr 15 selected, Apr 29 today), Month picker `3140:256` (2026, Apr selected), Year picker `3140:294` (2024–2035, 2026 selected). All share the same outer chrome — 320 wide, popover-styled (white bg, border-strong, radius-12, shadow-medium).
- **Header:** prev / center title button / next. Title is a `.btn.btn--ghost.btn--md` with a trailing `PencilSimpleLine` icon — explicit click target to switch between Calendar / Month picker / Year picker views.
- **Date Cell reuse:** Month and Year picker cells are instances of the same Date Cell component, resized to 72×40 within their 4-column grids (CSS uses `grid-template-columns: repeat(4, 1fr)`).
- **Text styles:** Title uses `Title/Title-SM` (14 SemiBold via Ghost Button); cells + weekdays use `Label/Label-MD-Medium` (14 Medium). All bound via `setTextStyleIdAsync` (no inline overrides).
- **Code:** `components/date-picker.md` + `css/date-picker.css` added; new classes `.date-picker`, `.date-picker__header/__weekdays/__weekday/__grid`, `.date-picker__grid--month/--year`, `.date-cell` with modifiers `--today`, `--selected`, `--outside-month`. `css/index.css` updated with `@import './date-picker.css'`.
- **v1 scope:** single date selection only. Range mode deferred until first range use-case appears.
- **Indexes & docs:** `code-index.json`, `figma-index.json`, `references/figma-api.md`, `MEMORY.md` updated.
- **Two bugs caught & fixed during build:**
  1. Wrong semantic ID for `action/primary` — initially aliased to `text/on-action-primary` (white) instead of green-500. Affected `bg-selected` and `ring-today`. Fixed mid-build.
  2. Wrong semantic ID for `text/inverse` — initially aliased to `text/tertiary` (grey-300) instead of white. Affected `text-selected`. Fixed during user review.
- **MEMORY plugin gotchas added:** semantic var ID lookup (resolve via `getLocalVariableCollectionsAsync`, never guess), and text styles must be bound via `setTextStyleIdAsync` with IDs from `getLocalTextStylesAsync`.

## 2026-04-29 (Menu Item updates — Selected variant, Multi/Radio booleans, MD icons)
- **Selected promoted from CSS-only to a Figma `State` variant value.** Variants: Default / Hover / Pressed / Focused / Disabled / **Selected** = 6 states × 2 sizes = **12 total** (was 10).
- **New Figma variable** `menu-item/bg-selected` (`VariableID:3116:8`) → aliases `surface/brand-hover` (green-100). Powers the Selected variant fill. Now the Menu Item collection has 8 vars (was 7).
- **New boolean prop `Multi`** — when true, shows a `Checkbox Control` instance (`2237:3807`) in the leading slot. Designer should set `Icon=false`. Used for multi-select dropdown rows.
- **New boolean prop `Radio`** — when true, shows a `Radio Control` instance (`2082:1440`) in the leading slot. Designer should set `Icon=false`. Used for single-select dropdown rows when an explicit radio is desired.
- **Removed** the `Selected` boolean prop and its overlay layer pattern (replaced by the cleaner State variant approach).
- **Icon-holder size SM (16px) → MD (20px)** for both leading and trailing slots — aligns with `.text-body-md` line-height (20px).
- **Demo frames on Dropdown 🟡 page**: Recipe A · Single-select (`3123:106`), Recipe B · Multi-select (`3123:149`), Recipe C · Searchable (`3123:225`), Recipe D · Radio (`3130:267`).
- **Code updated**: `css/menu.css` token comments reorganized; `components/menu.md` rewritten for new variants + booleans + Recipe D; `menu-test.html` icon-holders swapped to `--md`; `code-index.json` + `figma-index.json` + `MEMORY.md` + `references/figma-api.md` updated.

## 2026-04-28 (Select recipes — popover variant #2, composed)
- **Decision:** Select dropdown variant is composed from existing components instead of a new component. Uses Menu Item + Checkbox + Search Input + Button.
- **CSS:** added `.menu__header`, `.menu__footer`, `.menu__empty` wrapper classes to `css/menu.css` (no new tokens, no new Figma collection).
- **Patterns documented in `components/menu.md`:** Single-select (radio with `.menu__item--selected`), Multi-select (`.checkbox-control` in lead + `.menu__footer` with Apply/Clear), Searchable (`.menu__header` with `.search-input` + `.divider`), and Combined.
- **Indexes:** `code-index.json` Menu entry updated with new subClasses + Select recipe note.

## 2026-04-28 (New component — Menu / Menu Item, popover variant #1)
- **Figma:** component set `3099:8` "Menu Item" on **Dropdown 🟡** page, variable collection `VariableCollectionId:3095:8` "Menu Item" (7 component tokens, 3-tier).
- **10 variants:** Size (SM 40px / MD 48px) × State (Default / Hover / Pressed / Focused / Disabled). Fixed width 200, no corner radius, space-between layout (leading icon-holder + label on left, trailing icon-holder on right).
- **Boolean component props:** `Icon` (default true), `Trailing` (default true).
- **Icon Holder hard-rule compliant:** both leading and trailing are `icon-holder/sm` INSTANCES (`2169:2352`). Default trailing Atom = CaretRight (`2199:67023`); designers swap to other Phosphor icons when needed.
- **Code:** `components/menu.md` + `css/menu.css` added; new classes `.menu`, `.menu__item`, `.menu__item__lead`, `.menu__item__label`, `.menu__item__trail`, `.menu__group-label`. CSS adds 5 modifier-only tokens (`--menu-item-text/icon-destructive`, `--menu-item-bg/text/icon-selected`) for `.menu__item--destructive` and `.menu__item--selected` modifiers (CSS-only, not Figma variants). `css/index.css` updated with `@import './menu.css'`.
- **Indexes:** `code-index.json`, `figma-index.json`, `references/figma-api.md`, `MEMORY.md` updated.
- **Plugin gotcha:** Figma renders the paint fallback color (not the bound variable's resolved value) in some component-set rendering contexts. Fix: when binding a variable to a paint, set the resolved color as the fallback (instead of black). Added to MEMORY plugin gotchas.

## 2026-04-28 (Rename: Chat Bubble → Tooltip)
- **Pure rename only — design and behavior unchanged.** The component formerly called "Chat Bubble" was actually a tooltip with a tail; renamed to remove naming collision with the real chat surface in the Chatbox component.
- **Figma:** component set `2346:67285` "Chat Bubble" → "Tooltip"; page `2342:67091` "Chatbubble/tooltips 🟡" → "Tooltip 🟡"; variable collection `VariableCollectionId:2346:67237` "Chat Bubble" → "Tooltip"; variables `chat-bubble/{bg,text,icon}` → `tooltip/{bg,text,icon}`. All variable bindings preserved (still alias `surface/brand-inverse` and `text/inverse`).
- **Code:** `css/chat-bubble.css` → `css/tooltip.css`; `components/chat-bubble.md` → `components/tooltip.md`; `chat-bubble-test.html` → `tooltip-test.html`. CSS class `.chat-bubble[__*][--*]` → `.tooltip[__*][--*]`. CSS vars `--chat-bubble-bg/-text` → `--tooltip-bg/-text` (alias chains unchanged: still alias `--surface-brand-inverse` and `--text-inverse`).
- **Indexes & docs:** updated `code-index.json`, `figma-index.json` (filled in `nodeId` + `pageId`, previously TBD), `references/figma-api.md`, `design-system.md`, `Discrepancies.md`, `MEMORY.md`.
- **No semantic tokens added/removed/remapped.**

## 2026-04-23 (Multi-component update)
- **New components added to codebase:** iOS Notification Bar (`.status-bar`), Illustration Placeholder (`.illustration-placeholder`), Accordion (`.accordion`) — all on Misc. 🟡 page
- **New semantic token:** `--surface-tooltip` → `primary/green/800` — renamed from `surface/mascot-bubble` in Figma; CSS added to `tokens/semantic.css` + `tokens/source/semantic-colors.json`
- **surface/dot-active + surface/dot-inactive** added to Figma Semantic collection; mapped to pagination dots node `2092:1588` (already existed in CSS)
- **Avatar ring-default:** `--avatar-ring-default: var(--border-default)` added to `css/avatar.css`; mirrors Figma `avatar/ring-default` var (4th avatar collection var)
- **Stepper refactored:** `css/stepper.css` now defines own `--stepper-*` component token layer (8 tokens) aliasing Semantic — no longer uses `--input-*` vars. Mirrors Figma Stepper collection `VariableCollectionId:2235:3635`
- **Icon Holder brand bg removed:** `.icon-holder--bg-brand` class and 3 related tokens deleted from `css/icon-holder.css` (Figma: Background=Brand variant deleted from node `2169:2353`)
- **Heading icon sizes corrected:** Large/Primary now use `.icon-holder--md` (20px); Secondary uses `.icon-holder--sm` (16px) — no brand bg — `components/heading.md` updated
- **Button documentation updated:** `references/figma-api.md` + `MEMORY.md` corrected — Button collection (31 vars) now properly aliases Semantic tokens (3-tier compliant)
- **figma-api.md page list updated** — renamed pages, new pages, removed deleted pages

## 2026-04-07 (New component — Heading)
- **Heading component created** — node `2703:5541` (Buttons 🟡 page), collection `VariableCollectionId:2707:8`
- 3 size variants: Large (16px Bold), Primary (14px SemiBold), Secondary (13px SemiBold)
- 3 boolean props: `Description`, `Icon`, `Button`
- 3 component tokens: `heading/title` → text/primary, `heading/desc` → text/secondary, `heading/icon-fill` → text/primary
- Created `components/heading.md` + `css/heading.css` — added to `css/index.css`
- Updated `code-index.json`, `figma-index.json`, `figma-api.md`, `MEMORY.md`

## 2026-04-07 (Design system violation fixes — card node 2689:4012)
- **Fix #4** — node `2689:4049` fill rebound from `text/inverse` → `surface/default`
- **Fix #6** — node `2692:4849` all 4 radii bound to `radius/2`
- **Fix #7** — all 24 Link Button variants (`2691:4406`) all 4 radii bound to `radius/4`
- **Fix #8** — node `2689:4044` itemSpacing set to 8 and correctly bound to `gap/8`
- **gap/10 added** to Gap variable collection (user created in Figma) — `figma-index.json` + `figma-api.md` updated (10→11 vars). `tokens/spacing.css` already had `--spacing-10`.
- **Link Button registered** — node `2691:4406`, collection `VariableCollectionId:2691:4079`, 24 variants — added to `figma-index.json`. Spec + CSS pending.

## 2026-04-07 (New radius token — radius/10)
- **Added `--radius-10: 10px`** to `tokens/radius.css` (between radius-8 and radius-12)
- Updated `tokens/source/radius.json` with `"10": { "value": 10, "type": "borderRadius" }`
- Created Figma variable `radius/10` (`VariableID:2695:8`) in Radius collection (`VariableCollectionId:12:77328`) — scope: `CORNER_RADIUS` only
- Radius collection now has 12 variables (was 11)

## 2026-04-01 (Overline typography scale — 3 new text styles)
- **Added 3 overline text styles** to `tokens/typography.css` and `tokens/source/text-styles.json`
  - `.text-overline-lg` — 14px · ExtraBold (800) · uppercase · 2px letter-spacing · lh 1.5
  - `.text-overline-md` — 12px · ExtraBold (800) · uppercase · 2px letter-spacing · lh 1.5
  - `.text-overline-sm` — 10px · ExtraBold (800) · uppercase · 2px letter-spacing · lh 1.5
- **New token** `--font-weight-extrabold: 800` added to `:root` in `tokens/typography.css`
- **New token** `--letter-spacing-overline: 2px` added to `:root` in `tokens/typography.css`
- **Google Fonts import** updated to include weight `800`
- **Figma text styles created:** `Overline/Overline LG`, `Overline/Overline MD`, `Overline/Overline SM` — all ExtraBold, 2px letter-spacing, UPPER, in file `IDT7FF4CnWEMLfuwSCFQoa`
- **Typography count** updated: 16 → 19 named styles in `design-system.md` and `design-reference.md`
- **Hardcoded violations fixed:**
  - `screens/chip-tag-test.html` → `.section h2` typography replaced with `.text-overline-lg` class
  - `screens/login-flow.html` → `.splash-wordmark` `letter-spacing: 2px` → `var(--letter-spacing-overline)`
  - `screens/onboarding-prototype.html` → `.splash-logo` `letter-spacing: -.5px` removed (no KDS token for negative tight tracking; commented with note)

## 2026-03-27 (Spacing token — gap/10)
- **Added `--spacing-10: 10px`** to `tokens/spacing.css` (between `--spacing-8` and `--spacing-12`)
- **Added `"10"` entry** to `tokens/source/spacing.json` (Figma sync)
- **Added `gap/10`** to Figma Gap collection (`VariableCollectionId:10:1515`) — `VariableID:2431:80121`, value `10`, type `FLOAT`
- Spacing scale is now 11 steps: 2, 4, 8, **10**, 12, 16, 20, 24, 32, 48, 64px

## 2026-03-27 (Header — full rebuild)
- **Header component rebuilt** from a 5-variant COMPONENT_SET to a single COMPONENT with 10 boolean/swap properties
- **Layout:** `grid (1fr auto 1fr)` → `flex row` — no absolute positioning on any slot; center-slot is `flex:1, left-aligned`
- **Removed** Search variant (`Center=Search`) + `.top-nav--search` CSS modifier
- **Removed** `.top-nav--avatar-title`, `.top-nav--left-heading`, `.top-nav__heading`, `.top-nav__subheading` — unified into base flex layout
- **Removed** `Header / Left Icon` COMPONENT_SET (`2284:10765`) — `Icon Left` instance swap now targets Icon Holder lg directly
- **Added Dark mode** — `.top-nav--dark` CSS modifier + `Dark` variable mode (ID `2412:23`) in Header variable collection
- **Added `header/logo` token** (`VariableID:2412:68694`) → `action/primary` in both Light and Dark modes (logo stays green)
- **Fixed subtitle** — corrected from `12px` to `14px` regular
- **Added FHD breakpoint** (1920px+) with `padding: --spacing-48`
- New Figma component node: `2413:68695` (replaces `2284:10985`)
- Files updated: `css/header.css` · `components/header.md`
- Figma collection `VariableCollectionId:2272:5449` now has 6 tokens (was 5), 2 modes (was 1)

## 2026-03-27 (Toast)
- **Toast component** — new component
  - 4 state variants: info / success / warning / error
  - Boolean props in Figma: `Avatar` (Avatar-24 instance) · `Icon` (Atom Outline Regular, 16×16)
  - 5 component tokens: `toast/bg`, `toast/border`, `toast/heading`, `toast/body-text`, `toast/avatar-ring`
  - `toast/heading` drives both the heading text colour AND the icon fill (shared token)
  - Heading uses `-800` dark variant of each state family for strong hierarchy over the `-500` border
  - Figma collection: `VariableCollectionId:2408:68426` | Component set: node `2409:68637` (Toast page)
  - Files: `components/toast.md` · `css/toast.css`
- **New semantic tokens** added to `tokens/semantic.css` + `tokens/source/semantic-colors.json`:
  - `--feedback-error-text` → error-700 (was missing, now matches the *-text pattern)
  - `--feedback-info-strong` → info-800
  - `--feedback-success-strong` → success-800
  - `--feedback-warning-strong` → warning-800
  - `--feedback-error-strong` → error-800

## 2026-03-26 (Card)
- **Card component** — new component (Card 1)
  - Surface container: white bg, 1px grey-200 border, 12px radius, shadow-low
  - 2 color tokens: `--card-bg` → `surface/default` · `--card-border` → `border/default`
  - Shadow via `--card-shadow` → `--shadow-low` (CSS only — Figma effect style, not a variable)
  - Figma collection: `VariableCollectionId:2388:68089` | Component: node `2384:67964` (Cards page)
  - Files: `components/card.md` · `css/card.css`

## 2026-03-26 (Avatar Stack)
- **Avatar Stack component** — new component
  - 4 sizes: 24 / 32 / 40 / 64px (overlap = 25% of size: 6 / 8 / 10 / 16px)
  - 3 count states: 2 avatars · 3 avatars · 3+ (overflow badge)
  - Boolean props in Figma: `prop3rd` (3rd avatar slot) · `prop3` (overflow badge)
  - 3 component tokens aliasing semantic: `--avatar-stack-ring` · `--avatar-stack-overflow-bg` · `--avatar-stack-overflow-text`
  - Figma collection: `VariableCollectionId:2384:67969` | Component set: node `2386:68088`
  - Files: `components/avatar-stack.md` · `css/avatar-stack.css`

## 2026-03-26
- **Pagination dot indicator redesign** (Figma section 2358:67566)
  - Dot height: 10px → 4px
  - Inactive dot width: 10px → 4px
  - Active dot size: 24×4px (width unchanged, height updated)
  - Dot gap: 6px → 4px (`--spacing-6` → `--spacing-4`)
  - Active dot color: `--surface-inverse` (navy-900) → `--surface-dot-active` (navy-700)
  - Inactive dot color: `--text-tertiary` (grey-300) → `--surface-dot-inactive` (navy-300, blue-grey)
- **New semantic tokens** added to `tokens/semantic.css` + `tokens/source/semantic-colors.json`:
  - `--surface-dot-active` → `--color-primary-navy-700`
  - `--surface-dot-inactive` → `--color-primary-navy-300`

## 2026-03-17
- Initial skill creation
- Color primitives: base (white, black), primary (green, navy, grey), secondary (teal, steel-blue, mint), tertiary (peach, yellow, coral, purple), system (success, info, warning, error) — 142 variables
- Text styles: 16 styles across Title, Body, Label, Caption categories — Plus Jakarta Sans
- Spacing: 10 tokens (2, 4, 8, 12, 16, 20, 24, 32, 48, 64)
- Radius: 11 tokens (2, 4, 8, 12, 16, 20, 24, 32, 48, 64, 9999)
- Border: 4 tokens (hairline 0.5, small 1, medium 1.5, large 2)
- Opacity: 5 tokens (subtle 10%, medium 25%, strong 50%, disabled 75%, backdrop 90%)
- Overlay: 5 tokens (20%, 35%, 50%, 65%, 80%)
- Figma documentation pages: Colors Foundations, Text Styles, Spacing, Opacity & Overlay, Radius

## 2026-03-18
- Created Semantic Colors collection in Figma (VariableCollectionId:2156:1906) — 35 alias variables
- Categories: surface (6), text (8), action (7), border (6), feedback (8)
- All semantic tokens are aliases pointing to Primitives — no hardcoded values
- Saved semantic-colors.json to /tokens/source/
- Project restructured: JSON source files moved to tokens/source/, CSS token files created in tokens/
- Added elevation/shadow tokens (5 levels: none → highest)
- Created figma-enforcer.md, design-system.md, design-reference.md at root
- Moved references/ to root level; deleted kinko-design-system/ and PLAN.md
- Button component built (Figma node 33:6053): 4 variants × 3 sizes × 3 states
  - Token remap: Figma `#3a5a8c` → `--action-primary` (#009b1a green) per Kinko brand
  - Spec: components/button.md · CSS: css/button.css · class prefix: .btn

## 2026-03-18 (cont.)
- **Skill Architecture Restructuring** — Decomposed monolithic figma-enforcer into orchestrator + 5 junior enforcers:
  - Text Style Enforcer (`.claude/skills/kinko-text-style-enforcer/`) — typography tokens across code + Figma
  - Color Enforcer (`.claude/skills/kinko-color-enforcer/`) — color tokens across code + Figma
  - Spacing Enforcer (`.claude/skills/kinko-spacing-enforcer/`) — spacing/radius/border/shadow/opacity/overlay across code + Figma
  - Component Enforcer (`.claude/skills/kinko-component-enforcer/`) — component structure, patterns, states
  - Layout Enforcer (`.claude/skills/kinko-layout-enforcer/`) — screen structure, 4 responsive breakpoints
- figma-enforcer.md restructured as orchestrator: token knowledge moved to enforcers, Figma API patterns + binding code retained, added routing table + discrepancy protocol + cross-skill announcements
- CLAUDE.md updated: Section 5 now includes FHD (1920px+) breakpoint, Section 6 adds FHD screen template, new Section 7 defines Skill Summoning Protocol
- MEMORY.md updated with Skills Architecture table

## 2026-03-18 (button update)
- Button CSS rebuilt with complete state model: Default (raised 3D), Hover (lifted 3D), Pressed (pushed in), Loading (spinner), Disabled (flat), Focus (outline ring)
- 3D "juicy" effect system: multi box-shadow with component-level tokens (--btn-ring, --btn-shine, --btn-shadow-ambient, --btn-pressed-inset)
- Per-variant ring: Primary = green-600, Secondary = navy-600, Destructive = error-700, Ghost = none
- Secondary border replaced by ring shadow (0 0 0 1px --btn-ring)
- Icon sizing added: SM=16×16, MD=20×20, LG=24×24 (matching Figma exactly)
- Loader element (.btn__loader): CSS-only spinner using currentColor, sizes match icons
- Loading state (.is-loading): hides content via visibility:hidden, shows centered spinner
- Focus state: :focus-visible with --border-focus outline, 2px offset
- Hover states: @media (hover: hover) for desktop only
- Icon placeholder: .btn__icon:empty renders square outline
- Spec updated (components/button.md) with all new states, elements, 3D effect docs

## 2026-03-18 (Figma button rebind)
- Created "Button" variable collection in Figma (`VariableCollectionId:2188:2440`) — 3 component-level alias variables:
  - `btn/ring/primary` → `primary/green/600`
  - `btn/ring/secondary` → `primary/navy/600`
  - `btn/ring/destructive` → `system/error/700`
- Rebound all 36 Figma button variants (4 variants × 3 sizes × 3 states) from zombie collections to Kinko tokens:
  - Primary: fills → `action/primary` / `action/primary-pressed`, text → `text/on-action-primary`, 3D effects with green-600 ring
  - Secondary: transparent fill, ring shadow with navy-600, pressed fill → `primary/navy/100`, text → `text/on-action-secondary`
  - Ghost: no fill, no 3D effects, text → `text/on-action-secondary`, pressed fill → `primary/navy/100`
  - Destructive: fills → `action/destructive` / `system/error/700`, text → `text/on-action-primary`, 3D effects with error-700 ring
  - Disabled states: 50% opacity, no effects
- Removed all zombie variable refs (old `VariableCollectionId:9:1469` and `9:1405`)
- Audit verified: 0 zombie refs across all 36 variants

## 2026-03-18 (Secondary + Hover/Focus)
- Secondary button updated: transparent → navy fill (`--action-secondary`), navy text → white text (`--text-on-action-primary`)
- Secondary pressed: `--color-primary-navy-100` → `--action-secondary-pressed` (navy-600)
- Secondary hover: bg change removed, now shadow-lift only (matches Primary/Destructive pattern)
- Ghost text token: `--text-on-action-secondary` → `--text-primary` (navy-900)
- 3 new component tokens in Figma Button collection: `btn/secondary/fill`, `btn/secondary/fill-pressed`, `btn/secondary/text`
- Added Hover state to Figma component set (12 new variants: 4 types × 3 sizes)
  - Primary/Secondary/Destructive: lifted 3D shadow (stronger ambient + brighter shine)
  - Ghost: `surface/secondary` fill, no 3D effects
- Added Focus state to Figma component set (12 new variants: 4 types × 3 sizes)
  - Primary/Secondary/Destructive: default appearance + visible Focus Ring (green stroke, 2px outside)
  - Ghost: green stroke on variant frame (2px outside, radius-8)
- Component set expanded: 36 → 60 variants (4 variants × 3 sizes × 5 states)
- Grid arranged: rows = Variant group × Size, columns = Default → Hover → Pressed → Focus → Disabled
- All 16 button color tokens recreated as direct primitive aliases (no semantic tokens in Figma Button collection):
  - `btn/primary/fill` → green/500, `btn/primary/fill-pressed` → green/600, `btn/primary/text` → white
  - `btn/secondary/fill` → navy/500, `btn/secondary/fill-pressed` → navy/600, `btn/secondary/text` → white
  - `btn/ghost/text` → navy/900, `btn/ghost/fill-pressed` → navy/100, `btn/ghost/fill-hover` → grey/50
  - `btn/destructive/fill` → error/500, `btn/destructive/fill-pressed` → error/700, `btn/destructive/text` → white
  - `btn/ring/primary` → green/600, `btn/ring/secondary` → navy/600, `btn/ring/destructive` → error/700
  - `btn/focus/ring` → green/500
- All 60 Figma variants rebound to component-level tokens (zero semantic aliases)
