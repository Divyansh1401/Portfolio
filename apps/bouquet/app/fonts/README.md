# Fonts

The recipient page uses **TAN Mon Cheri** (TAN Type Foundry), the face from
the owner's birthday page. It is a commercial font, so it is not in this
public repo. To use it:

1. Check that the licence covers web embedding on this product (a desktop
   licence usually does not).
2. Put `TAN-MONCHERI.woff2` (and optionally `TAN-MONCHERI.otf`) in this
   folder. The server serves it at `/fonts/…`, and `.gitignore` keeps it out
   of git.

Without the file the page falls back to Georgia, as the birthday page does.
