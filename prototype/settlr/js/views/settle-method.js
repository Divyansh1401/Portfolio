/* ============================================================
   Settlr — Settle Method view module
   Former inline IIFE from screens/settle-method.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views.

   This is step 3 of the settle flow (settle-select → settle-amount →
   settle-method → settle-success). The flow hands off data between steps via
   sessionStorage('settlr_settle'); router params take precedence when present.

   Selection state and the summary card are reset on every onShow so navigating
   back and re-entering reflects the latest handoff state.
   ============================================================ */
(function () {
  'use strict';

  // Resolve the settle context: router params first, then sessionStorage
  // (the cross-step handoff store), then URL query string for standalone use.
  function resolveState(params) {
    var state = {};
    try { state = JSON.parse(sessionStorage.getItem('settlr_settle') || '{}') || {}; }
    catch (e) { state = {}; }

    if (params) {
      ['contactInitials', 'contactName', 'amount', 'direction', 'method'].forEach(function (k) {
        if (params[k] != null && params[k] !== '') state[k] = params[k];
      });
    } else {
      var qs = new URLSearchParams(location.search);
      ['contactInitials', 'contactName', 'amount', 'direction', 'method'].forEach(function (k) {
        var v = qs.get(k);
        if (v != null && v !== '') state[k] = v;
      });
    }
    return state;
  }

  function selectMethod(root, el) {
    root.querySelectorAll('.detail-row--selectable').forEach(function (m) {
      m.classList.remove('is-selected');
    });
    el.classList.add('is-selected');
  }

  function init(root, params) {
    // Method selection: delegate clicks so the in-DOM rows stay interactive
    // across re-shows without per-row re-binding. Attached once.
    if (!root._methodWired) {
      root._methodWired = true;
      root.addEventListener('click', function (e) {
        var row = e.target.closest && e.target.closest('.detail-row--selectable');
        if (row && root.contains(row)) selectMethod(root, row);
      });
    }

    // Confirm — wired once; reads the current selection + state at click time.
    var confirmBtn = root.querySelector('#js-confirm');
    if (confirmBtn && !confirmBtn._wired) {
      confirmBtn._wired = true;
      confirmBtn.addEventListener('click', function () {
        var state = resolveState(params);
        var selected = root.querySelector('.detail-row--selectable.is-selected .detail-row__value');
        state.method = selected ? selected.textContent : 'Other';
        try { sessionStorage.setItem('settlr_settle', JSON.stringify(state)); } catch (e) {}
        if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('settle-success');
        else location.href = 'settle-success';
      });
    }
  }

  function onShow(root, params) {
    var state = resolveState(params);

    // Guard against the stale-back dead-end: after a successful settlement,
    // settle-success clears sessionStorage('settlr_settle'); pressing Back lands
    // here with no amount/contact → a blank summary. Redirect to a safe place.
    if (!state.amount || !state.contactId) {
      if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('home-dashboard');
      else location.href = 'home-dashboard';
      return;
    }

    // ── Reset summary card to defaults before rebuild ──
    var avatarEl = root.querySelector('#js-avatar-method');
    var nameEl   = root.querySelector('#js-name');
    var amountEl = root.querySelector('#js-amount-method');

    if (avatarEl && state.contactInitials) avatarEl.textContent = state.contactInitials;
    if (nameEl && state.contactName) nameEl.textContent = state.contactName;

    if (amountEl) {
      amountEl.classList.remove('summary-card__amount--owe', 'summary-card__amount--lent');
      if (state.amount) {
        amountEl.textContent = Store.formatINR(state.amount);
      }
      amountEl.classList.add(state.direction === 'lent'
        ? 'summary-card__amount--lent'
        : 'summary-card__amount--owe');
    }

    // ── Reset method selection before applying the active one ──
    var rows = root.querySelectorAll('.detail-row--selectable');
    rows.forEach(function (m) { m.classList.remove('is-selected'); });

    var active = null;
    if (state.method) {
      rows.forEach(function (m) {
        if (m.getAttribute('data-method') === state.method) active = m;
      });
    }
    // Default to the first method (UPI) when no prior selection is handed off.
    if (!active && rows.length) active = rows[0];
    if (active) active.classList.add('is-selected');
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers / open
    // sheets). The delegated click + confirm listeners are attached idempotently
    // and live with the in-DOM view.
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('settle-method', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="settle-method"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
