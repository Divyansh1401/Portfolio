/* ============================================================
   Settlr — List Entrance Stagger
   Animates the first N children of common list containers with a
   small fade + rise on initial render. Runs once per page load.

   Honors prefers-reduced-motion (skipped entirely).

   Containers tracked: any element with class
   `js-stagger-children`, plus a default set of common list IDs.
   ============================================================ */
(function () {
  'use strict';

  if (window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  var MAX_ITEMS = 8;     // only stagger the first N items
  var STAGGER  = 40;     // ms between each item start

  var KEYFRAME_CSS = '@keyframes settlr-list-in{' +
    'from{opacity:0;transform:translateY(6px)}' +
    'to{opacity:1;transform:translateY(0)}}';

  // Inject keyframes once
  if (!document.getElementById('settlr-list-stagger-style')) {
    var style = document.createElement('style');
    style.id = 'settlr-list-stagger-style';
    style.textContent = KEYFRAME_CSS;
    document.head.appendChild(style);
  }

  function stagger(container) {
    if (!container || container.dataset.staggerDone === '1') return;
    container.dataset.staggerDone = '1';
    var items = container.children;
    var count = Math.min(items.length, MAX_ITEMS);
    for (var i = 0; i < count; i++) {
      var el = items[i];
      el.style.animation = 'settlr-list-in 280ms cubic-bezier(0.16,1,0.3,1) ' +
                           (i * STAGGER) + 'ms both';
    }
  }

  function staggerAll() {
    // Explicit opt-in containers
    document.querySelectorAll('.js-stagger-children').forEach(stagger);
    // Common list containers
    [
      'js-list',
      'js-cards-row',
      'js-expense-list',
      'js-activity-list',
      'js-updates-list'
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) stagger(el);
    });
  }

  // Wait one frame so dynamically-rendered children are present.
  function schedule() {
    requestAnimationFrame(function () {
      requestAnimationFrame(staggerAll);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }

  // Re-stagger after view transitions reveal a new page.
  window.addEventListener('pagereveal', schedule);
})();
