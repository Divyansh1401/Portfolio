/* ============================================================
   Settlr — Settle Amount view module
   Former inline IIFE from screens/settle-amount.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views.

   This is step 2 of the settle flow (settle-select → settle-amount →
   settle-method → settle-success). The flow hands off data between steps via
   sessionStorage('settlr_settle'); router params take precedence when present,
   then sessionStorage, then the URL query string for standalone use.

   The amount + person preview are reset and repopulated on every onShow so
   navigating back and re-entering reflects the latest contact/balance. Editing
   the amount and tapping Continue writes the settle context back to
   sessionStorage('settlr_settle') and advances to settle-method.
   ============================================================ */
(function () {
  'use strict';

  // Resolve the contactId: router params first, then sessionStorage (the
  // cross-step handoff store), then the URL query string for standalone use.
  function resolveContactId(params) {
    if (params && params.contactId != null && params.contactId !== '') {
      return params.contactId;
    }
    var qs = new URLSearchParams(location.search).get('contactId');
    if (qs != null && qs !== '') return qs;
    try {
      var state = JSON.parse(sessionStorage.getItem('settlr_settle') || '{}') || {};
      if (state.contactId != null && state.contactId !== '') return state.contactId;
    } catch (e) {}
    return null;
  }

  // Resolve an optional groupId (set when settling from within a group) the
  // same way: params → query string → sessionStorage. null = person-level.
  function resolveGroupId(params) {
    if (params && params.groupId != null && params.groupId !== '') return params.groupId;
    var qs = new URLSearchParams(location.search).get('groupId');
    if (qs != null && qs !== '') return qs;
    try {
      var state = JSON.parse(sessionStorage.getItem('settlr_settle') || '{}') || {};
      if (state.groupId != null && state.groupId !== '') return state.groupId;
    } catch (e) {}
    return null;
  }

  function init(root, params) {
    // One-time wiring. The amount comes from a native decimal <input>; the
    // full-amount button fills it, and Continue reads + validates it at click
    // time. Per-show state (contactId / balance) is recomputed in onShow and
    // stashed on the root.

    if (root._wired) return;
    root._wired = true;

    var input   = root.querySelector('#js-settle-amount');
    var errorEl = root.querySelector('#settle-amount-error');
    var warnEl  = root.querySelector('#settle-amount-warn');

    function hideError() { if (errorEl) errorEl.style.display = 'none'; }
    function showError() { if (errorEl) errorEl.style.display = 'block'; }

    // Non-blocking overpay hint: shown when the entered amount (converted to
    // base INR) exceeds the outstanding balance AND there is a balance to
    // settle. Continue still proceeds — this only warns.
    function updateWarn() {
      if (!warnEl) return;
      var amt = parseFloat(input ? input.value : '');
      var bal = root._bal || { amount: 0, direction: 'settled' };
      var over = amt > 0 && bal.direction !== 'settled' &&
                 Store.toBase(amt) > bal.amount;
      warnEl.style.display = over ? 'block' : 'none';
    }
    root._updateSettleWarn = updateWarn;

    // Grow the field to fit its content (mirrors add-amount) so large amounts
    // aren't clipped by the fixed 2ch base width.
    function resize() { if (input) input.style.width = Math.max(1, (input.value || '').length || 1) + 'ch'; }
    root._resizeSettleAmt = resize;

    // Clear the error + resize + refresh the overpay hint as the user types.
    if (input) input.addEventListener('input', function () { hideError(); resize(); updateWarn(); });

    // Pre-fill the full outstanding amount.
    var fullBtn = root.querySelector('.full-amount-btn');
    if (fullBtn && input) {
      fullBtn.addEventListener('click', function () {
        // Balance is INR; show it in the display currency for entry. Use the
        // exact converted amount (not rounded) so settling "full" clears a
        // fractional balance completely instead of leaving a ₹0.5 residual.
        input.value = String(Store.fromBase((root._bal && root._bal.amount) || 0));
        hideError();
        resize();
        updateWarn();
        input.focus();
      });
    }

    // Continue — reads contact + the entered amount at click time.
    var continueBtn = root.querySelector('#js-continue');
    if (continueBtn) {
      continueBtn.addEventListener('click', function () {
        var amt = parseFloat(input ? input.value : '');
        if (!amt || amt <= 0) {
          showError();
          if (input) input.focus();
          return;
        }
        var contact = root._contact;
        var bal = root._bal || { amount: 0, direction: 'settled' };
        var state = {};
        try { state = JSON.parse(sessionStorage.getItem('settlr_settle') || '{}') || {}; }
        catch (e) { state = {}; }
        state.contactId = root._contactId;
        state.contactName = contact ? contact.name : '';
        state.contactInitials = contact ? contact.initials : '';
        state.direction = bal.direction;
        state.amount = Store.toBase(amt); // typed in display currency → store INR
        state.groupId = root._groupId || null; // tag the settlement to its group when present
        try { sessionStorage.setItem('settlr_settle', JSON.stringify(state)); } catch (e) {}
        if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('settle-method');
        else location.href = 'settle-method';
      });
    }
  }

  function onShow(root, params) {
    var contactId = resolveContactId(params);
    var groupId = resolveGroupId(params);
    var contact = contactId ? Store.getContact(contactId) : null;

    // Balance shown + "Pay full amount": when settling within a group, use the
    // GROUP-scoped balance with this member (so the amount matches the group
    // balance it will reduce); otherwise the person-level contact balance.
    var bal = { amount: 0, direction: 'settled' };
    if (contactId && groupId) {
      var m = Store.getMemberBalancesForGroup(groupId).find(function (x) { return x.contactId === contactId; });
      bal = m ? { amount: m.amount, direction: m.direction } : Store.getContactBalance(contactId);
    } else if (contactId) {
      bal = Store.getContactBalance(contactId);
    }

    // Stash resolved context for the click handlers wired in init().
    root._contactId = contactId;
    root._contact = contact;
    root._bal = bal;
    root._groupId = groupId;

    // ── Populate person preview ──
    var avatarEl = root.querySelector('.person-preview__avatar');
    var nameEl = root.querySelector('.person-preview__name');
    var balEl = root.querySelector('.person-preview__balance');
    if (contact) {
      if (avatarEl) avatarEl.textContent = contact.initials;
      if (nameEl) nameEl.textContent = contact.name;
      var balText = bal.direction === 'owe'
        ? 'You owe ' + Store.formatINR(bal.amount)
        : bal.direction === 'lent'
          ? 'Owes you ' + Store.formatINR(bal.amount)
          : 'All settled';
      if (balEl) {
        balEl.textContent = balText;
        balEl.style.color =
          bal.direction === 'owe' ? 'var(--expense-owe-fg)' : 'var(--expense-lent-fg)';
      }
    }

    // ── Toggle the "Pay full amount" button ──
    // A settled contact has no outstanding balance, so the button would fill 0
    // and dead-end on Continue's validation. Hide it when settled; re-show it
    // for non-settled contacts (the view is reused across shows).
    var fullBtn = root.querySelector('.full-amount-btn');
    if (fullBtn) fullBtn.style.display = (bal.direction === 'settled') ? 'none' : '';

    // ── Reset the amount field each show ──
    var input = root.querySelector('#js-settle-amount');
    if (input) input.value = '';
    var prefixEl = root.querySelector('.amount-prefix');
    if (prefixEl) prefixEl.textContent = Store.currencySymbol(); // entry in display currency
    if (typeof root._resizeSettleAmt === 'function') root._resizeSettleAmt();
    var errorEl = root.querySelector('#settle-amount-error');
    if (errorEl) errorEl.style.display = 'none';
    // Reset the overpay hint (empty field => no warning) each show.
    if (typeof root._updateSettleWarn === 'function') root._updateSettleWarn();
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers / open
    // sheets). The numpad + button listeners are attached once in init() and
    // live with the in-DOM view.
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('settle-amount', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="settle-amount"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
