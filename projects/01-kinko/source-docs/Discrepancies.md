# Kinko Design System — Daily Audit Report
**Date:** 2026-04-29 (re-run)
**Code Index Last Updated:** 2026-04-28
**Figma Index Last Updated:** 2026-04-28
**Latest Changelog Entry:** 2026-04-29 (Alert + Toast deprecation; List Item + Price Row; Date Picker; Menu Selected)
**Audit Status:** ⚠️ **DISCREPANCIES FOUND** (read-only audit — no changes made to Figma or codebase)

---

## Summary

| Severity | Count | Topic |
|---|---|---|
| 🔴 High | 5 | Components missing from `figma-index.json` `components` dict |
| 🟠 Medium | 4 | Pages referenced by components but missing from `figma-index.json` `pages` dict |
| 🟡 Low | 4 | Page-name format inconsistencies (`✅` checkmark prefix not in index) |
| 🟢 Hygiene | 2 | Stale `lastUpdated` fields on both indexes |

The codebase itself (CSS, specs, `css/index.css`) is **internally consistent** — all 45 component CSS files exist, are registered in `code-index.json`, and are imported in `css/index.css`. All discrepancies are concentrated in `figma-index.json`, which has been falling behind component additions.

---

## 1. 🔴 Components Missing from `figma-index.json` (High)

These components are present in `code-index.json` and the codebase but have **no entry** under `components: { … }` in `figma-index.json`:

| Component | Code Spec | Code CSS | Figma Node (per MEMORY/code-index) | In `figma-index.components`? |
|---|---|---|---|---|
| **Search Input** | `components/search-input.md` | `css/search-input.css` | `2876:4955` | ❌ Missing |
| **Textarea Input** | `components/textarea-input.md` | `css/textarea-input.css` | `2876:5262` | ❌ Missing |
| **List Item** | `components/list-item.md` | `css/list-item.css` | `3154:28`, `VariableCollectionId:3152:9` | ❌ Missing — referenced only on the page entry, no component object |
| **Price Row** | `components/price-row.md` | `css/price-row.css` | `3166:120`, `VariableCollectionId:3160:8` | ❌ Missing — referenced only on the page entry, no component object |
| **Chatbox** | _(spec/CSS pending)_ | _(spec/CSS pending)_ | `2914:9286`, `VariableCollectionId:2908:8` | ❌ Missing entirely |

**Impact:** Lookups by component name in `figma-index.json` will fail for these five. List Item and Price Row appear only inside `pages.["List Item 🟡"]` but never get full component objects (page IDs, node IDs, variant maps, variable collection IDs, component-token tables). Chatbox is referenced only in `MEMORY.md` and previous audit reports — never made it into the index.

**Notes:**
- `code-index.json` correctly carries Search Input + Textarea Input (with `figmaNode` fields) and full entries for List Item + Price Row.
- The 2026-04-27 / 2026-04-29 (previous run) audits both flagged Chatbox; still not addressed.

---

## 2. 🟠 Pages Referenced by Components but Missing from `figma-index.pages` (Medium)

The `pages: { … }` dict is missing entries for several pages that components in the `components: { … }` dict already reference via their `page` fields:

| Page Referenced By | Missing From `pages` Dict |
|---|---|
| `Tooltip` component → `page: "Tooltip 🟡"` (`pageId: 2342:67091`) | ❌ |
| `Chip Tag` component → `page: "Tabs 🟡"` | ❌ |
| `Progress Bar` component → `page: "Progress Bar 🟡"` | ❌ |
| `Chatbox` (per MEMORY + previous audits) → `page: "Chatbot 🟡"` (`2905:8`) | ❌ |

**Impact:** Any consumer iterating over `figma-index.pages` to discover all pages will not find Tooltip, Tabs, Progress Bar, or Chatbot pages even though those pages exist in Figma and host production components.

---

## 3. 🟡 Page-Name Format Inconsistencies (Low — Carried Over)

Called out in the 2026-04-27 audit and unfixed. Actual Figma page names use a `✅` checkmark prefix and slightly different text:

| `figma-index.json` page key | Actual Figma page name | Issue |
|---|---|---|
| `"Icons Foundations"` | `"✅ Icon Foundations"` | Missing `✅` + plural "Icons" vs singular "Icon" |
| `"Spacing Tokens"` | `"✅ Spacing"` | Missing `✅` + extra "Tokens" suffix |
| `"Text Styles"` | `"✅ Text Styles"` | Missing `✅` |
| `"Radius"` | `"✅ Radius "` | Missing `✅` (Figma name has trailing space) |

**Impact:** String-equality lookups (e.g., `pages["✅ Spacing"]`) will fail. Pure naming alignment task.

---

## 4. 🟢 Stale `lastUpdated` Fields (Hygiene)

| Index | `lastUpdated` field | Latest changelog entry covered |
|---|---|---|
| `code-index.json` | `2026-04-28` | Includes Alert / Date Picker / List Item / Price Row / Menu Selected — all dated **2026-04-29** in `references/changelog.md` |
| `figma-index.json` | `2026-04-28` | Includes Alert (`3184:16`), Date Cell collection, Menu Item Selected variants — all 2026-04-29 work |

Both indexes carry 2026-04-29 content, but the `lastUpdated` field still reads 2026-04-28.

---

## 5. ✅ Verified Consistent (No Action Needed)

### Codebase (45 components)
- `components/*.md` count: **45**
- `css/*.css` count (excluding `index.css`): **45**
- `css/index.css` `@import` count: **45**
- Every spec has a matching CSS file and every CSS file is imported in `css/index.css`.
- Every component listed in `code-index.components` has corresponding spec + CSS files on disk.

### Token Files (9 token CSS files + aggregator + JSON sources)
- `tokens/colors.css`, `tokens/semantic.css`, `tokens/spacing.css`, `tokens/radius.css`, `tokens/typography.css`, `tokens/borders.css`, `tokens/opacity.css`, `tokens/overlays.css`, `tokens/shadows.css`, `tokens/index.css`, `tokens/source/*.json` — all present and registered in `code-index.tokens`.

### Token Collections in `figma-index.json`
- All 7 expected collections present (primitives, semantic, gap, radius, opacity, overlay, border) with correct IDs matching `references/figma-api.md`.
- Per-component variable collections (Button, Input, OTP, Label, Radio, Stepper, Chip, Chip Filter, Chip Tag, Segmented Tab, Checkbox, Toggle, Pagination, Avatar, Divider, Header, Tooltip, Avatar Stack, Card, **Alert**, Icon Button, Bottom Sheet, Filter Tab, Filter Bar, Progress Bar, Icon Holder, Card Section, Card Tile, Link Button, Heading, Card Row, Hospital Row, Comparison Table, Popover, Date Picker, Menu Item) recorded inside each component entry. **List Item (`3152:9`) + Price Row (`3160:8`) collections only exist in `code-index.json` notes** — see Section 1.

### Recent Changelog Coverage
- 2026-04-29 **Alert** ✓ (entry present in both indexes; component spec + CSS in place; Toast removed cleanly)
- 2026-04-29 **List Item** ✓ in code-index, ❌ missing from figma-index components dict
- 2026-04-29 **Price Row** ✓ in code-index, ❌ missing from figma-index components dict
- 2026-04-29 **Date Picker** ✓ (registered as "Date Cell" in figma-index — primitive vs. composed naming is intentional)
- 2026-04-29 **Menu Item** Selected variant + Multi/Radio booleans ✓ (figma-index Menu Item entry includes 12 variants and `bg-selected` token)
- 2026-04-28 **Tooltip** rename (Chat Bubble → Tooltip) ✓ (CSS, spec, indexes match)

---

## 6. Action Items (For Next Sync — NOT Performed in This Run)

1. **Add component entries to `figma-index.components`** for: Search Input, Textarea Input, List Item, Price Row, and Chatbox (or explicitly mark Chatbox WIP if codebase implementation is still pending).
2. **Add page entries to `figma-index.pages`** for: `Tooltip 🟡`, `Tabs 🟡`, `Progress Bar 🟡`, and `Chatbot 🟡`.
3. **Align page-key strings** with the actual Figma page names (add `✅` prefix and fix spelling): `"Icons Foundations"` → `"✅ Icon Foundations"`, `"Spacing Tokens"` → `"✅ Spacing"`, `"Text Styles"` → `"✅ Text Styles"`, `"Radius"` → `"✅ Radius"`.
4. **Bump `lastUpdated`** on both `code-index.json` and `figma-index.json` to `2026-04-29`.
5. **Resolve Chatbox status** — either complete `components/chatbox.md` + `css/chatbox.css` (referenced in `MEMORY.md` as "pending") or explicitly note the deferred status in `code-index.json`.

---

**Report generated:** 2026-04-29 (automated scheduled audit, read-only — no Figma or codebase changes made)
**Previous run:** 2026-04-29 (earlier; same findings — indexes not yet updated)
**Next scheduled review:** 2026-04-30
