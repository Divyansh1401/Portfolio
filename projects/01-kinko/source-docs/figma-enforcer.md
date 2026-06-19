---
name: kinko-design-system
description: >
  Kinko Design System orchestrator for Figma. This is the "senior" skill that coordinates 5 specialized
  enforcer skills and handles Figma-specific API operations. Use this skill for Figma variable binding,
  collection management, and cross-skill coordination. Trigger when: syncing design tokens to Figma,
  creating/updating Figma variables, verifying Figma collections, or when broad design system work
  requires multiple enforcers to coordinate.
---

# Kinko Design System — Figma Orchestrator

Kinko is an insurance selling platform for mobile and desktop. This skill orchestrates 5 specialized
enforcer skills and owns all Figma-specific API operations (variable binding, collection management,
async patterns). Token knowledge lives in the junior enforcers — this skill routes to them and handles
the Figma execution layer.

---

## New Figma MCP Skills (mandatory loading rules)

These skills must be loaded before the operations they govern. Do not perform the listed operation
without first loading the corresponding skill.

| Skill | Load when | Mandatory prerequisite for |
|---|---|---|
| `figma-use` | **EVERY** `use_figma` call | Plugin API syntax rules (return, async, colors 0–1, no notify) |
| `figma-implement-design` | Generating code from a Figma frame/URL | 7-step code-gen workflow |
| `figma-generate-design` | Building or updating screens inside Figma | Design system component discovery + instance import |
| `figma-generate-library` | Full library rebuild (multi-phase) | Phases 0–4 workflow with user checkpoints |
| `figma-code-connect-components` | Creating Code Connect mappings | Component ↔ code linking |
| `kinko-token-extractor` | Token audit or CSS variable sync | Figma variables → CSS `:root {}` |

> **HARD RULE:** `figma-use` MUST be loaded before every `use_figma` call — no exceptions. Failing
> to load it causes Plugin API misuse (sync calls that throw, wrong return patterns, etc.).

---

## Design System Index Lookup Rule

**Before accessing any component or token in Figma, always read the index files first:**

- **`.claude/indexes/figma-index.json`** → get the correct page name, node ID, and variable collection ID for any component
- **`.claude/indexes/code-index.json`** → get the correct spec path, CSS path, and base class for any component

**Never scan Figma pages to find a component — always use `figma-index.json`.**
**Never scan `css/` or `components/` directories to find a component — always use `code-index.json`.**

Both index files MUST be updated immediately after:
- A new component is added → add entries to both indexes
- A component is renamed → update the key in both indexes
- A new screen is added → add to the `screens` map in `code-index.json`
- A token is renamed → update the `tokens` map in `code-index.json`

---

## Screen Creation Routing

### Code screen (`screens/*.html`)
1. Read `code-index.json` → identify which components the screen needs
2. Compose HTML using **only existing component classes** from `css/index.css`
3. Reference `code-index.json` to find the correct class names for each component
4. NEVER write one-off styles — every element must map to a component class or layout utility

### Figma screen (new frame in Figma file)
1. Read `figma-index.json` → get node IDs + page names for all components needed
2. Load `figma-use` + `figma-generate-design` together
3. Use `search_design_system` or inspect existing screens to find component keys
4. Import components as instances via `figma.importComponentSetByKeyAsync`
5. Every element in the screen must be a **component instance** — no raw rectangles or groups
6. Apply variable bindings for fills/spacing — never hardcoded hex or px values
7. PAUSE — ask user to visually verify screen in Figma before proceeding to code

### Generating code FROM an existing Figma screen
1. Load `figma-implement-design`
2. `get_design_context(fileKey, nodeId)` → structural data
3. `get_screenshot(fileKey, nodeId)` → visual source of truth (keep accessible throughout)
4. Download assets from the MCP localhost endpoint — use localhost URLs directly, never import new icon packages
5. Translate React + Tailwind MCP output → Kinko HTML + CSS token classes
6. Map each component to its entry in `code-index.json` (use existing class, do not re-create)

---

## New Element Detection (post-screen step)

**After any screen is finalised (code or Figma), run this scan:**

**In code screens:**
- Scan the screen HTML for any CSS class not present in `code-index.json`
- Scan for any inline style or hardcoded value (hex, px, etc.)

**In Figma screens:**
- Scan the screen frame for any non-INSTANCE node that isn't a wrapper frame
- Flag any GROUP or raw SHAPE layer that could be a reusable element

**If unrecognised elements are found → PAUSE and present:**
```
Found [X] element(s) in this screen that don't exist as components:
  - [element name / description]
  - [element name / description]

Should I create these as new components in Figma and code?
```

**Do NOT proceed to the next task until the user answers.** If the user says yes, run the full
"Creating a new component" workflow from CLAUDE.md Section 7 for each new element.

---

## Skill Inventory

| Skill | Responsibility | Scope |
|-------|---------------|-------|
| **Text Style Enforcer** | Typography tokens (16 text styles) | Code + Figma |
| **Color Enforcer** | Color tokens (142 primitives + 64 semantic) | Code + Figma |
| **Spacing Enforcer** | Spacing, radius, border, shadow, opacity, overlay | Code + Figma |
| **Component Enforcer** | Component structure, patterns, states, spec/CSS | Code |
| **Layout Enforcer** | Screen structure, responsive breakpoints (4) | Code |

---

## Routing Table

When a request comes in, route to the correct enforcer(s) based on what's being done:

### Creating a new component
1. Text Style Enforcer → Color Enforcer → Spacing Enforcer → Component Enforcer
2. Then this orchestrator syncs to Figma if needed

### Creating/modifying a screen
1. Text Style Enforcer → Color Enforcer → Spacing Enforcer → Component Enforcer → Layout Enforcer
2. Then this orchestrator syncs to Figma if needed

### Modifying a token
1. Relevant enforcer (Text Style / Color / Spacing) updates the token
2. Component Enforcer checks all components using the changed token
3. Layout Enforcer checks all screens using the changed token
4. This orchestrator syncs the change to Figma variables

### Validating / pre-build audit
1. Text Style Enforcer → Color Enforcer → Spacing Enforcer → Component Enforcer → Layout Enforcer
2. Each scans for hardcoded values and compliance issues

### Figma-only work
1. This orchestrator handles directly, delegating to enforcers for token lookups

---

## Operation Ordering

Token enforcers run first (they load/validate token values) → Component Enforcer (validates structure)
→ Layout Enforcer (validates screen composition) → This orchestrator (Figma sync).

Never sync to Figma before the enforcers have validated. The orchestrator is always last in the chain.

---

## Discrepancy Protocol

If this orchestrator detects a mismatch between code tokens and Figma variables:

1. **Identify the domain** — Is the mismatch in color, spacing, typography, or structure?
2. **Recall the relevant enforcer** — Ask it to report the correct value from its token files
3. **Determine source of truth** — CSS token files are always authoritative (per CLAUDE.md Section 1)
4. **Fix the drift** — Update the Figma variable to match the CSS token, not the other way around
5. **Log the fix** — Append to `references/changelog.md`

---

## Cross-Skill Announcements

When an enforcer makes a change that affects downstream skills:

- **Token value changed** → Orchestrator notifies Component Enforcer to recheck all components using that token, then Layout Enforcer to recheck all screens
- **Component spec changed** → Orchestrator notifies Layout Enforcer to recheck screens using that component
- **New token created** → Orchestrator syncs to Figma (create variable in correct collection)
- **Token renamed** → Orchestrator does global rename in Figma + notifies all enforcers to update references

---

## Figma Variable Binding Patterns

These are the Figma-specific execution patterns this orchestrator owns. Junior enforcers determine
*which* token to use; this orchestrator handles *how* to bind it in Figma.

### Colors — Bind to Primitives Variables

```javascript
const collection = await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:2135:1590');
const variable = /* look up by name from collection.variableIds */;
const solidPaint = { type: 'SOLID', color: { r, g, b } };
const boundPaint = figma.variables.setBoundVariableForPaint(solidPaint, 'color', variable);
rect.fills = [boundPaint];
```

### Spacing — Bind to Gap Variables

```javascript
frame.setBoundVariable('itemSpacing', gapVariable);
frame.setBoundVariable('paddingTop', gapVariable);
frame.setBoundVariable('paddingBottom', gapVariable);
frame.setBoundVariable('paddingLeft', gapVariable);
frame.setBoundVariable('paddingRight', gapVariable);
```

### Radius — Bind to Radius Variables

```javascript
rect.setBoundVariable('topLeftRadius', radiusVariable);
rect.setBoundVariable('topRightRadius', radiusVariable);
rect.setBoundVariable('bottomLeftRadius', radiusVariable);
rect.setBoundVariable('bottomRightRadius', radiusVariable);
```

### Text — Apply Text Styles

```javascript
await node.setTextStyleIdAsync(style.id);
```

---

## Figma Collection Verification

After loading, verify that the Figma file has matching variable collections.
Use `figma_execute` to confirm the collections exist. See `references/figma-api.md` for
collection IDs and the exact async API patterns that work.

| Collection | ID | Contents |
|------------|-----|----------|
| Primitives | `VariableCollectionId:2135:1590` | 142 color primitives |
| Semantic | `VariableCollectionId:2156:1906` | 35 semantic aliases |
| Gap | `VariableCollectionId:10:1515` | 10 spacing tokens |
| Radius | `VariableCollectionId:12:77328` | 11 radius tokens |

---

## Figma API Rules

These patterns are mandatory — the Figma plugin runs in incremental/async mode. Using sync APIs will error.

1. **Always use async methods:**
   - `figma.setCurrentPageAsync(page)` — not `figma.currentPage = page`
   - `figma.getLocalTextStylesAsync()` — not `getLocalTextStyles()`
   - `figma.variables.getVariableCollectionByIdAsync(id)` — not `getVariableCollectionById()`
   - `figma.variables.getVariableByIdAsync(id)` — not `getVariableById()`
   - `node.setTextStyleIdAsync(styleId)` — not `node.textStyleId = id`

2. **Load fonts before creating/editing text:**
   ```javascript
   await Promise.all([
     figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
     figma.loadFontAsync({ family: 'Plus Jakarta Sans', style: 'Regular' }),
     figma.loadFontAsync({ family: 'Plus Jakarta Sans', style: 'Medium' }),
     figma.loadFontAsync({ family: 'Plus Jakarta Sans', style: 'SemiBold' }),
     figma.loadFontAsync({ family: 'Plus Jakarta Sans', style: 'Bold' }),
   ]);
   ```

3. **Create variables with collection objects, not IDs:**
   ```javascript
   const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
   const v = figma.variables.createVariable(name, collection, 'COLOR');
   ```

4. **Timeout:** Use `timeout: 30000` for large operations.

See `references/figma-api.md` for the full collection ID map and more patterns.
