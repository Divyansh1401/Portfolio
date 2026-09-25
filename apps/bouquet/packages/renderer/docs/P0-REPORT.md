# P0 report — perf + size

Date: 2026-09-25

Machine: cloud container, headless Chromium 141, --disable-gpu; relative numbers only

(a) REFERENCE = `reference/bouquet-loader.ref.js`, driven the way the shipping loader's own `run()` drives it (fly-in: `setYaw()` then `setP()` per frame — two internal `draw()` calls). (b) NEW = `src/core.js` + `src/painter-canvas.js`, driven the way `driver.js`'s `tick()`/`paintOnce()` drives it (one `model.set()` covering p/q/yaw, then one `paint()` — one paint per frame). All times are frame-call durations in ms (renderer calls only, not the rAF wait), 120 (or 121) frames per cell, at 390x844.

## DPR 1

### CPU throttle 4x

| scenario | ref median | ref p95 | ref max | new median | new p95 | new max |
|---|---|---|---|---|---|---|
| fly-in | 37.60 | 50.40 | 74.10 | 16.60 | 21.10 | 30.20 |
| reveal | 17.10 | 24.90 | 35.30 | 16.20 | 25.00 | 42.40 |
| landed-idle | 7.00 | 11.60 | 15.40 | 7.60 | 11.00 | 19.10 |

### CPU throttle 6x

| scenario | ref median | ref p95 | ref max | new median | new p95 | new max |
|---|---|---|---|---|---|---|
| fly-in | 56.70 | 75.10 | 108.90 | 25.90 | 33.30 | 45.10 |
| reveal | 26.10 | 39.50 | 48.70 | 24.10 | 31.40 | 41.70 |
| landed-idle | 10.90 | 15.50 | 25.70 | 10.80 | 13.80 | 20.90 |

## DPR 1.5

### CPU throttle 4x

| scenario | ref median | ref p95 | ref max | new median | new p95 | new max |
|---|---|---|---|---|---|---|
| fly-in | 36.50 | 43.90 | 62.60 | 16.60 | 22.20 | 33.50 |
| reveal | 16.50 | 24.20 | 38.20 | 15.00 | 19.90 | 29.50 |
| landed-idle | 7.60 | 11.20 | 14.80 | 7.00 | 8.90 | 11.70 |

### CPU throttle 6x

| scenario | ref median | ref p95 | ref max | new median | new p95 | new max |
|---|---|---|---|---|---|---|
| fly-in | 56.40 | 75.20 | 96.10 | 26.10 | 33.20 | 46.30 |
| reveal | 25.20 | 33.10 | 52.10 | 24.30 | 32.10 | 44.40 |
| landed-idle | 11.70 | 16.50 | 26.50 | 11.40 | 14.00 | 58.30 |

## DPR 2

### CPU throttle 4x

| scenario | ref median | ref p95 | ref max | new median | new p95 | new max |
|---|---|---|---|---|---|---|
| fly-in | 38.40 | 52.40 | 80.50 | 17.10 | 25.20 | 29.20 |
| reveal | 16.20 | 21.80 | 34.60 | 15.80 | 22.30 | 47.80 |
| landed-idle | 7.60 | 10.00 | 13.50 | 7.30 | 12.10 | 15.30 |

### CPU throttle 6x

| scenario | ref median | ref p95 | ref max | new median | new p95 | new max |
|---|---|---|---|---|---|---|
| fly-in | 57.50 | 70.80 | 102.40 | 27.40 | 36.40 | 56.40 |
| reveal | 27.10 | 38.90 | 60.40 | 25.60 | 32.80 | 42.10 |
| landed-idle | 11.80 | 18.60 | 21.30 | 11.50 | 16.40 | 19.60 |

## Bundle size (`scripts/size.mjs`, `src/index.js`)

| min (bytes) | gzip (bytes) | brotli (bytes) | budget (gzip) | ok |
|---|---|---|---|---|
| 16835 | 7425 | 6708 | 8000 | yes |

## Summary

1. Worst-case REFERENCE frame: 75.20ms p95 (fly-in, DPR 1.5, 6x throttle).
2. Worst-case NEW frame: 36.40ms p95 (fly-in, DPR 2, 6x throttle).
3. Fly-in (two draws/frame for ref, one paint/frame for new) medians — DPR1/4x: ref 37.60 vs new 16.60; DPR1/6x: ref 56.70 vs new 25.90; DPR1.5/4x: ref 36.50 vs new 16.60; DPR1.5/6x: ref 56.40 vs new 26.10; DPR2/4x: ref 38.40 vs new 17.10; DPR2/6x: ref 57.50 vs new 27.40.
4. Bundle: 7425 gzip bytes vs an 8000-byte budget — within budget.
5. Numbers are relative (headless cloud container, no GPU) — use them to compare ref vs new and DPR/throttle trends, not as absolute frame budgets on real hardware.
