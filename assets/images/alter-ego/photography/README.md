# Photography Section — Stacked Viewer Images

Used in: `alter-ego.html` → Photography section (cursor-driven stacked image viewer)

## How many
8 images (currently 8 placeholder colored cards).

## Naming
```
photo-01.jpg
photo-02.jpg
...
photo-08.jpg
```

## Spec
- Aspect ratio: **3:4** (portrait — matches `width: calc(72vh * 0.75)` layout)
- Minimum size: **600 × 800 px**
- Format: JPG or WebP
- Suggested max file size: 400 KB each

## How to wire in
In `alter-ego.html`, the photography images are driven by the `photoWraps` NodeList.
Replace each `.photo-fill` placeholder div with a real `<img>`:

```html
<!-- Before (placeholder color) -->
<div class="photo-img-wrap" data-photo="0">
  <div class="photo-fill" style="background:#3a3b37;"></div>
  <div class="photo-img-overlay"></div>
</div>

<!-- After (real image) -->
<div class="photo-img-wrap" data-photo="0">
  <img class="photo-fill" src="assets/images/alter-ego/photography/photo-01.jpg" alt="" style="object-fit:cover;">
  <div class="photo-img-overlay"></div>
</div>
```

The gallery overlay (`openPhotoGallery()` JS function) auto-populates from these same wraps — no extra wiring needed.
