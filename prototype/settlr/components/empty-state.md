# Empty State

A centered placeholder shown when a list or screen has no content. Consists of an illustration container, a text block, and an optional CTA button.

**CSS file:** `css/empty-state.css`
**Class prefix:** `.empty-state`

---

## Structure

```
.empty-state
  ├── .empty-state__illustration  (96×96, olive/50 bg)
  │     └── <svg> icon (48×48, olive/300)
  ├── .empty-state__text
  │     ├── .empty-state__title   (Unbounded Bold 18px)
  │     └── .empty-state__body    (Plus Jakarta Sans Regular 14px)
  └── .btn  (optional CTA — primary or secondary)
```

---

## Token usage

| Element | Token | Value |
|---------|-------|-------|
| Illustration background | `--empty-state-illus-bg` | olive/50 |
| Illustration icon color | `--empty-state-illus-fg` | olive/300 |
| Title text | `--empty-state-title-fg` | neutral/800 |
| Body text | `--empty-state-body-fg` | neutral/500 |

---

## Usage

```html
<!-- No groups -->
<div class="empty-state">
  <div class="empty-state__illustration">
    <svg viewBox="0 0 48 48" fill="none">
      <!-- your icon path here -->
    </svg>
  </div>
  <div class="empty-state__text">
    <p class="empty-state__title">No groups yet</p>
    <p class="empty-state__body">Create a group to start splitting expenses with friends</p>
  </div>
  <button class="btn btn--md btn--primary">Create a group</button>
</div>

<!-- No activity (no CTA) -->
<div class="empty-state">
  <div class="empty-state__illustration">
    <svg viewBox="0 0 48 48" fill="none">...</svg>
  </div>
  <div class="empty-state__text">
    <p class="empty-state__title">All quiet here</p>
    <p class="empty-state__body">Your recent activity will show up here</p>
  </div>
</div>
```

---

## Rules

- The CTA button is optional — only include when there's a clear primary action.
- Always place `.empty-state` centered within its parent (`.screen__content` or a `.section`).
- The illustration SVG should be 48×48 within the 96×96 container — no need to size the SVG explicitly (handled by CSS).
- Never hardcode colors inside the SVG — rely on `currentColor` so the `--empty-state-illus-fg` token controls icon color.
- Only `.btn--md` buttons are appropriate here (not SM or LG).
