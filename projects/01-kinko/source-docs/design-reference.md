# Kinko Design Reference

Quick cheat sheet. For full specs see `design-system.md`. Always `@import 'tokens/index.css'`.

---

## Semantic Color Tokens

Use these in all components. Never use `--color-*` primitives unless no semantic alias exists.

```css
/* Surface */
--surface-default          /* white — default page/card bg */
--surface-secondary        /* grey-50 — subtle bg */
--surface-tertiary         /* grey-100 — inset bg */
--surface-brand            /* green-50 — brand-tinted bg */
--surface-inverse          /* navy-900 — dark surface */
--surface-inverse-secondary /* navy-800 */

/* Text */
--text-primary             /* navy-900 — main body text */
--text-secondary           /* grey-500 — muted/secondary text */
--text-tertiary            /* grey-300 — placeholder, disabled */
--text-inverse             /* white — on dark surfaces */
--text-brand               /* green-600 — brand-colored text */
--text-error               /* error-500 */
--text-on-action-primary   /* white — on green buttons */
--text-on-action-secondary /* navy-500 — on outlined buttons */

/* Action */
--action-primary           /* green-500 — primary CTA */
--action-primary-pressed   /* green-600 */
--action-secondary         /* navy-500 — secondary button */
--action-secondary-pressed /* navy-600 */
--action-disabled          /* grey-200 */
--action-destructive       /* error-500 */
--action-link              /* info-500 — hyperlinks */

/* Border */
--border-default           /* grey-200 — standard border */
--border-strong            /* grey-400 — emphasized border */
--border-subtle            /* grey-100 — hairline separator */
--border-focus             /* green-500 — focus ring */
--border-error             /* error-500 */
--border-selected          /* green-500 — selected state */

/* Feedback */
--feedback-success         /* success-500 */
--feedback-success-bg      /* success-50 */
--feedback-error           /* error-500 */
--feedback-error-bg        /* error-50 */
--feedback-warning         /* warning-500 */
--feedback-warning-bg      /* warning-50 */
--feedback-info            /* info-500 */
--feedback-info-bg         /* info-50 */
```

---

## Typography Classes

```html
<!-- Titles -->
<h1 class="text-title-xl">Page heading — 20px Bold</h1>
<h2 class="text-title-lg">Section heading — 18px Bold</h2>
<h3 class="text-title-md">Sub-section — 16px Bold</h3>
<h4 class="text-title-sm">Card title — 14px SemiBold</h4>
<h5 class="text-title-xs">Small heading — 13px SemiBold</h5>

<!-- Body -->
<p class="text-body-md">Standard body — 14px Regular</p>
<p class="text-body-sm">Secondary body — 12px Regular</p>
<p class="text-body-xs">Fine print — 10px Regular</p>

<!-- Labels (buttons, forms, nav) -->
<span class="text-label-lg">Primary label — 16px SemiBold</span>
<span class="text-label-lg-medium">Secondary label — 16px Medium</span>
<span class="text-label-md">Form label — 14px SemiBold</span>
<span class="text-label-md-medium">Alt label — 14px Medium</span>
<span class="text-label-xs">Badge — 12px Medium</span>

<!-- Captions -->
<span class="text-caption-md">Caption — 12px Regular</span>
<span class="text-caption-sm-bold">Micro bold — 10px Bold</span>
<span class="text-caption-sm-medium">Micro — 10px Medium</span>

<!-- Overline (uppercase · ExtraBold · 2px letter-spacing) -->
<span class="text-overline-lg">Section label — 14px ExtraBold</span>
<span class="text-overline-md">Stat label — 12px ExtraBold</span>
<span class="text-overline-sm">Badge text — 10px ExtraBold</span>
```

---

## Spacing

```css
--spacing-2   /* 2px  — icon nudge */
--spacing-4   /* 4px  — tight */
--spacing-8   /* 8px  — base */
--spacing-12  /* 12px — comfortable */
--spacing-16  /* 16px — standard */
--spacing-20  /* 20px — relaxed */
--spacing-24  /* 24px — spacious */
--spacing-32  /* 32px — airy */
--spacing-48  /* 48px — wide */
--spacing-64  /* 64px — extra wide */
```

---

## Radius

```css
--radius-2    --radius-4    --radius-8    --radius-12   --radius-16
--radius-20   --radius-24   --radius-32   --radius-48   --radius-64
--radius-pill /* 9999px */
```

---

## Border Widths · Shadows · Opacity · Overlays

```css
/* Border widths */
--border-width-hairline  /* 0.5px */
--border-width-small     /* 1px */
--border-width-medium    /* 1.5px */
--border-width-large     /* 2px */

/* Shadows */
--shadow-none
--shadow-low      /* Cards */
--shadow-medium   /* Dropdowns */
--shadow-high     /* Modals */
--shadow-highest  /* Toasts */

/* Opacity (use on element opacity property) */
--opacity-subtle    /* 0.10 */
--opacity-medium    /* 0.25 */
--opacity-strong    /* 0.50 */
--opacity-disabled  /* 0.75 */
--opacity-backdrop  /* 0.90 */

/* Overlays (use as background-color on scrim divs) */
--overlay-20   --overlay-35   --overlay-50   --overlay-65   --overlay-80
```

---

## Brand Primitives (when no semantic alias exists)

```css
/* Green — primary brand */
--color-primary-green-500  /* #009b1a — main green */
--color-primary-green-50   /* #e6f5e8 — green tint */

/* Navy — secondary brand */
--color-primary-navy-500   /* #0b2b40 — main navy */
--color-primary-navy-900   /* #02090d — darkest navy */

/* Grey — neutral */
--color-primary-grey-50    /* #f0f1f3 */
--color-primary-grey-200   /* #c4c8ce */
--color-primary-grey-500   /* #6b7585 */
```

---

## Common Patterns

```css
/* Card */
background: var(--surface-default);
border: var(--border-width-small) solid var(--border-default);
border-radius: var(--radius-12);
padding: var(--spacing-16);
box-shadow: var(--shadow-low);

/* Primary button */
background: var(--action-primary);
color: var(--text-on-action-primary);
border-radius: var(--radius-8);
padding: var(--spacing-12) var(--spacing-16);

/* Input field */
border: var(--border-width-small) solid var(--border-default);
border-radius: var(--radius-8);
padding: var(--spacing-12);
color: var(--text-primary);
background: var(--surface-default);

/* Input — focus state */
border-color: var(--border-focus);
outline: none;

/* Input — error state */
border-color: var(--border-error);
color: var(--text-error);

/* Section header */
color: var(--text-primary);
/* title class: .text-title-md */

/* Muted label */
color: var(--text-secondary);
/* text class: .text-body-sm */
```

---

## File Locations

| Purpose | Path |
|---------|------|
| All tokens (CSS) | `tokens/index.css` |
| Primitive colors | `tokens/colors.css` |
| Semantic colors | `tokens/semantic.css` |
| Typography | `tokens/typography.css` |
| Spacing / Radius / Borders / Shadows | `tokens/spacing.css` etc. |
| Token source (JSON, read-only) | `tokens/source/` |
| Component specs | `components/[name].md` |
| Component CSS | `css/[name].css` |
| Screen HTML | `screens/[name].html` |
| Figma Enforcer | `figma-enforcer.md` |
| Figma API reference | `references/figma-api.md` |
| Changelog | `references/changelog.md` |
