/* ============================================================
   Settlr — Bottom Nav Sliding Indicator
   Adds a pill that slides between tabs as the active tab changes.
   Auto-initializes for all .bottom-nav elements on the page.
   Honors prefers-reduced-motion (snaps instead of sliding).
   Mirrors js/segment-slider.js.
   ============================================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(nav) {
    if (nav.dataset.sliderInit === '1') return;
    nav.dataset.sliderInit = '1';

    var indicator = nav.querySelector('.bottom-nav__indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'bottom-nav__indicator';
      indicator.setAttribute('aria-hidden', 'true');
      nav.insertBefore(indicator, nav.firstChild);
    }

    function getActive() { return nav.querySelector('.bottom-nav__tab.is-active'); }

    function position(tab, animated) {
      if (!tab) { indicator.style.opacity = '0'; return; }
      var c = nav.getBoundingClientRect();
      var r = tab.getBoundingClientRect();
      indicator.style.opacity = '1';
      indicator.style.width = r.width + 'px';
      indicator.style.height = r.height + 'px';
      var x = r.left - c.left;
      var y = r.top - c.top;
      if (!animated || REDUCED) {
        var prev = indicator.style.transition;
        indicator.style.transition = 'none';
        indicator.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        indicator.offsetHeight; // force reflow
        indicator.style.transition = prev;
      } else {
        indicator.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      }
    }

    position(getActive(), false);

    // The class change is owned by router/screen/playground — we observe it.
    var observer = new MutationObserver(function () { position(getActive(), true); });
    nav.querySelectorAll('.bottom-nav__tab').forEach(function (tab) {
      observer.observe(tab, { attributes: true, attributeFilter: ['class'] });
    });

    window.addEventListener('resize', function () { position(getActive(), false); });
  }

  function initAll() { document.querySelectorAll('.bottom-nav').forEach(init); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  window.addEventListener('pagereveal', initAll);

  window.SettlrBottomNavSlider = { init: init, initAll: initAll };
})();
