# Reference copy provenance

`bouquet-loader.ref.js` in this directory is a byte-for-byte copy of the
portfolio's shipping loader.

- **Source path**: `assets/js/bouquet-loader.js` (repo root, outside `apps/bouquet`)
- **Source commit**: `827d2d3` — this is what
  `git -C /home/user/Portfolio log -1 --format=%h -- assets/js/bouquet-loader.js`
  printed when this copy was made (the task brief's expected `a391ef6` did not
  match; the value above is the actual, verified result of running that
  command, and is the one that governs).
- **SHA-256**: `dd391b5ede0c39d5878621733ecb3b583bd786da656160921b6241445e6bae01`
- **Date vendored**: 2026-09-25

## Rule

**Never edit this file.** It is a pinned mirror, not a place to patch or
adapt code. If the portfolio loader changes upstream and the renderer needs
to track the change:

1. Re-vendor deliberately: copy the new `assets/js/bouquet-loader.js` over
   this file (`cp`, not a hand edit).
2. Update the source commit, SHA-256 and date recorded above.
3. Re-capture the renderer's golden fixtures/tests against the new copy —
   do not assume prior goldens still hold.

`packages/renderer/test/reference-pin.test.mjs` hard-fails if this file's
hash drifts from the pinned value, so an accidental edit here is caught
immediately by `npm test`.
