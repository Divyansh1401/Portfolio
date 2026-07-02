/* ============================================================
   Settlr Router — view transition direction inferrer
   Sets a `tx-*` class on <html> before navigation so the View
   Transitions CSS knows which animation to play. Stores intent
   in sessionStorage so the incoming page picks up the same class
   before it paints.

   Must be loaded EARLY (in <head>, before stylesheets fully
   apply) so the class is present on the first paint of the
   destination page.
   ============================================================ */
(function () {
  'use strict';

  var TX_KEY       = 'settlr.tx';        // tx applied for the next paint
  var TX_STACK_KEY = 'settlr.txStack';   // history of forward transitions
  var TX_CLASSES = [
    'tx-lateral-left',
    'tx-lateral-right',
    'tx-push',
    'tx-pop',
    'tx-modal-up',
    'tx-modal-down'
  ];

  // Inverse table — back = forward played in reverse direction.
  var TX_INVERSE = {
    'tx-modal-up':      'tx-modal-down',
    'tx-modal-down':    'tx-modal-up',
    'tx-push':          'tx-pop',
    'tx-pop':           'tx-push',
    'tx-lateral-right': 'tx-lateral-left',
    'tx-lateral-left':  'tx-lateral-right'
  };

  function pushStack(tx) {
    // Accept null (used by auth flow / crossfade) so back navigation
    // can mirror the original direction (or lack thereof).
    try {
      var s = JSON.parse(sessionStorage.getItem(TX_STACK_KEY) || '[]');
      s.push(tx || null);
      sessionStorage.setItem(TX_STACK_KEY, JSON.stringify(s));
    } catch (e) {}
  }

  function popStack() {
    try {
      var s = JSON.parse(sessionStorage.getItem(TX_STACK_KEY) || '[]');
      var last = s.pop();
      sessionStorage.setItem(TX_STACK_KEY, JSON.stringify(s));
      return last || null;
    } catch (e) { return null; }
  }

  // ── Route catalog ────────────────────────────────────────
  // tab: 0/1/2 for bottom-nav tabs (lateral with each other)
  // type: 'tab' | 'modal' (slide-up entry) | 'auth' (replace/fade)
  var ROUTES = {
    'home-dashboard':         { tab: 0, type: 'tab' },
    'people':                 { tab: 1, type: 'tab' },
    'activity':               { tab: 2, type: 'tab' },

    // Modal entries (slide up)
    'add-amount':             { type: 'modal' },
    'add-split':              { type: 'modal-step' }, // step inside add-expense modal
    'add-review':             { type: 'modal-step' },
    'create-group-name':      { type: 'modal' },
    'create-group-members':   { type: 'modal-step' },
    'add-group':              { type: 'modal-step' },
    'settle-select':          { type: 'modal' },
    'settle-amount':          { type: 'modal-step' },
    'settle-method':          { type: 'modal-step' },
    'settle-success':         { type: 'modal-step' },
    'add-friend':             { type: 'modal' },
    'search':                 { type: 'modal' },

    // Auth (fade)
    'splash':                 { type: 'auth' },
    'welcome':                { type: 'auth' },
    'login':                  { type: 'auth' },
    'otp':                    { type: 'auth' }
  };

  function routeKey(path) {
    if (!path) return null;
    // Strip query/hash
    var p = path.split('?')[0].split('#')[0];
    // Match `/screens/foo` (with or without .html/path tail)
    var m = p.match(/\/screens\/([\w-]+)/);
    if (m) return m[1];
    // Bare slug (relative href like "people" or "add-amount")
    var bare = p.match(/^([\w-]+)(?:\.html)?$/);
    if (bare) return bare[1];
    return null;
  }
  function routeFor(path) {
    var key = routeKey(path);
    return key ? ROUTES[key] : null;
  }

  // ── Pick a transition for a navigation ──────────────────
  // Logic must produce a transition whose INVERSE matches the way
  // the user entered. The back navigation pops the stack and applies
  // the inverse, so picking the right forward direction is critical.
  function pickTx(currentPath, nextPath, explicit) {
    if (explicit) return 'tx-' + explicit;

    var cur  = routeFor(currentPath);
    var next = routeFor(nextPath);

    // Auth flow uses default crossfade (null marker stored on stack
    // so back navigation also crossfades).
    if (next && next.type === 'auth') return null;

    // Tab → tab: lateral slide. Direction by tab order.
    if (next && next.type === 'tab' && cur && cur.type === 'tab') {
      return next.tab > cur.tab ? 'tx-lateral-right' : 'tx-lateral-left';
    }

    // Inside a modal flow, decide based on the destination:
    //   • modal-step  → push (continue the flow)
    //   • modal        → modal-up (sub-picker over the current modal)
    //   • anything else (tab, detail, undefined) → modal-down (exit)
    if (cur && (cur.type === 'modal' || cur.type === 'modal-step')) {
      if (next && next.type === 'modal-step') return 'tx-push';
      if (next && next.type === 'modal')      return 'tx-modal-up';
      return 'tx-modal-down';
    }

    // From a regular page entering a modal: slide up.
    if (next && next.type === 'modal') return 'tx-modal-up';

    // Linking to a modal-step from outside the flow (rare; treat as
    // entering the modal — slide up).
    if (next && next.type === 'modal-step') return 'tx-modal-up';

    // Default forward: drill-down push (e.g. tab → detail).
    return 'tx-push';
  }

  // ── Apply tx class to <html> ────────────────────────────
  function applyTx(tx) {
    var html = document.documentElement;
    TX_CLASSES.forEach(function (c) { html.classList.remove(c); });
    if (tx) html.classList.add(tx);
  }

  // ── Read stored intent from previous page ───────────────
  // This runs on every page load — picks up direction so the
  // INCOMING page's view-transition rules match.
  try {
    var stored = sessionStorage.getItem(TX_KEY);
    if (stored) {
      applyTx(stored);
      sessionStorage.removeItem(TX_KEY);
    }
  } catch (e) {}

  // ── Intercept link clicks to set intent for next page ──
  function intercept(e) {
    if (e.defaultPrevented) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;

    var href = a.getAttribute('href');
    if (!href) return;
    if (href.charAt(0) === '#') return;
    if (a.target === '_blank') return;
    if (/^https?:\/\//.test(href) && a.host !== window.location.host) return;
    if (a.hasAttribute('download')) return;

    var explicit = a.dataset.tx; // optional override e.g. data-tx="modal-up"
    var tx = pickTx(window.location.pathname, href, explicit);

    // Record this forward transition so the eventual `back` action
    // can play its inverse (modal-up → modal-down, push → pop, etc).
    pushStack(tx);

    try { sessionStorage.setItem(TX_KEY, tx || ''); } catch (e) {}
    applyTx(tx);
  }
  document.addEventListener('click', intercept, true);

  // ── Browser back/forward → invert the last forward tx ──
  // We pop the transition stack (recorded on each forward nav)
  // and apply its inverse so the back animation mirrors the
  // way the user entered. Falls back to tx-pop if no record.
  if (window.navigation && window.navigation.addEventListener) {
    window.navigation.addEventListener('navigate', function (ev) {
      if (ev.navigationType === 'traverse') {
        var lastForward = popStack();
        var inverseTx;
        if (lastForward === null) {
          // Forward was a crossfade (auth) — back is also a crossfade.
          inverseTx = null;
        } else if (lastForward && TX_INVERSE[lastForward]) {
          inverseTx = TX_INVERSE[lastForward];
        } else {
          // No record (deep-linked entry, missing stack): default pop.
          inverseTx = 'tx-pop';
        }
        try { sessionStorage.setItem(TX_KEY, inverseTx || ''); } catch (e) {}
        applyTx(inverseTx);
      }
    });
  }

  // ── pageswap event (cross-doc VT): override animation class
  // on the OUTGOING page if we know the destination.
  // ────────────────────────────────────────────────────────
  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition) return;
    if (!e.activation) return;
    var to = e.activation.to && e.activation.to.url;
    if (!to) return;
    var tx = pickTx(window.location.pathname, new URL(to).pathname, null);
    applyTx(tx);
  });

  // ── pagereveal event (cross-doc VT): set incoming class
  // before the new page paints. Belt + suspenders with sessionStorage.
  // ────────────────────────────────────────────────────────
  window.addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    var stored = (function () {
      try { return sessionStorage.getItem(TX_KEY); } catch (e) { return null; }
    })();
    if (stored) {
      applyTx(stored);
      try { sessionStorage.removeItem(TX_KEY); } catch (e) {}
    }
  });

  // Expose for debugging / explicit programmatic navigation
  window.SettlrRouter = {
    pickTx: pickTx,
    applyTx: applyTx
  };
})();
