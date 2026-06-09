/* ============================================================
   Settlr — Pull to Refresh
   Adds pull-to-refresh on scrollable list containers.
   - Pull threshold: 80px
   - Live indicator: simple rotating spinner
   - Release: dispatch `settlr:refresh` event; host handles data
     reload. We auto-reset after 600ms or when host calls
     `evt.detail.done()`.

   Opt in via `data-pull-refresh` on the scroll container.

   Honors prefers-reduced-motion (instant indicator, no rotation).
   ============================================================ */
(function () {
  'use strict';

  var THRESHOLD = 80;
  var REDUCED = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Inject indicator + keyframe once
  if (!document.getElementById('settlr-pull-refresh-style')) {
    var style = document.createElement('style');
    style.id = 'settlr-pull-refresh-style';
    style.textContent =
      '.settlr-ptr-indicator{' +
        'position:absolute;left:50%;top:0;' +
        'width:32px;height:32px;margin-left:-16px;' +
        'border-radius:50%;display:flex;align-items:center;justify-content:center;' +
        'background:var(--surface-card);box-shadow:var(--shadow-sm);' +
        'transform:translateY(-100%);opacity:0;pointer-events:none;z-index:50;' +
        'transition:transform 200ms cubic-bezier(0.16,1,0.3,1),opacity 200ms ease-out;' +
      '}' +
      '.settlr-ptr-indicator.is-active{transform:translateY(20px);opacity:1;}' +
      '.settlr-ptr-indicator.is-loading i{' +
        'animation:settlr-ptr-spin 800ms linear infinite;' +
      '}' +
      '@keyframes settlr-ptr-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}' +
      '@media (prefers-reduced-motion: reduce){' +
        '.settlr-ptr-indicator{transition:none}' +
        '.settlr-ptr-indicator.is-loading i{animation:none}' +
      '}';
    document.head.appendChild(style);
  }

  function init(container) {
    if (container.dataset.ptrInit === '1') return;
    container.dataset.ptrInit = '1';

    // Container must be a positioning ancestor for absolute indicator
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    var indicator = document.createElement('div');
    indicator.className = 'settlr-ptr-indicator';
    indicator.innerHTML = '<i class="ph-bold ph-arrow-clockwise"></i>';
    container.appendChild(indicator);

    var startY = 0, dragging = false, dy = 0, loading = false;

    function atTop() {
      return container.scrollTop <= 0;
    }

    function onStart(ev) {
      if (loading || !atTop()) return;
      dragging = true;
      dy = 0;
      var p = ev.touches ? ev.touches[0] : ev;
      startY = p.clientY;
    }

    function onMove(ev) {
      if (!dragging) return;
      var p = ev.touches ? ev.touches[0] : ev;
      dy = p.clientY - startY;
      if (dy <= 0) return;
      // Resistance curve
      var pulled = Math.pow(dy, 0.85);
      indicator.style.transform = 'translateY(' + Math.min(pulled, THRESHOLD + 30) + 'px)';
      indicator.style.opacity = String(Math.min(1, pulled / 60));
      if (ev.cancelable && pulled > 6) ev.preventDefault();
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      if (dy >= THRESHOLD && !loading) {
        loading = true;
        indicator.classList.add('is-active', 'is-loading');
        indicator.style.transform = '';
        indicator.style.opacity = '';

        // Notify host
        var done = false;
        var finish = function () {
          if (done) return; done = true;
          loading = false;
          indicator.classList.remove('is-active', 'is-loading');
        };
        var ev2 = new CustomEvent('settlr:refresh', {
          bubbles: true,
          detail: { done: finish }
        });
        container.dispatchEvent(ev2);
        // Auto-finish after 600ms if host didn't call done()
        setTimeout(finish, 600);
      } else {
        indicator.style.transform = '';
        indicator.style.opacity = '';
      }
    }

    container.addEventListener('touchstart', onStart, { passive: true });
    container.addEventListener('touchmove',  onMove,  { passive: false });
    container.addEventListener('touchend',   onEnd);
    container.addEventListener('touchcancel', onEnd);
    // Mouse fallback for desktop testing
    container.addEventListener('mousedown', onStart);
    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseup',   onEnd);
  }

  function initAll() {
    document.querySelectorAll('[data-pull-refresh]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  window.addEventListener('pagereveal', initAll);

  window.SettlrPullRefresh = { init: init, initAll: initAll };
})();
