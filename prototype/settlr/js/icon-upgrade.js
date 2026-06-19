/* ============================================================
   Settlr — Icon upgrade
   Converts every Phosphor font icon <i class="ph ph-NAME"> into the
   standard icon box: <span class="icon-holder ...">{inline SVG}</span>.

   - Looks the icon up in window.SETTLR_ICONS (js/icons.js, regular weight).
   - Preserves any non-ph classes on the <i> (e.g. .icon-btn__icon,
     .btn__icon, .detail-row__chevron) so existing sizing rules still apply.
   - If an icon isn't in the map, the original font <i> is left untouched
     (graceful fallback).
   - Idempotent + observes the DOM so dynamically-rendered icons upgrade too.

   Requires js/icons.js to be loaded first.
   ============================================================ */
(function () {
  'use strict';
  var WEIGHTS = { 'ph': 1, 'ph-bold': 1, 'ph-fill': 1, 'ph-thin': 1, 'ph-light': 1, 'ph-duotone': 1 };

  function iconName(el) {
    var name = null;
    el.classList.forEach(function (c) {
      if (c.indexOf('ph-') === 0 && !WEIGHTS[c]) name = c.slice(3);
    });
    return name;
  }

  /* Weight-aware map: ph-fill → fill SVGs, else regular. Falls back to
     regular when a weighted variant isn't in its map yet. */
  function mapFor(el) {
    if (el.classList.contains('ph-fill') && window.SETTLR_ICONS_FILL) return window.SETTLR_ICONS_FILL;
    return window.SETTLR_ICONS;
  }

  function upgrade(root) {
    if (!window.SETTLR_ICONS) return;
    var scope = root || document;
    var nodes = scope.querySelectorAll('i.ph, i.ph-bold, i.ph-fill, i.ph-thin, i.ph-light, i.ph-duotone');
    Array.prototype.forEach.call(nodes, function (el) {
      var name = iconName(el);
      if (!name) return;
      var svg = mapFor(el)[name] || window.SETTLR_ICONS[name];
      if (!svg) return; // keep font fallback for icons not in the map
      var keep = [];
      el.classList.forEach(function (c) { if (c.indexOf('ph') !== 0) keep.push(c); });
      var holder = document.createElement('span');
      holder.className = ('icon-holder ' + keep.join(' ')).trim();
      holder.setAttribute('aria-hidden', 'true');
      holder.innerHTML = svg;
      el.replaceWith(holder);
    });
  }

  window.upgradeIcons = upgrade;

  function boot() {
    upgrade();
    // Catch icons injected later (web components, render.js lists, sheets…)
    if (window.MutationObserver) {
      var pending = false;
      var mo = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () { pending = false; upgrade(); });
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
