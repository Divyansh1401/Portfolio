# Kinko Design System — Claude Instructions
> These are mandatory rules for every task in this project. Violating any rule requires explicit user approval first.

---

## 1. ALWAYS Use the Existing Design System

- **Never hardcode colors, spacing, radius, shadows, or typography values.** Every visual property must reference a design token from `tokens/`.
- CSS token files are the implementation source of truth. JSON source files in `tokens/source/` are read-only exports.
- The full token set lives in:
  - `tokens/colors.css` — 142 color primitives (CSS custom properties, `--color-*`)
  - `tokens/semantic.css` — 64 semantic aliases (`--surface-*`, `--text-*`, `--action-*`, `--border-*`, `--feedback-*`)
  - `tokens/spacing.css` — spacing scale `--spacing-2` through `--spacing-64`
  - `tokens/radius.css` — radius scale `--radius-2` through `--radius-pill`
  - `tokens/typography.css` — 16 text style classes (`.text-title-xl`, `.text-body-md`, etc.)
  - `tokens/borders.css` — border widths `--border-width-hairline` through `--border-width-large`
  - `tokens/opacity.css` — 5 opacity levels `--opacity-subtle` through `--opacity-backdrop`
  - `tokens/overlays.css` — 5 overlay scrims `--overlay-20` through `--overlay-80`
  - `tokens/shadows.css` — 5 elevation levels `--shadow-none` through `--shadow-highest`
  - `tokens/index.css` — imports all of the above (use this in screens)
  - `tokens/source/` — JSON source files (read-only, for Figma sync only)
- **Prefer semantic tokens over primitives** in all component and screen work:
  - Use `--surface-*`, `--text-*`, `--action-*`, `--border-*`, `--feedback-*` from `tokens/semantic.css`
  - Only reach into `tokens/colors.css` (`--color-*`) when no semantic alias exists
- If a value doesn't exist in the token set, **ask the user before creating a new token**. Do not invent values.
- The design reference is `design-reference.md` (quick cheat sheet) and `design-system.md` (full docs).

---

## 2. ALWAYS Use Existing Components — Never Create New Ones Without Approval

- Component specs live in `components/`. Always check if an existing component covers the need before building anything new.
- CSS component files live in `css/`. Reuse these classes — do not duplicate or rewrite component CSS.
- **To look up a component, always read `.claude/indexes/code-index.json` first** — never scan `components/` or `css/` directories directly.
- **For Figma instantiation (use_figma), ALWAYS read `references/figma-component-playbook.md` + `.claude/indexes/component-usage.json` BEFORE creating an instance of any KDS component.** These capture per-component sizing rules, text-node names, boolean defaults, slot usage, and known mistakes. Skipping them re-introduces fixed bugs.
- If a screen needs a UI element, **first check `code-index.json`**. Compose screens using existing components.
- If a component variant or modifier is missing, **ask the user**: _"Component X doesn't have a [state/size/variant] — should I add it to the design system?"_
- **Never** create a one-off styled element that duplicates an existing component's purpose.
- Layout utilities are in `css/layout.css` — use `.screen`, `.section`, `.divider`, `.h-scroll`, `.card-grid`, and spacing utilities when available.

## 2b. HARD RULE — Icon Holder Wrapper (Every Icon)

Every icon usage — in any component, screen, or layout — **MUST** be wrapped in the `.icon-holder` component (code) or an Icon Holder instance (Figma, node `2169:2353`).

**Never place a bare `<svg>` or icon image without the wrapper.**

```html
<!-- ✅ CORRECT — always use .icon-holder -->
<span class="icon-holder icon-holder--md">
  <svg>…</svg>
</span>

<!-- ❌ WRONG — bare SVG without wrapper -->
<svg>…</svg>
```

| Size modifier | Figma variant node | Pixel size |
|---|---|---|
| `icon-holder--xs` | `2169:2358` | 12px |
| `icon-holder--sm` | `2169:2352` | 16px |
| `icon-holder--md` | `2169:2354` | 20px |
| `icon-holder--lg` | `2169:2356` | 24px |

- The inner icon graphic is always an **INSTANCE_SWAP** (Figma property: `Atom`; in code: swappable `<svg>` child)
- The holder itself has **no fill token** — color is inherited from the inner SVG via `currentColor`
- Spec: `components/icon-holder.md` | CSS: `css/icon-holder.css` | Base class: `.icon-holder`

## 2a. HARD RULE — 3-Tier Token Architecture (Primitive → Semantic → Component)

Every component **must** define its own component-level token collection that aliases **semantic tokens** (never primitives directly). This is non-negotiable and applies to every component in the system, including Button.

### Token hierarchy
```
Primitive (raw value)        e.g. primary/grey/200 = #c4c8ce
    ↓ aliased by
Semantic (meaning)           e.g. border/default → primary/grey/200
    ↓ aliased by
Component (role in context)  e.g. input/border/default → border/default
    ↓ bound to
Component property (fill, stroke, text fill, etc.)
```

### Rules
- **Component tokens must alias semantic tokens** — never alias primitives directly.
- **Component tokens must be created in their own Figma variable collection** — e.g. `Input`, `Button`, `Card`.
- **Component token names must describe their role** in the component, not their value:
  - ✅ `input/border/default`, `input/text/label`, `input/bg/active`
  - ❌ `input/grey-200`, `input/green-500`
- **Every visible property** of every variant/state must be bound to a component token — no raw hex, no direct semantic bindings on the layer.
- In CSS: define `--component-*` custom properties at the top of the component CSS file as aliases to semantic tokens, then use only `--component-*` throughout the rest of the file.
- **Existing components must be fixed** to comply — Button currently aliases primitives directly and must be updated.

### Exception — Final / terminal composition cards
A small set of card components are *terminal compositions* — non-interactive, leaf-level cards whose visual finish (radial washes, gradients, decorative emboss) is intentionally **re-skinned per use-case at the consumer level** and cannot be pre-defined as a system constant. For these cards:
- You **may** skip the component-level token collection and bind layers / styles directly to semantic (or palette) tokens.
- The 3-tier rule still applies to **every interactive component** and **every component used as a building block** for other components.
- Whenever a new component looks like it might fall into this exception class, **STOP and ask the user before creating component tokens**. Never apply the exception unilaterally.
- Current members of this exception class: **Insurer Card**.

### CSS pattern (required)
```css
/* [component].css */

/* 1. Component token definitions — aliases to semantic tokens */
:root {
  --input-bg:              var(--surface-default);
  --input-bg-active:       var(--surface-default);
  --input-border:          var(--border-default);
  --input-border-focus:    var(--border-focus);
  --input-border-error:    var(--border-error);
  --input-text:            var(--text-primary);
  --input-text-placeholder: var(--text-secondary);
  --input-text-disabled:   var(--text-disabled);
  --input-text-error:      var(--text-error-emphasis);
  /* ... etc */
}

/* 2. Component styles — use only --component-* vars below this line */
.input { ... }
```

---

## 3. ALWAYS Check for Design System Updates Before Serving / Building

Before running localhost, previewing, or building any screen, **perform this checklist in order**:

### Pre-Build Checklist

**Step 1: READ the latest tokens**
  → Read `tokens/semantic.css` and `tokens/colors.css`
  → Read `tokens/spacing.css` and `tokens/radius.css`
  → Verify your screen uses current token variable names (not stale ones)

**Step 2: READ the relevant component CSS**
  → For every component used in the screen, re-read its `css/` file
  → Check for class name changes, new modifiers, or updated properties

**Step 3: READ the relevant component spec**
  → For every component used in the screen, re-read its `components/` spec file
  → Verify variant names, sizes, padding, colors still match

**Step 4: DIFF check**
  → If any token or component file has been modified since the screen was last built, update the screen before serving

**Step 5: VALIDATE**
  → Ensure NO hardcoded color values (hex, rgb, rgba) exist outside of token files
  → Ensure NO hardcoded spacing or radius values exist outside of token files
  → Ensure every component class used actually exists in the CSS files
  → Ensure typography classes match the text styles in `tokens/typography.css`

---

## 4. ALWAYS Sync Changes Back to the Design System

This is the most critical rule for keeping the system consistent. **Every time a visual or structural change is made from chat**, perform the full sync:

### On Every Change From Chat:

**If you change a visual value (color, spacing, radius, border, opacity, overlay):**
1. Identify which CSS token file owns the value: `tokens/colors.css`, `tokens/semantic.css`, `tokens/spacing.css`, `tokens/radius.css`, `tokens/borders.css`, `tokens/opacity.css`, `tokens/overlays.css`, or `tokens/shadows.css`
2. Update the token in the correct CSS file
3. Update the corresponding JSON in `tokens/source/` to keep Figma in sync
4. Update `tokens/semantic.css` if the change affects a semantic alias
5. Update the relevant `components/*.md` spec to reflect the new value
6. Update the relevant `css/*.css` component file if it uses the changed token
7. Search all screen files for any hardcoded instance of the old value and replace with the token reference

**If you add a new component or variant:**
1. Create or update the spec file in `components/[name].md` with: variants, sizes, states, color tokens used, spacing, and example HTML
2. Create or update the CSS in `css/[name].css` using only token variables — no hardcoded values
3. Add the component to the Phase Status table in `design-system.md`
4. Add the CSS import to `css/index.css` if it's a new file
5. Update `MEMORY.md` with the new component name, class prefix, spec path, and CSS path

**If you change a component's structure, class names, or behavior:**
1. Update the spec in `components/[name].md`
2. Update the CSS in `css/[name].css`
3. Search all screen files for the old class name and update to the new one
4. Document the change at the top of the spec file under a `## Changelog` section with the date

**If you rename or remap a design token:**
1. Update the token in the relevant `tokens/*.css` file
2. Update the corresponding `tokens/source/*.json` file to keep Figma in sync
3. Update any semantic aliases in `tokens/semantic.css` that reference the old token
4. Do a global search across ALL files for the old token name and replace every occurrence
5. Note the rename in `references/changelog.md`

### Sync Confirmation Checklist (run after every chat-initiated change)

Before responding "done", verify:
- [ ] Token file updated (if value changed)
- [ ] Semantic alias updated (if component-level mapping changed)
- [ ] Component spec (`.md`) updated
- [ ] Component CSS updated
- [ ] All screen files using the component/token updated
- [ ] No hardcoded values introduced
- [ ] `design-system.md` Phase Status updated if a new component or phase milestone was reached
- [ ] `MEMORY.md` updated if a new file, component, or key decision was made
- [ ] `.claude/indexes/code-index.json` updated (if new component, screen, or token rename)
- [ ] `.claude/indexes/figma-index.json` updated (if new Figma component, node ID, or page change)

---

## 5. Design Principles (Always Apply)

- **Multi-platform** — Design for mobile (390px), iPad (768px+), desktop (1280px+), and FHD (1920px+). Consider all four breakpoints in every component and layout decision.
- **No dark mode** — single light theme only.
- **Brand colors:**
  - Primary: Green — `#009b1a` (`primary/green/500`)
  - Secondary: Navy — `#0b2b40` (`primary/navy/500`)
  - Always use semantic aliases (`action/primary`, `text/brand`, etc.) rather than raw primitives in components.
- **Font:** Plus Jakarta Sans — weights used: Regular, Medium, SemiBold, Bold. No other fonts.
- **Typography scale:** 16 defined text styles across Title, Body, Label, and Caption categories. Always use a named class from `tokens/typography.css` (e.g. `.text-title-xl`, `.text-body-md`) — never set font-size or font-weight directly.
- **Neutral palette:** Uses `primary/grey/*` — a cool-leaning grey. Do not substitute warm greys.
- **Default states** have no fill (transparent background) unless the component spec says otherwise.
- **Pressed state** is used for interaction feedback on touch targets (no hover-only states on mobile).
- **Trust, clarity, and professionalism** — this is an insurance product. Avoid playful or decorative patterns that undermine credibility.

---

## 6. Screen Structure Standard

### Mobile (390px)
```html
<div class="screen">
  <!-- Status bar -->
  <div class="status-bar"></div>
  <!-- Top navigation -->
  <div class="top-nav">...</div>
  <!-- Scrollable content -->
  <div class="screen__content">
    <div class="section">...</div>
    <div class="section">...</div>
  </div>
  <!-- FAB if needed -->
  <button class="fab">...</button>
  <!-- Bottom navigation -->
  <nav class="bottom-nav">...</nav>
</div>
```

### iPad (768px+)
```html
<div class="screen screen--tablet">
  <nav class="side-nav">...</nav>
  <div class="screen__body">
    <div class="top-bar">...</div>
    <div class="screen__content">
      <div class="section">...</div>
    </div>
  </div>
</div>
```

### Desktop (1280px+)
```html
<div class="screen screen--desktop">
  <nav class="side-nav side-nav--expanded">...</nav>
  <div class="screen__body">
    <div class="top-bar">...</div>
    <div class="screen__content">
      <div class="section">...</div>
    </div>
  </div>
</div>
```

### FHD (1920px+)
```html
<div class="screen screen--fhd">
  <nav class="side-nav side-nav--expanded">...</nav>
  <div class="screen__body">
    <div class="top-bar">...</div>
    <div class="screen__content screen__content--wide">
      <div class="section">...</div>
    </div>
  </div>
</div>
```

Every screen must be responsive across all four breakpoints unless explicitly scoped to one platform.

---

## 7. Skill Summoning Protocol

**FIGMA-FIRST RULE (applies to ALL scenarios below):**
Every change — new component, screen, or token — must be fully completed in Figma before any codebase change is made. The Figma work includes ALL of the following steps in order:
1. Create or update the component/screen/token in Figma
2. Create all color tokens for the component as Figma variables (in the correct collection)
3. Apply those tokens to every property of the component in Figma (fills, strokes, text, backgrounds, borders, states)
4. Verify the component is fully wired to the design system in Figma — no raw hex values left unlinked
5. **Stop and ask the user to visually verify in Figma**
6. Only after explicit user confirmation, proceed to update the codebase

Before starting any design work, determine what is being created and summon the enforcer skills in order:

### Creating a new component
1. **Figma Enforcer (Orchestrator):**
   - Create the component set in Figma (all variants × sizes × states)
   - Create all color tokens for the component as Figma variables in the correct collection
   - Apply every token to every property in every variant/state (fills, borders, text, bg — no raw hex left)
   - Ensure the component is fully wired to the design system in Figma
2. **PAUSE — ask user to visually verify in Figma and confirm**
3. **Text Style Enforcer** — load typography tokens, enforce text classes in code
4. **Color Enforcer** — load color tokens, enforce semantic color usage in code
5. **Spacing Enforcer** — load spacing/radius/border tokens, enforce dimensional values in code
6. **Component Enforcer** — create spec (`components/[name].md`) and CSS (`css/[name].css`)
7. **Code Connect** (`figma:code-connect-components`) — map the Figma component node ID to its CSS class and HTML pattern; update `.claude/indexes/figma-index.json` with Code Connect status

### Creating/modifying a screen
1. **Figma Enforcer (Orchestrator):**
   - Create/update the screen frame in Figma with correct layout and components
   - Ensure all color tokens are created and applied to every element (no unlinked hex values)
   - Verify all components on the screen are using design system tokens in Figma
2. **PAUSE — ask user to visually verify in Figma and confirm**
3. **Text Style Enforcer** — verify all text uses `.text-*` token classes in code
4. **Color Enforcer** — verify all colors use `var(--semantic-token)` or `var(--color-*)` in code
5. **Spacing Enforcer** — verify all spacing uses `var(--spacing-*)`, `var(--radius-*)`, etc. in code
6. **Component Enforcer** — verify all components used exist and follow patterns
7. **Layout Enforcer** — enforce screen structure across 4 breakpoints, run pre-build checklist

### Modifying a token
1. **Figma Enforcer (Orchestrator):**
   - Update the variable value/mapping in Figma
   - Re-apply the updated token to all components that use it in Figma
   - Verify no component is left with the old raw value
2. **PAUSE — ask user to visually verify in Figma and confirm**
3. **Relevant enforcer** (Text Style / Color / Spacing) — update the token in CSS
4. **Component Enforcer** — check all components using the changed token
5. **Layout Enforcer** — check all screens using the changed token

### Validating / pre-build audit
1. **Text Style Enforcer** — scan for hardcoded typography values
2. **Color Enforcer** — scan for hardcoded color values
3. **Spacing Enforcer** — scan for hardcoded spacing/dimensional values
4. **Component Enforcer** — verify component spec-CSS consistency
5. **Layout Enforcer** — run full pre-build checklist

### Figma-only work
1. **Figma Enforcer (Orchestrator)** — handles directly, delegates to token enforcers for lookups

---

### Creating a screen in CODE (`screens/*.html`)
1. Read `.claude/indexes/code-index.json` → identify which components the screen needs
2. Compose HTML using **only existing component classes** from `css/index.css` — no one-off styles
3. **Text Style Enforcer** → verify all text uses `.text-*` classes
4. **Color Enforcer** → verify all colors use `var(--semantic-token)` or `var(--color-*)`
5. **Spacing Enforcer** → verify all spacing uses `var(--spacing-*)`, `var(--radius-*)`, etc.
6. **Component Enforcer** → verify all component classes exist and follow patterns
7. **Layout Enforcer** → enforce screen structure across 4 breakpoints + run pre-build checklist
8. **NEW ELEMENT DETECTION** → scan screen HTML for any CSS class not in `code-index.json`
   - If found → PAUSE → ask: _"Found [X] element(s) not in the design system. Should I create them as components?"_
   - Await user answer before proceeding

### Creating a screen from scratch (no Figma source)
> Use this path only when no Figma design exists yet and the user explicitly asks to build a screen from code first.
1. Load **frontend-design** (`frontend-design:frontend-design`) skill
2. Read `.claude/indexes/code-index.json` → identify existing components to compose with
3. Use **frontend-design** to generate a polished initial screen — it must compose using existing Kinko component classes, not invent new ones
4. **Text Style Enforcer** → **Color Enforcer** → **Spacing Enforcer** → **Component Enforcer**
5. **Layout Enforcer** → enforce screen structure across 4 breakpoints + run pre-build checklist
6. **NEW ELEMENT DETECTION** → scan for any CSS class not in `code-index.json`
   - If found → PAUSE → ask: _"Found [X] element(s) not in the design system. Should I create them as components?"_
   - Await user answer before proceeding
7. After code is finalised → **Figma Enforcer** → recreate the screen in Figma to keep design and code in sync (Figma-first rule must be closed before the screen is considered done)

### Creating a screen in FIGMA
1. Read `.claude/indexes/figma-index.json` → get node IDs + page names for all components needed
2. Load **figma-use** + **figma-generate-design** together (mandatory prerequisite)
3. Use `search_design_system` or inspect existing screens to find component keys
4. Import components as instances via `figma.importComponentSetByKeyAsync` — every element must be a component instance, no raw rectangles
5. Apply variable bindings for fills/spacing — never hardcoded hex or px values
6. **PAUSE** — ask user to visually verify screen in Figma before proceeding to code
7. **NEW ELEMENT DETECTION** → scan screen frame for any non-INSTANCE node
   - If found → PAUSE → ask: _"Found [X] element(s) in this screen that aren't design system components. Should I create them?"_
   - Await user answer before proceeding to code implementation

### Generating code FROM an existing Figma screen
1. Load **figma-implement-design** skill
2. `get_design_context(fileKey, nodeId)` → structural layout + token data
3. `get_screenshot(fileKey, nodeId)` → visual source of truth (keep accessible throughout)
4. Download assets from MCP localhost endpoint — use `localhost` URLs directly; **never import new icon packages**
5. Translate React + Tailwind MCP output → Kinko HTML + CSS token classes
6. Map each element to its entry in `code-index.json` — use existing class, never re-create
7. **Text Style Enforcer** → **Color Enforcer** → **Spacing Enforcer** → **Component Enforcer**
8. **Layout Enforcer** → run pre-build checklist
9. **NEW ELEMENT DETECTION** → flag any element not in `code-index.json`
   - If found → PAUSE → offer to create as component before finalising

### Setting up / updating Code Connect mappings
> Run this any time a new component is added, a Figma node ID changes, or Code Connect mappings need to be audited.
1. Read `.claude/indexes/code-index.json` → get all component class names and HTML patterns
2. Read `.claude/indexes/figma-index.json` → get all component Figma node IDs and page locations
3. Load **figma:code-connect-components** skill
4. For each unmapped component: supply the Figma node ID + the matching HTML/CSS class pattern
5. Verify the mapping compiles and the Figma component shows code snippets correctly
6. Update `.claude/indexes/figma-index.json` — mark each component with `"codeConnect": true` once mapped
7. **PAUSE** — ask user to verify Code Connect snippets appear in Figma Dev Mode

### Auditing / syncing design tokens from Figma
1. Load **kinko-token-extractor** skill
2. `get_variable_defs(fileKey="IDT7FF4CnWEMLfuwSCFQoa")` → fetch all 8 token collections
3. Convert names to kebab-case, values to rem/hex per skill rules
4. Generate diff vs. current `tokens/*.css` files
5. **PAUSE** — present full diff to user, await explicit confirmation
6. Write updated `tokens/*.css` + `tokens/source/*.json`
7. Update `code-index.json` token map if any token was renamed
8. **Color Enforcer** + **Spacing Enforcer** → scan all components and screens for violations
