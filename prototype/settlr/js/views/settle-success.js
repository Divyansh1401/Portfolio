/* ============================================================
   Settlr — Settle Success view module
   Former inline IIFE from screens/settle-success.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views.

   This is the final step of the settle flow (settle-select → settle-amount →
   settle-method → settle-success). The flow hands off data between steps via
   sessionStorage('settlr_settle'); router params take precedence when present.

   On each onShow the summary card is repopulated and the success/confetti
   entrance animation is re-triggered (respecting prefers-reduced-motion, which
   the underlying @keyframes already guard). The settlement is recorded to Store
   exactly once per flow — a per-context guard (keyed on the settle payload)
   prevents double-recording when the view is re-shown via back/forward. Once
   the settlement is recorded, the settle sessionStorage is cleared, mirroring
   the original inline script.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  var METHOD_ICONS = { 'UPI': '💳', 'Cash': '💵', 'Bank Transfer': '🏦', 'Other': '📝' };

  // Resolve the settle context: router params first, then sessionStorage
  // (the cross-step handoff store), then URL query string for standalone use.
  function resolveState(params) {
    var state = {};
    try { state = JSON.parse(sessionStorage.getItem('settlr_settle') || '{}') || {}; }
    catch (e) { state = {}; }

    var keys = ['contactId', 'contactInitials', 'contactName', 'amount', 'direction', 'method'];
    if (params) {
      keys.forEach(function (k) {
        if (params[k] != null && params[k] !== '') state[k] = params[k];
      });
    } else {
      var qs = new URLSearchParams(location.search);
      keys.forEach(function (k) {
        var v = qs.get(k);
        if (v != null && v !== '') state[k] = v;
      });
    }
    return state;
  }

  // Stable signature for a settle payload, used to record at most once per flow.
  function signature(state) {
    return [state.contactId, state.amount, state.direction, state.method, state.groupId || ''].join('|');
  }

  // Record the settlement to Store exactly once per flow, then clear the
  // settle sessionStorage. Guarded so re-shows (back/forward) never re-record.
  function recordOnce(root, state) {
    if (!state.contactId || !state.amount) return;
    if (typeof Store === 'undefined' || !Store.recordSettlement) return;

    var sig = signature(state);
    if (root._recordedSig === sig) return; // already recorded this exact flow
    root._recordedSig = sig;

    var me = Store.getCurrentUser();
    var today = new Date().toISOString().slice(0, 10);
    // direction 'owe' = current user pays contact; 'lent' = contact pays user.
    Store.recordSettlement({
      fromId: state.direction === 'owe' ? me.id : state.contactId,
      toId:   state.direction === 'owe' ? state.contactId : me.id,
      amount: state.amount,
      method: state.method || 'Other',
      date:   today,
      groupId: state.groupId || null
    });

    // Flow complete — clear the cross-step handoff store like the original did.
    try { sessionStorage.removeItem('settlr_settle'); } catch (e) {}

    // Reset the per-context guard so a genuinely NEW flow with an identical
    // payload (same contact/amount/direction/method/group in one page session)
    // is still recorded. Safe: a back/forward re-show of THIS completed flow
    // now sees empty sessionStorage → resolveState yields no contactId/amount →
    // recordOnce returns early; only a new flow writes fresh sessionStorage.
    root._recordedSig = null;
  }

  // Replay the success + confetti entrance animations on each show by forcing a
  // reflow on the animated nodes. The underlying @keyframes are themselves
  // guarded by prefers-reduced-motion (css/success-state.css, css/confetti.css),
  // so this is a no-op visually under reduced motion.
  function replayAnimations(root) {
    var animated = root.querySelectorAll(
      '.confetti__dot, .success-state__icon, .success-state__icon-glyph, ' +
      '.success-state__heading, .summary-card--success'
    );
    animated.forEach(function (el) {
      var anim = el.style.animation;
      el.style.animation = 'none';
      // Force reflow so removing + re-adding the animation restarts it.
      void el.offsetWidth;
      el.style.animation = anim || '';
    });
  }

  function populate(root, state) {
    var avatarEl  = root.querySelector('#js-avatar-success');
    var summaryEl = root.querySelector('#js-summary-success');
    var amountEl  = root.querySelector('#js-amount-success');
    var methodEl  = root.querySelector('#js-method');
    var tsEl      = root.querySelector('#js-ts');
    var viewLink  = root.querySelector('#js-view-link');

    if (avatarEl && state.contactInitials) avatarEl.textContent = state.contactInitials;

    if (summaryEl && state.contactName) {
      var verb = state.direction === 'lent' ? 'received from' : 'paid';
      summaryEl.innerHTML = 'You ' + verb + ' <strong>' + esc(state.contactName) + '</strong>';
    }

    if (amountEl && state.amount) {
      amountEl.textContent = Store.formatINR(state.amount);
    }

    if (methodEl) {
      var method = state.method || 'Other';
      methodEl.textContent = (METHOD_ICONS[method] || '📝') + ' via ' + method;
    }

    if (tsEl) {
      tsEl.textContent = new Date()
        .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    if (viewLink && state.contactId) {
      viewLink.href = 'individual-detail?id=' + state.contactId;
    }
  }

  function init(root, params) {
    // Done / Home action — wired once. Prefer the SPA router when present so we
    // stay in the compiled shell; otherwise fall back to the original href.
    var doneBtn = root.querySelector('#js-done');
    if (doneBtn && !doneBtn._wired) {
      doneBtn._wired = true;
      doneBtn.addEventListener('click', function (e) {
        if (window.SettlrRouterSPA) {
          e.preventDefault();
          window.SettlrRouterSPA.navigate('home-dashboard');
        }
        // else: let the anchor's href="home-dashboard" navigate normally.
      });
    }
  }

  function onShow(root, params) {
    var state = resolveState(params);
    populate(root, state);
    recordOnce(root, state);
    replayAnimations(root);
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers / open
    // sheets). The done listener is attached idempotently and lives with the
    // in-DOM view; the record guard persists on the root across re-shows.
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('settle-success', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="settle-success"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
