/* ============================================================
   Settlr — Segment Control Sliding Indicator
   Adds an animated pill that slides between active segments.
   Auto-initializes for all .segment-control elements on the page.

   Honors prefers-reduced-motion (no animation, just snap).
   ============================================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(control) {
    if (control.dataset.sliderInit === '1') return;
    control.dataset.sliderInit = '1';

    // Find/create the pill element
    var pill = control.querySelector('.segment-control__pill');
    if (!pill) {
      pill = document.createElement('div');
      pill.className = 'segment-control__pill';
      pill.setAttribute('aria-hidden', 'true');
      control.insertBefore(pill, control.firstChild);
    }

    function getActive() {
      return control.querySelector('.segment-item.is-active') ||
             control.querySelector('.segment-item--active');
    }

    function position(item, animated) {
      if (!item) {
        pill.style.opacity = '0';
        return;
      }
      var c = control.getBoundingClientRect();
      var r = item.getBoundingClientRect();
      pill.style.opacity = '1';
      pill.style.width = r.width + 'px';
      pill.style.height = r.height + 'px';
      // translate from container's content box (account for container padding)
      var x = r.left - c.left;
      var y = r.top - c.top;
      if (!animated || REDUCED) {
        var prev = pill.style.transition;
        pill.style.transition = 'none';
        pill.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        // force reflow then restore
        // eslint-disable-next-line no-unused-expressions
        pill.offsetHeight;
        pill.style.transition = prev;
      } else {
        pill.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      }
    }

    // Initial position (snap, no animation)
    position(getActive(), false);

    // Listen for clicks within the segment-control. The actual
    // class change is left to the screen's own JS — we just observe
    // the result via MutationObserver.
    var observer = new MutationObserver(function () {
      position(getActive(), true);
    });
    control.querySelectorAll('.segment-item').forEach(function (item) {
      observer.observe(item, { attributes: true, attributeFilter: ['class'] });
    });

    // Re-position on viewport resize
    window.addEventListener('resize', function () {
      position(getActive(), false);
    });
  }

  function initAll() {
    document.querySelectorAll('.segment-control').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Re-init on view transition reveal (for SPA-style nav if added later)
  window.addEventListener('pagereveal', initAll);

  // Expose for screens that dynamically inject segment controls
  window.SettlrSegmentSlider = { init: init, initAll: initAll };
})();
