/* ============================================================
   Settlr — Swipe-Back Gesture
   iOS-style edge swipe from left to navigate back in history.

   - Touch must start within 24px of left edge
   - Live preview: page translates with finger
   - Release at >40% screen width = navigate back
   - Release otherwise = snap back

   Plays nicely with View Transitions: when navigating back, sets
   the `tx-pop` class on <html> so the cross-doc VT animation
   matches the gesture direction.

   Honors prefers-reduced-motion (gesture still works, but no
   springy snap-back animation).
   ============================================================ */
(function () {
  'use strict';

  var EDGE_ZONE        = 24;   // px from left edge to start gesture
  var COMMIT_THRESHOLD = 0.40; // fraction of screen width to commit
  var VELOCITY_COMMIT  = 0.6;  // px/ms; quick flicks commit even if dist short
  var REDUCED = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Disable on screens that explicitly opt out
  function isDisabled() {
    return document.body.dataset.swipeBack === 'off' ||
           document.body.classList.contains('no-swipe-back');
  }

  // Don't activate on screens at the root of a history stack (no back).
  function canGoBack() {
    return window.history.length > 1;
  }

  var startX = 0, startY = 0, startT = 0;
  var lastX  = 0;
  var dragging = false;
  var width  = 0;
  var locked = false; // lock direction (horizontal vs vertical scroll)

  // Layer to hold the live transform (use document.body so the
  // entire page slides together). We restore on snap-back.
  var transformTarget = function () {
    return document.body;
  };

  function onStart(ev) {
    if (isDisabled() || !canGoBack()) return;
    var p = ev.touches ? ev.touches[0] : ev;
    if (p.clientX > EDGE_ZONE) return;

    // Skip when the start element is inside a scrollable horizontal element
    // (e.g. .h-scroll, .chips-row). Avoids fighting list scroll.
    var startEl = document.elementFromPoint(p.clientX, p.clientY);
    if (startEl && startEl.closest('.h-scroll, .chips-row, [data-no-swipe-back]')) return;

    dragging = true;
    locked = false;
    startX = p.clientX;
    startY = p.clientY;
    startT = performance.now();
    lastX  = startX;
    width  = window.innerWidth || 1;
  }

  function onMove(ev) {
    if (!dragging) return;
    var p = ev.touches ? ev.touches[0] : ev;
    var dx = p.clientX - startX;
    var dy = p.clientY - startY;
    lastX  = p.clientX;

    // Direction lock on first significant move
    if (!locked) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical scroll wins
        dragging = false;
        return;
      }
      locked = true;
    }

    if (dx < 0) dx = 0;
    var t = transformTarget();
    t.style.transition = 'none';
    t.style.transform  = 'translateX(' + dx + 'px)';
    t.style.opacity    = String(1 - Math.min(0.5, dx / width * 0.5));
    if (ev.cancelable) ev.preventDefault();
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    if (!locked) return;

    var dx = lastX - startX;
    var dt = Math.max(1, performance.now() - startT);
    var velocity = dx / dt;
    var t = transformTarget();
    var commit = (dx / width) >= COMMIT_THRESHOLD || velocity >= VELOCITY_COMMIT;

    if (commit) {
      // Slide page off-screen and navigate back
      t.style.transition = REDUCED ? 'none' :
        'transform var(--duration-base) var(--ease-out), opacity var(--duration-base) var(--ease-out)';
      t.style.transform  = 'translateX(' + width + 'px)';
      t.style.opacity    = '0';

      // Tell view transitions this is a pop
      try { sessionStorage.setItem('settlr.tx', 'tx-pop'); } catch (e) {}
      document.documentElement.classList.add('tx-pop');

      var go = function () {
        // Restore body before navigating to avoid flash
        t.style.transition = '';
        t.style.transform  = '';
        t.style.opacity    = '';
        window.history.back();
      };
      if (REDUCED) {
        go();
      } else {
        setTimeout(go, 200);
      }
    } else {
      // Snap back
      t.style.transition = REDUCED ? 'none' :
        'transform var(--duration-base) var(--ease-spring), opacity var(--duration-base) var(--ease-out)';
      t.style.transform  = 'translateX(0)';
      t.style.opacity    = '';
      var clear = function () {
        t.removeEventListener('transitionend', clear);
        t.style.transition = '';
        t.style.transform  = '';
      };
      if (REDUCED) {
        clear();
      } else {
        t.addEventListener('transitionend', clear);
      }
    }
  }

  document.addEventListener('touchstart', onStart, { passive: true });
  document.addEventListener('touchmove',  onMove,  { passive: false });
  document.addEventListener('touchend',   onEnd);
  document.addEventListener('touchcancel', onEnd);

  // Mouse fallback (for desktop testing)
  document.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onEnd);
})();
