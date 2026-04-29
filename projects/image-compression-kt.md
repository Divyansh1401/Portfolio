# Image Compression KT — Portfolio Site

**Purpose:** Convert all images from PNG/JPG → WebP and update all references in `index.html`.
**Working file:** `/Users/divyanshrastogi/Desktop/Website/index.html`
**Goal:** Reduce 296MB → ~10MB without any visible quality loss.

---

## Current State

| Folder | Approx Size | Format |
|---|---|---|
| `assets/images/photography/` | ~180MB | RAW-export JPEGs (up to 21MB each) |
| `assets/images/refer-earn/` | ~80MB | PNGs (up to 12MB each) |
| `assets/images/settlr/` | ~15MB | PNGs |
| `assets/images/hero/` | ~1.5MB | PNGs |
| `assets/images/small-cards/` | ~3.5MB | PNGs |
| `assets/images/hydrone/`, `watch/` | ~8MB | PNGs |

---

## Step 1 — Check Tool Availability

First check if `cwebp` (Google's WebP encoder) or `ffmpeg` or `sips` (macOS built-in) is available:

```bash
which cwebp && echo "cwebp ok" || echo "no cwebp"
which ffmpeg && echo "ffmpeg ok" || echo "no ffmpeg"
sips --version && echo "sips ok"
```

**If none available, install cwebp:**
```bash
brew install webp
```

`sips` is always available on macOS and can do WebP conversion — use as fallback.

---

## Step 2 — Conversion Strategy by Folder

### A. Photography (highest priority — ~180MB)
These are gallery images shown in the alter-ego dark page. They don't need to be full RAW resolution — **max 1920px wide** is enough.

```bash
# Using sips (macOS built-in):
cd /Users/divyanshrastogi/Desktop/Website/assets/images/photography
for f in *.JPG *.jpg *.jpeg; do
  sips -s format webp -Z 1920 "$f" --out "${f%.*}.webp"
done
```

```bash
# Using cwebp (if available, better quality/size ratio):
cd /Users/divyanshrastogi/Desktop/Website/assets/images/photography
for f in *.JPG *.jpg *.jpeg; do
  cwebp -q 82 -resize 1920 0 "$f" -o "${f%.*}.webp"
done
```

### B. refer-earn PNGs (second priority — ~80MB)
Case study images. Keep full resolution but compress. Quality 85 for UI screenshots, 80 for infographics.

```bash
cd /Users/divyanshrastogi/Desktop/Website/assets/images/refer-earn
for f in *.png; do
  cwebp -q 85 "$f" -o "${f%.*}.webp"
done
```

```bash
# sips fallback:
for f in *.png; do
  sips -s format webp "$f" --out "${f%.*}.webp"
done
```

### C. settlr PNGs
```bash
cd /Users/divyanshrastogi/Desktop/Website/assets/images/settlr
find . -name "*.png" | while read f; do
  dir=$(dirname "$f")
  base=$(basename "$f" .png)
  cwebp -q 85 "$f" -o "$dir/$base.webp"
done
```

### D. hero, small-cards, hydrone, watch
```bash
for folder in hero small-cards hydrone watch; do
  cd /Users/divyanshrastogi/Desktop/Website/assets/images/$folder
  for f in *.png *.jpg *.JPG; do
    [ -f "$f" ] && cwebp -q 85 "$f" -o "${f%.*}.webp"
  done
  cd -
done
```

---

## Step 3 — Verify Conversion

After conversion, check that WebP files exist and are smaller:

```bash
find /Users/divyanshrastogi/Desktop/Website/assets/images -name "*.webp" | xargs du -sh | sort -rh | head -20
```

Also check total size:
```bash
du -sh /Users/divyanshrastogi/Desktop/Website/assets/images/
```

Target: under 15MB total.

---

## Step 4 — Update `index.html` References

All image references need `.png` / `.jpg` / `.JPG` → `.webp`.

**Known image references in index.html (all lines confirmed):**

| Original src | New src |
|---|---|
| `assets/images/hero/portrait-light.png` | `assets/images/hero/portrait-light.webp` |
| `assets/images/hero/click-to-flip-dark.png` | `assets/images/hero/click-to-flip-dark.webp` |
| `assets/images/hero/Alter%20ego%20image.png` | `assets/images/hero/Alter%20ego%20image.webp` |
| `assets/images/hero/click-to-flip-light.png` | `assets/images/hero/click-to-flip-light.webp` |
| `assets/images/refer-earn/thumbnail-bg.png` | `assets/images/refer-earn/thumbnail-bg.webp` |
| `assets/images/small-cards/prosper.png` | `assets/images/small-cards/prosper.webp` |
| `assets/images/small-cards/angel-one.png` | `assets/images/small-cards/angel-one.webp` |
| `assets/images/small-cards/whack-a-math.png` | `assets/images/small-cards/whack-a-math.webp` |
| `assets/images/small-cards/Creative-burnout.png` | `assets/images/small-cards/Creative-burnout.webp` |
| `assets/images/settlr/cover-phone.png` | `assets/images/settlr/cover-phone.webp` |
| `assets/images/settlr/figma-contrast-checker.png` | `assets/images/settlr/figma-contrast-checker.webp` |
| `assets/images/settlr/Components.png` | `assets/images/settlr/Components.webp` |
| `assets/images/settlr/Component cadebase.png` | `assets/images/settlr/Component cadebase.webp` |
| All `assets/images/settlr/screens/*.png` | same path, `.webp` extension |
| All `assets/images/settlr/splitwise/*.png` | same path, `.webp` extension |
| All `assets/images/photography/*.JPG` / `.jpg` | same path, `.webp` extension |

**There are also JS references** in the `caseStudies` object inside index.html. Search for:
```
assets/images/refer-earn/
```
And replace all `.png` occurrences with `.webp` there too.

**The thumbnail-fg.png is referenced in JS** (not in HTML):
```javascript
// Search for: thumbnail-fg.png
// Replace with: thumbnail-fg.webp
```

**Quick bulk replace command (run from project root):**
```bash
# Backup first
cp index.html index.html.bak

# Replace extensions in src= attributes and JS strings
sed -i '' \
  -e 's|assets/images/\([^"]*\)\.png|assets/images/\1.webp|g' \
  -e 's|assets/images/\([^"]*\)\.jpg|assets/images/\1.webp|g' \
  -e 's|assets/images/\([^"]*\)\.JPG|assets/images/\1.webp|g' \
  index.html
```

⚠️ **After running sed, verify** the file looks correct by searching for `.png` or `.jpg` in the file — should only find Behance CDN URLs and comments, not local asset paths.

---

## Step 5 — Add `loading="lazy"` to Below-Fold Images

All images except the hero should have `loading="lazy"`. Search for `<img src="assets/images/` in index.html and add `loading="lazy"` to any that don't have it yet.

Hero images (keep eager — above fold):
- `portrait-light.webp` (already has `loading="lazy"` — actually remove it, it's above fold)
- `click-to-flip-dark.webp`
- `click-to-flip-light.webp`

Everything else → ensure `loading="lazy"` is present.

---

## Step 6 — Add `will-change: transform` for Parallax Elements

Add to CSS for the elements that animate on scroll/mousemove:

```css
#p3-fg,
.small-card,
.project-img-inner,
#cursor,
#cursor-ring {
  will-change: transform;
}
```

---

## Step 7 — Push to GitHub (auto-deploys to Netlify)

```bash
cd /Users/divyanshrastogi/Desktop/Website
git add assets/images/ index.html
git commit -m "Compress images to WebP — reduce 296MB → ~10MB"
git push
```

Netlify auto-deploys on push. Done.

---

## Do NOT Delete Original Files Until Verified

Keep the original `.png` / `.jpg` files until you've:
1. Confirmed the site looks correct in preview
2. Confirmed Netlify deploy succeeded

Then optionally delete originals to save disk space:
```bash
find /Users/divyanshrastogi/Desktop/Website/assets/images -name "*.png" -not -name "*.webp" -delete
find /Users/divyanshrastogi/Desktop/Website/assets/images -name "*.JPG" -delete
find /Users/divyanshrastogi/Desktop/Website/assets/images -name "*.jpg" -delete
```

---

## Expected Outcome

| Before | After |
|---|---|
| 296MB total images | ~8–12MB total |
| 21MB single photo | ~200–400KB |
| 12MB cover.png | ~300–500KB |
| 7.2MB thumbnail-fg.png | ~200–400KB |
| Page load: 20–30s on slow connections | Page load: 1–3s |
