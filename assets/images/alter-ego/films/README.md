# Filmmaking Section — Poster Images

Used in: `alter-ego.html` → Filmmaking section (3 expanding flex cards)

## How many
3 images — one per film card.

## Naming
```
film-01.jpg   ← Card 1 (first card, expanded by default)
film-02.jpg   ← Card 2
film-03.jpg   ← Card 3
```

## Spec
- Aspect ratio: **any** (images fill the card via `object-fit: cover`)
- Minimum size: **800 × 1200 px** (taller than wide works best for the card layout)
- Format: JPG or WebP
- Suggested max file size: 500 KB each

## How to wire in
In `alter-ego.html`, inside each `.film-card`, replace the `.film-card-poster` placeholder div:
```html
<!-- Before (placeholder) -->
<div class="film-card-poster"></div>

<!-- After (real image) -->
<div class="film-card-poster">
  <img src="assets/images/alter-ego/films/film-01.jpg" alt="Film title" style="width:100%;height:100%;object-fit:cover;">
</div>
```

Also update the placeholder title text in `.film-card-name` and `.film-card-desc`.
