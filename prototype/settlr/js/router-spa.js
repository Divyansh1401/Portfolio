/* ============================================================
   Settlr Router (SPA) — same-document view-transition router.

   Drop-in successor to js/router.js for the compiled single-document app.
   Reuses the SAME route catalog + direction logic (ROUTES / pickTx /
   TX_INVERSE / applyTx) so transitions feel identical, but instead of a
   cross-document navigation it:
     • intercepts internal link clicks,
     • toggles which `.view` is visible inside the view host,
     • animates the swap with document.startViewTransition() (so the existing
       css/transitions.css ::view-transition-old/new(root) flavors apply
       unchanged), and
     • keeps real history via pushState/popstate (#slug URLs).

   The forward-transition stack lives in memory (no document reload), so back
   navigation can replay each entry's inverse — matching router.js semantics.
   ============================================================ */
(function () {
  'use strict';
  if (window.SettlrRouterSPA) return;

  var TX_CLASSES = [
    'tx-lateral-left', 'tx-lateral-right',
    'tx-push', 'tx-pop',
    'tx-modal-up', 'tx-modal-down'
  ];

  var TX_INVERSE = {
    'tx-modal-up':      'tx-modal-down',
    'tx-modal-down':    'tx-modal-up',
    'tx-push':          'tx-pop',
    'tx-pop':           'tx-push',
    'tx-lateral-right': 'tx-lateral-left',
    'tx-lateral-left':  'tx-lateral-right'
  };

  // Route catalog — identical to js/router.js.
  var ROUTES = {
    'home-dashboard':         { tab: 0, type: 'tab' },
    'people':                 { tab: 1, type: 'tab' },
    'activity':               { tab: 2, type: 'tab' },

    'add-amount':             { type: 'modal' },
    'add-split':              { type: 'modal-step' },
    'add-review':             { type: 'modal-step' },
    'create-group-name':      { type: 'modal' },
    'create-group-members':   { type: 'modal-step' },
    'add-group':              { type: 'modal-step' },
    'settle-select':          { type: 'modal' },
    'settle-amount':          { type: 'modal-step' },
    'settle-method':          { type: 'modal-step' },
    'settle-success':         { type: 'modal-step' },
    'add-friend':             { type: 'modal' },

    'ss-add-amount-category': { type: 'modal' },
    'ss-add-amount-currency': { type: 'modal' },
    'ss-add-split-payer':     { type: 'modal' },
    'ss-edit-group-emoji':    { type: 'modal' },
    'search':                 { type: 'modal' },

    'onboarding-welcome':     { type: 'auth' },

    'splash':                 { type: 'auth' },
    'welcome':                { type: 'auth' },
    'login':                  { type: 'auth' },
    'otp':                    { type: 'auth' }
  };

  // ── href / slug parsing ─────────────────────────────────
  function parseHref(href) {
    // Returns { slug, params } from "group-detail?id=g1", "people", "#home", etc.
    if (!href) return { slug: null, params: {} };
    var clean = href.replace(/^#/, '').split('#')[0];
    var parts = clean.split('?');
    var path = parts[0];
    var m = path.match(/(?:.*\/)?([\w-]+?)(?:\.html)?$/);
    var slug = m ? m[1] : null;
    var params = {};
    if (parts[1]) {
      parts[1].split('&').forEach(function (kv) {
        var pair = kv.split('=');
        if (pair[0]) params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
      });
    }
    return { slug: slug, params: params };
  }

  function routeFor(slug) { return slug ? ROUTES[slug] : null; }

  // ── Direction logic — identical to js/router.js pickTx ──
  function pickTx(curSlug, nextSlug, explicit) {
    if (explicit) return 'tx-' + explicit;

    var cur  = routeFor(curSlug);
    var next = routeFor(nextSlug);

    if (next && next.type === 'auth') return null;

    if (next && next.type === 'tab' && cur && cur.type === 'tab') {
      return next.tab > cur.tab ? 'tx-lateral-right' : 'tx-lateral-left';
    }

    if (cur && (cur.type === 'modal' || cur.type === 'modal-step')) {
      if (next && next.type === 'modal-step') return 'tx-push';
      if (next && next.type === 'modal')      return 'tx-modal-up';
      return 'tx-modal-down';
    }

    if (next && next.type === 'modal') return 'tx-modal-up';
    if (next && next.type === 'modal-step') return 'tx-modal-up';

    return 'tx-push';
  }

  function applyTx(tx) {
    var html = document.documentElement;
    TX_CLASSES.forEach(function (c) { html.classList.remove(c); });
    if (tx) html.classList.add(tx);
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ── View toggling ───────────────────────────────────────
  var current = null;       // current slug
  var txStack = [];         // forward transitions, for back inversion
  var flowMarkLen = null;   // txStack length captured at a modal flow's first step
  var flowReturn = null;    // pending "collapse the flow on completion" descriptor

  function viewEl(slug) { return document.getElementById('view-' + slug); }

  var TAB_KEY = { 'home-dashboard': 'home', 'people': 'people', 'activity': 'activity' };

  // Persistent bottom-nav dock: shown only on tab views, with the active tab
  // (the <settlr-bottom-nav> re-renders its fill icon when `active` changes).
  // Uses inline display (not [hidden]) because .bottom-nav-bar sets display:flex.
  // Falls back to toggling in-view nav tabs when there is no shell dock.
  function updateDock(slug) {
    var dock = document.getElementById('shell-bottom-nav');
    if (dock) {
      var r = routeFor(slug);
      var isTab = !!(r && r.type === 'tab');
      dock.style.display = isTab ? '' : 'none';
      if (isTab && TAB_KEY[slug]) dock.setAttribute('active', TAB_KEY[slug]);
      return;
    }
    var tabs = document.querySelectorAll('.bottom-nav .bottom-nav__tab');
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.classList.toggle('is-active', parseHref(tab.getAttribute('href')).slug === slug);
    });
  }

  // Same-document has no `pagereveal`, so re-init the DOM-scanning enhancers
  // after each view swap (they each guard against double-init).
  function refreshEnhancers() {
    ['SettlrSegmentSlider', 'SettlrSheetDrag', 'SettlrPullRefresh', 'SettlrBottomNavSlider'].forEach(function (k) {
      try { if (window[k] && window[k].initAll) window[k].initAll(); } catch (e) {}
    });
  }

  function doSwap(from, to, params) {
    if (from && from !== to) {
      if (window.SettlrViews) window.SettlrViews.deactivate(from);
      var fromEl = viewEl(from);
      if (fromEl) fromEl.hidden = true;
    }
    var toEl = viewEl(to);
    if (toEl) toEl.hidden = false;
    updateDock(to);
    // Reset to the default title before the view activates. Views with a
    // contextual title (group-detail, individual-detail, edit-group) override
    // this in their onShow (which runs inside activate, just below); every other
    // view falls back to "Settlr" so a stale name never lingers in the tab.
    document.title = 'Settlr';
    if (window.SettlrViews) window.SettlrViews.activate(to, params);
    refreshEnhancers();
    current = to;
  }

  function run(fn) {
    if (document.startViewTransition && !reducedMotion()) {
      document.startViewTransition(fn);
    } else {
      fn();
    }
  }

  // ── Public navigate ─────────────────────────────────────
  function navigate(to, params, opts) {
    opts = opts || {};
    if (!viewEl(to)) {
      // Not an inlined view (e.g. auth screen) — fall back to real navigation.
      window.location.href = to;
      return;
    }
    if (to === current && !opts.force) return;

    var tx = pickTx(current, to, opts.explicit);
    txStack.push(tx);
    applyTx(tx);

    if (!opts.replace) {
      try { history.pushState({ slug: to, params: params || null }, '', '#' + to); } catch (e) {}
    }
    run(function () { doSwap(current, to, params || {}); });
  }

  // ── Programmatic back ───────────────────────────────────
  // In-app back-arrow buttons should replay the INVERSE of the transition that
  // brought the user here. Routing through real history (history.back) triggers
  // the popstate handler below, which pops the forward tx and applies its
  // inverse — so the back animation is complementary. When there's no in-app
  // history to pop (e.g. a deep-link entry), fall back to a forward navigate
  // with an explicit pop flavor so it still feels like a back step.
  function back(fallback) {
    if (txStack.length) {
      history.back();
    } else {
      navigate(fallback || 'home-dashboard', {}, { explicit: 'pop' });
    }
  }

  // ── Modal-flow completion ───────────────────────────────
  // A multi-step modal flow (add-expense: add-amount → [add-group] → add-split →
  // add-review) should leave NO trace in history once finished — otherwise Back
  // on the destination walks the user *back through the wizard*. beginFlow()
  // records the history depth at the flow's first screen; completeFlow() rewinds
  // exactly the entries the flow pushed, landing on the view that launched it
  // (its restored history state supplies the right slug + params), with a closing
  // modal-down transition. Falls back to a plain pop-navigate if the mark is gone
  // (e.g. a mid-flow reload wiped the in-memory counter).
  function beginFlow() { flowMarkLen = txStack.length; }

  function completeFlow(fallbackSlug, fallbackParams) {
    fallbackParams = fallbackParams || {};
    fallbackSlug = fallbackSlug || 'home-dashboard';
    var steps = (flowMarkLen == null) ? 0 : (txStack.length - flowMarkLen + 1);
    flowMarkLen = null;
    if (steps <= 0 || steps > txStack.length) {
      navigate(fallbackSlug, fallbackParams, { explicit: 'pop' });
      return;
    }
    flowReturn = { steps: steps, slug: fallbackSlug, params: fallbackParams };
    history.go(-steps);
  }

  // ── Back / forward ──────────────────────────────────────
  window.addEventListener('popstate', function (ev) {
    // Completing a modal flow: history was rewound past every wizard step. Trim
    // those transitions off the stack and reveal the launching view (from its
    // restored history state, falling back to the caller's hint) with a close
    // animation, instead of replaying each step's inverse.
    if (flowReturn) {
      var fr = flowReturn; flowReturn = null;
      txStack.length = Math.max(0, txStack.length - fr.steps);
      var dest = (ev.state && ev.state.slug) || fr.slug;
      var destParams = (ev.state && ev.state.params) || fr.params;
      if (!dest || !viewEl(dest)) { dest = fr.slug; destParams = fr.params; }
      applyTx('tx-modal-down');
      run(function () { doSwap(current, dest, destParams || {}); });
      return;
    }
    var to = (ev.state && ev.state.slug) || parseHref(location.hash).slug || current;
    if (!to || !viewEl(to)) return;
    var forward = txStack.pop();
    var tx = (forward == null) ? 'tx-pop' : (TX_INVERSE[forward] || 'tx-pop');
    applyTx(tx);
    var params = (ev.state && ev.state.params) || {};
    run(function () { doSwap(current, to, params); });
  });

  // ── Link interception ───────────────────────────────────
  function intercept(e) {
    if (e.defaultPrevented) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (/^https?:\/\//.test(href) && a.host !== window.location.host) return;

    // Back buttons (top-app-bar caret, hand-rolled back arrows, search back) all
    // carry aria-label="Back". Route them through the real back() so they pop
    // history and replay the inverse transition — instead of a forward navigate
    // (wrong direction, grows history) or a `javascript:history.back()` href
    // (silently blocked in iOS standalone PWAs → "back doesn't work on mobile").
    // The href slug is kept only as a cold-start / deep-link fallback.
    if (a.getAttribute('aria-label') === 'Back') {
      e.preventDefault();
      // Be the single owner of back behavior: stop the event before it can reach
      // any per-screen back onclick (group-detail / individual-detail / edit-group /
      // settle-select each still wire one) so back() can't fire twice and pop two
      // history entries.
      e.stopPropagation();
      var fbSlug = parseHref(href).slug;
      back(viewEl(fbSlug) ? fbSlug : 'home-dashboard');
      return;
    }

    var parsed = parseHref(href);
    if (!parsed.slug || !viewEl(parsed.slug)) return; // let non-view links behave normally

    e.preventDefault();
    navigate(parsed.slug, parsed.params, { explicit: a.dataset.tx });
  }

  // ── Boot ────────────────────────────────────────────────
  // Show the initial view (from #hash or the provided default) without animation.
  function start(defaultSlug) {
    var initial = parseHref(location.hash).slug;
    if (!initial || !viewEl(initial)) initial = defaultSlug;
    if (!viewEl(initial)) return;
    // Hide every view, then reveal the initial one.
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) { v.hidden = true; });
    current = null;
    doSwap(null, initial, parseHref(location.hash).params);
    try { history.replaceState({ slug: initial, params: null }, '', '#' + initial); } catch (e) {}
    document.addEventListener('click', intercept, true);
  }

  window.SettlrRouterSPA = {
    navigate: navigate,
    back: back,
    beginFlow: beginFlow,
    completeFlow: completeFlow,
    pickTx: pickTx,
    applyTx: applyTx,
    start: start,
    parseHref: parseHref,
    get current() { return current; }
  };
})();
