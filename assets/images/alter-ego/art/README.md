# Art & More Section — Category Thumbnails

Used in: `alter-ego.html` → Art & More section (split layout with side panel index)

## Categories & counts
| Category | ID | Count | Folder prefix |
|----------|----|-------|--------------|
| Traditional Art | `traditional` | 6 thumbnails | `trad-` |
| Cyanotype | `cyanotype` | 3 thumbnails | `cyano-` |
| 3D Renders / Digital | `digital` | 4 thumbnails | `digital-` |

## Naming
```
trad-01.jpg ... trad-06.jpg
cyano-01.jpg ... cyano-03.jpg
digital-01.jpg ... digital-04.jpg
```

## Spec
- Aspect ratio: **1:1** (square thumbnails in the panel) + **any** for the large preview canvas
- Minimum size: **400 × 400 px** (thumbnails are displayed small but zoom on hover)
- Format: JPG or WebP
- Suggested max file size: 300 KB each

## How to wire in
In `alter-ego.html`, the `ART_CATS` JS constant drives both the preview canvas and side panel.
Currently each item has `{ bg: '#hex' }`. Replace with `{ bg: '#hex', src: 'path/to/image.jpg' }`:

```javascript
const ART_CATS = [
  {
    id: 'traditional',
    label: 'Traditional Art',
    items: [
      { bg: '#4a4b47', src: 'assets/images/alter-ego/art/trad-01.jpg' },
      { bg: '#424340', src: 'assets/images/alter-ego/art/trad-02.jpg' },
      // ...
    ]
  },
  // ...
];
```

Then update the `showItem()` function to set an `<img>` src instead of a background color, and update the thumbnail `.art-fill` divs to `<img>` tags in `panel.innerHTML`.
