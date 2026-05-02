# Settlr Design System — Build Conventions

## Figma API Patterns

### Variable binding for paints (fills/strokes)
```js
function bp(color, token) {
  return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color }, 'color', token);
}
node.fills = [bp({ r: 1, g: 1, b: 1 }, tokens.contactBg)];
```
Cannot use `setBoundVariable` directly on fills — must use `setBoundVariableForPaint`.

### Spacing token binding
```js
node.setBoundVariable('itemSpacing', spacingVar);
node.setBoundVariable('paddingTop', spacingVar);
// Also: paddingBottom, paddingLeft, paddingRight
```

### Creating component tokens
```js
const v = figma.variables.createVariable('token/name', componentCol, 'COLOR');
v.description = 'Description';
v.scopes = ['TEXT_FILL', 'SHAPE_FILL']; // valid: FRAME_FILL, SHAPE_FILL, TEXT_FILL, STROKE_COLOR, WIDTH_HEIGHT, GAP
v.setValueForMode(compModeId, { type: 'VARIABLE_ALIAS', id: primitiveVar.id });
```

### Component sets (variants)
```js
const cardSet = figma.combineAsVariants([comp1, comp2], parentSection);
cardSet.name = 'Component Name';
// Variants stack at (0,0) — position them manually or set layout on the set
cardSet.layoutMode = 'HORIZONTAL';
cardSet.itemSpacing = 20;
```

### Text styles
```js
await node.setTextStyleIdAsync('S:styleId,');
```

### Font loading (required before text operations)
```js
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); // Figma default
await figma.loadFontAsync({ family: 'Plus Jakarta Sans', style: 'SemiBold' });
```

### Async node access
```js
const node = await figma.getNodeByIdAsync('151:9871');
// NOT figma.getNodeById() — use async version
// Also: node.getMainComponentAsync() instead of node.mainComponent
```

### Screenshots for verification
Use `figma_capture_screenshot` (plugin export), NOT `figma_take_screenshot` (REST API) — REST often fails for newly created nodes.

## Common Pitfalls
- `counterAxisSizingMode = 'FILL'` is NOT valid — use `layoutGrow = 1` on child instead
- After `combineAsVariants()`, all variants stack at (0,0) — reposition them
- Must load Inter Regular before creating any text nodes
- Instance children: use `figma_set_instance_properties`, NOT direct text editing (fails silently)

## User Preferences
- Mobile only — no hover states, keep Pressed for interaction feedback
- No dark mode
- Step-by-step token creation as components are built
- Don't modify components the user is actively editing — verify later
- No Remove action variant on Person Item — use Chevron + bottom sheet
- No selected row highlight — only control changes
- Comments appear on Expense Items, NOT Person Items
- Use Illustration component (138:9447) instead of avatars for expense items
- Default states have no fill (transparent background)
- Paid By Selector = Person Item with Action=Input variant (no separate component)
