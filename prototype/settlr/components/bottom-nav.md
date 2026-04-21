# Bottom Nav Bar

**Figma ID:** `130:9281` | **CSS:** `css/navigation.css` | **Class prefix:** `.bottom-nav`

---

## Design

Floating pill nav bar paired with a FAB. The wrapper is fixed to the bottom of the screen and contains both the pill and the FAB side by side.

```
┌─────────────────────────────────────────────────────┐
│  padding-16                                         │
│  [ Home ] [ People ] [ Activity ]    ( + FAB )      │
│  └──────── .bottom-nav (pill) ───────┘              │
└─────────────────────────────────────────────────────┘
    └──────────── .bottom-nav-bar (wrapper) ──────────┘
```

---

## Variants

| Variant | Active tab |
|---------|-----------|
| `Active=Home` | Home tab highlighted |
| `Active=People` | People tab highlighted |
| `Active=Activity` | Activity tab highlighted |

---

## Anatomy

| Element | Class |
|---------|-------|
| Fixed wrapper | `.bottom-nav-bar` |
| Pill container | `.bottom-nav` |
| Tab item | `.bottom-nav__tab` |
| Tab inner (icon + label) | `.bottom-nav__tab-content` |
| Tab icon | `.bottom-nav__tab-icon` |
| Tab label | `.bottom-nav__tab-label` |
| FAB (alongside) | `.fab` (from `css/fab.css`) |

---

## Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Wrapper padding | 16px | `--spacing-16` |
| Tab width | 83px | — |
| Tab height | 48px | `--spacing-48` |
| Pill gap (between tabs) | 8px | `--spacing-8` |
| Pill padding | 4px | `--spacing-4` |

---

## Colors

| Element | Token |
|---------|-------|
| Pill background | `--nav-bar-bg` → `gray/0` |
| Pill shadow | `--shadow-sm` |
| Active tab bg | `--nav-tab-bg-active` → `gray/200` |
| Active tab fg | `--nav-tab-fg-active` → `neutral/900` |
| Default tab fg | `--nav-tab-fg-default` → `neutral/900` |

---

## Typography

| Element | Style | Size | Weight |
|---------|-------|------|--------|
| Tab label | Label/Label-XS (Plus Jakarta Sans) | 11px | Medium (500) |

---

## Usage

```html
<div class="bottom-nav-bar">
  <nav class="bottom-nav">
    <a href="home-dashboard" class="bottom-nav__tab is-active">
      <div class="bottom-nav__tab-content">
        <span class="bottom-nav__tab-icon"><i class="ph-fill ph-house"></i></span>
        <span class="bottom-nav__tab-label">Home</span>
      </div>
    </a>
    <a href="people" class="bottom-nav__tab">
      <div class="bottom-nav__tab-content">
        <span class="bottom-nav__tab-icon"><i class="ph ph-user"></i></span>
        <span class="bottom-nav__tab-label">People</span>
      </div>
    </a>
    <a href="activity" class="bottom-nav__tab">
      <div class="bottom-nav__tab-content">
        <span class="bottom-nav__tab-icon"><i class="ph ph-clock"></i></span>
        <span class="bottom-nav__tab-label">Activity</span>
      </div>
    </a>
  </nav>
  <a href="add-amount" class="fab" aria-label="Add expense">
    <i class="ph-bold ph-plus"></i>
  </a>
</div>
```

---

## Notes

- `.bottom-nav-bar` is the fixed-position wrapper — `pointer-events: none` so it doesn't block scroll; each child re-enables with `pointer-events: auto`
- The FAB is `position: static` inside the wrapper (not absolutely positioned)
- Active state: `is-active` class on `.bottom-nav__tab`
- Tab labels: 11px Medium (not 10px)
