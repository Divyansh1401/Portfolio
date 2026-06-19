# Kinko Design System

Design system for Kinko — an insurance selling platform for mobile and desktop.

## Quick Links

- **Design reference (cheat sheet):** `design-reference.md`
- **Full system docs:** `design-system.md`
- **Figma enforcer skill:** `figma-enforcer.md`
- **Figma API + collection IDs:** `references/figma-api.md`
- **Changelog:** `references/changelog.md`

## Structure

```
Kinko_Design/
├── tokens/
│   ├── index.css          ← import this in every screen
│   ├── colors.css         ← 142 primitive colors
│   ├── semantic.css       ← 35 semantic aliases (use these in components)
│   ├── spacing.css        ← spacing scale
│   ├── radius.css         ← radius scale
│   ├── typography.css     ← font + 16 text style classes
│   ├── borders.css        ← border widths
│   ├── opacity.css        ← opacity levels
│   ├── overlays.css       ← scrim levels
│   ├── shadows.css        ← elevation/shadow levels
│   └── source/            ← JSON exports (read-only, Figma sync)
├── components/            ← component specs (.md)
├── css/                   ← component CSS files
├── screens/               ← screen HTML files
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── guidelines/            ← brand + accessibility guidelines
└── patterns/              ← page patterns and layouts
```

## Status

- [x] Primitive tokens (142 colors, spacing, radius, border, opacity, overlay)
- [x] Semantic tokens (35 aliases)
- [x] Elevation tokens
- [x] CSS token files
- [ ] Core components (Phase 2)
- [ ] Screen templates (Phase 3)
- [ ] Brand + accessibility guidelines (Phase 4)
