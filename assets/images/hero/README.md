# Hero Portrait

Used in: `index.html` (light side) and `alter-ego.html` (dark side)

## Spec
- Aspect ratio: **3:4** (portrait)
- Minimum size: **840 × 1120 px**
- Format: JPG or WebP
- Suggested max file size: 400 KB

## Naming
```
portrait.jpg   ← primary (used in both pages)
```

## How to wire it in
In `index.html`, replace the `.photo-placeholder` inside `.hero-photo-front`:
```html
<img src="assets/images/hero/portrait.jpg" alt="Divyansh Rastogi" class="hero-portrait">
```

In `alter-ego.html`, same replacement inside `.hero-photo-wrap .photo-placeholder`.

Add CSS:
```css
.hero-portrait { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; }
```
