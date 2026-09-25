# Birthday page: the reference for the recipient page

`birthday.html` is a copy of the owner's original birthday page (kept on the
owner's machine in `Vyomi's Birthday/`; that original is never edited). The
recipient page `/b/:id` (`app/pages/bouquet.html`, `app/client/bouquet.page.js`,
`app/styles/bouquet.css`) reproduces its structure, timings, type and motion,
with the sender's flower, note, countdown and gifts in place of the fixed
content.

Differences in this copy, on purpose:

- The QR code's path data is replaced by an empty square. The repo is public
  and the code pointed at a private destination.
- It loads `birthday/bouquet-v6.html` and `birthday/fonts/TAN-MONCHERI.*`,
  which are not in the repo. The bouquet is the same renderer as
  `packages/renderer`; the font is a licensed TAN Type Foundry face (see
  `app/fonts/README.md`).
