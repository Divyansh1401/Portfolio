# Settlr Case Study Images

Used in: `index.html` → Settlr case study overlay (`data-project="settlr"`)

## Naming convention
```
thumbnail.jpg        ← homepage project card thumbnail (shown in the featured projects row)
cover.jpg            ← case study hero banner (full-width at top of overlay)
screen-*.jpg         ← individual app screen exports (name freely, reference in JS caseStudies object)
```

## Specs
| Image | Aspect ratio | Min size | Notes |
|-------|-------------|----------|-------|
| thumbnail.jpg | 16:9 or custom | 800 × 500 px | Used as bg for project card |
| cover.jpg | ~21:9 wide | 1400 × 600 px | Full-bleed hero in case study |
| screen-*.jpg | 9:19.5 (phone) | 393 × 852 px | Match prototype screen ratio |

## How to wire in
Thumbnail → in `index.html` P2 project row, replace the background div with an `<img>` or CSS `background-image`.

Case study images → reference in the `caseStudies.settlr` JS object (search for `data-project="settlr"` in index.html).

## Current state
Prototype lives at `prototype/settlr/` — 24 interactive screens already wired into the case study iframe viewer.
Screens are placeholder/WIP. Update once Settlr design is final.
