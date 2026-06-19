/* ============================================================
   Settlr — View Registry
   Lifecycle manager for the compiled single-document app. Each former
   screen registers a definition keyed by its route slug; the router
   calls activate()/deactivate() as views are shown and hidden.

   Lifecycle:
     init(root, params)   — runs ONCE, lazily, the first time a view is shown.
                            One-time heavy DOM build (the old inline IIFE),
                            scoped to `root` (the view's <section>).
     onShow(root, params) — runs on EVERY activation, including the first
                            (after init). Re-derive data here so the view
                            reflects the latest Store state. MUST reset any
                            container it appends to before rebuilding.
     onHide(root)         — runs when navigating away. Tear down listeners,
                            timers, visualViewport handlers, and open sheets.

   All callbacks receive the view root element so screen code resolves its
   own `#js-*` nodes via root.querySelector — never document.getElementById,
   which would collide across the many in-DOM views.
   ============================================================ */
(function () {
  'use strict';
  if (window.SettlrViews) return;

  var defs = {};      // slug -> { init, onShow, onHide }
  var inited = {};    // slug -> true once init has run

  function rootFor(slug) {
    return document.getElementById('view-' + slug);
  }

  function register(slug, def) {
    defs[slug] = def || {};
  }

  function activate(slug, params) {
    var def = defs[slug];
    var root = rootFor(slug);
    if (!def || !root) return; // unregistered or not inlined yet
    if (!inited[slug]) {
      inited[slug] = true;
      if (typeof def.init === 'function') {
        try { def.init(root, params || {}); } catch (e) { console.error('[SettlrViews] init ' + slug, e); }
      }
    }
    if (typeof def.onShow === 'function') {
      try { def.onShow(root, params || {}); } catch (e) { console.error('[SettlrViews] onShow ' + slug, e); }
    }
  }

  function deactivate(slug) {
    var def = defs[slug];
    var root = rootFor(slug);
    if (!def || !root) return;
    if (typeof def.onHide === 'function') {
      try { def.onHide(root); } catch (e) { console.error('[SettlrViews] onHide ' + slug, e); }
    }
  }

  function isRegistered(slug) { return !!defs[slug]; }

  window.SettlrViews = {
    register: register,
    activate: activate,
    deactivate: deactivate,
    isRegistered: isRegistered
  };
})();
