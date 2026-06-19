/* ============================================================
   Settlr — Bottom Sheet Drag-to-Dismiss
   Adds touch/pointer drag gesture on .sheet elements.
   - Drag handle or anywhere on the sheet header
   - Live transform follows finger
   - Release: snap back if < 100px or close (translate fully + fade overlay) if >= 100px

   The sheet's "close" semantics are handled by the host page —
   we dispatch a `settlr:sheet-dismiss` event when threshold crossed.
   The host can listen and remove the sheet from DOM, or we fall
   back to hiding the sheet inline.

   Honors prefers-reduced-motion (drag is still allowed but no
   spring; release is instant).
   ============================================================ */
(function () {
  'use strict';

  var DISMISS_THRESHOLD = 100;     // px drag down to dismiss
  var REDUCED = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(sheet) {
    if (sheet.dataset.dragInit === '1') return;
    sheet.dataset.dragInit = '1';

    // Find handle — preferred drag area. Fall back to top of sheet.
    var handle = sheet.querySelector('.sheet__handle, .sheet-handle, [data-sheet-handle]') || sheet;

    var startY = 0;
    var lastY  = 0;
    var dragging = false;
    var sheetH = 0;

    function onStart(ev) {
      if (ev.button !== undefined && ev.button !== 0) return;
      dragging = true;
      var p = ev.touches ? ev.touches[0] : ev;
      startY = p.clientY;
      lastY  = startY;
      sheetH = sheet.offsetHeight || 1;
      sheet.style.transition = 'none';
    }

    function onMove(ev) {
      if (!dragging) return;
      var p = ev.touches ? ev.touches[0] : ev;
      var dy = Math.max(0, p.clientY - startY);
      lastY = p.clientY;
      sheet.style.transform = 'translateY(' + dy + 'px)';

      // Fade overlay alongside drag
      var overlay = sheet.previousElementSibling;
      if (overlay && overlay.classList.contains('sheet-overlay')) {
        var progress = Math.min(1, dy / sheetH);
        overlay.style.opacity = String(1 - progress);
      }
      if (ev.cancelable) ev.preventDefault();
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      var dy = lastY - startY;

      if (dy >= DISMISS_THRESHOLD) {
        // Dismiss
        sheet.style.transition = REDUCED ? 'none' :
          'transform var(--duration-base) var(--ease-out)';
        sheet.style.transform = 'translateY(100%)';
        var overlay = sheet.previousElementSibling;
        if (overlay && overlay.classList.contains('sheet-overlay')) {
          overlay.style.transition = REDUCED ? 'none' :
            'opacity var(--duration-base) var(--ease-out)';
          overlay.style.opacity = '0';
        }
        // Notify host
        sheet.dispatchEvent(new CustomEvent('settlr:sheet-dismiss', {
          bubbles: true
        }));
        // Default: hide on transition end
        var done = function () {
          sheet.removeEventListener('transitionend', done);
          // Don't auto-remove — let host decide. Just unset transform.
          // If host did nothing after a tick, hide sheet visually.
          setTimeout(function () {
            if (sheet.isConnected && getComputedStyle(sheet).display !== 'none' &&
                sheet.style.transform.indexOf('100%') !== -1) {
              sheet.style.display = 'none';
              if (overlay) overlay.style.display = 'none';
            }
          }, 50);
        };
        if (REDUCED) {
          done();
        } else {
          sheet.addEventListener('transitionend', done);
        }
      } else {
        // Snap back
        sheet.style.transition = REDUCED ? 'none' :
          'transform var(--duration-base) var(--ease-spring)';
        sheet.style.transform = 'translateY(0)';
        var overlay2 = sheet.previousElementSibling;
        if (overlay2 && overlay2.classList.contains('sheet-overlay')) {
          overlay2.style.transition = REDUCED ? 'none' :
            'opacity var(--duration-base) var(--ease-out)';
          overlay2.style.opacity = '';
        }
      }
    }

    handle.addEventListener('mousedown', onStart);
    handle.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
  }

  function initAll() {
    document.querySelectorAll('.sheet').forEach(init);
  }

  /* Animated close: play the slide-down/fade-out on the still-visible overlay,
     then run onHide() (the host's actual hide: set [hidden], display:none, or
     remove .is-open). If the overlay isn't currently shown, or under
     reduced-motion, hide immediately. */
  function close(overlay, onHide) {
    onHide = onHide || function () {};
    var sheet = overlay && overlay.querySelector('.sheet');
    var shown = sheet && getComputedStyle(overlay).display !== 'none';
    if (!shown || REDUCED) {
      if (overlay) overlay.classList.remove('is-closing');
      onHide();
      return;
    }
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      sheet.removeEventListener('animationend', finish);
      overlay.classList.remove('is-closing');
      // Clear any inline transform/opacity left by a drag gesture.
      sheet.style.transform = '';
      sheet.style.transition = '';
      overlay.style.opacity = '';
      onHide();
    }
    overlay.classList.add('is-closing');
    sheet.addEventListener('animationend', finish);
    setTimeout(finish, 400); // safety if animationend doesn't fire
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  window.addEventListener('pagereveal', initAll);

  // Observe for dynamically inserted sheets
  if (window.MutationObserver) {
    var mo = new MutationObserver(function () { initAll(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  window.SettlrSheetDrag = { init: init, initAll: initAll, close: close };
})();
