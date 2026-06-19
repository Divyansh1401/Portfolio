/* ============================================================
   Settlr — Settlement Detail view module
   Shows a single recorded settlement (reached by tapping a settlement row in
   individual-detail / group-detail history). Resolves the settlement by id,
   renders who paid whom + amount + method + group + date, and offers an
   "Undo settlement" that deletes it (balances recompute from data.settlements).
   All DOM lookups are scoped to `root`.
   ============================================================ */
(function () {
  'use strict';

  function resolveId(root, params) {
    if (params && params.id) return params.id;
    return new URLSearchParams(location.search).get('id');
  }

  function navigateAway() {
    if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('home-dashboard');
    else location.replace('home-dashboard');
  }

  function fmtDate(d) {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-IN',
        { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return d || ''; }
  }

  var CHEVRON = '<span class="icon-holder detail-row__chevron" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/></svg></span>';

  // `href` (optional) makes the row a tappable link with a chevron.
  function detailRow(icon, label, value, href) {
    var inner = '<div class="detail-row__icon">' + icon + '</div>' +
      '<div class="detail-row__text">' +
        '<span class="detail-row__label text-body-xs">' + label + '</span>' +
        '<span class="detail-row__value text-title-sm">' + value + '</span>' +
      '</div>' + (href ? CHEVRON : '');
    return href
      ? '<a class="detail-row detail-row--clickable" href="' + href + '">' + inner + '</a>'
      : '<div class="detail-row">' + inner + '</div>';
  }

  function onShow(root, params) {
    var id = resolveId(root, params);
    if (!id) { navigateAway(); return; }
    var s = (typeof Store.getSettlement === 'function') ? Store.getSettlement(id) : null;
    if (!s) { navigateAway(); return; }

    var me = Store.getCurrentUser();
    var youPaid = s.fromId === me.id;
    var otherId = youPaid ? s.toId : s.fromId;
    var other = Store.getContact(otherId) || { name: otherId, initials: (otherId || '?').slice(0, 2).toUpperCase() };

    // ── Hero ──
    var amountEl = root.querySelector('#js-sd-amount');
    if (amountEl) amountEl.textContent = Store.formatINR(s.amount);
    var titleEl = root.querySelector('#js-sd-title');
    if (titleEl) titleEl.textContent = youPaid ? ('You paid ' + other.name) : (other.name + ' paid you');
    var timeStr = Store.formatTime(s.occurredAt);
    var dateEl = root.querySelector('#js-sd-date');
    if (dateEl) dateEl.textContent = timeStr ? fmtDate(s.date) + ' \u00b7 ' + timeStr : fmtDate(s.date);

    // ── Detail rows ──
    var rows = '';
    rows += detailRow('<span class="text-title-xs">' + other.initials + '</span>',
      youPaid ? 'Paid to' : 'Received from', other.name,
      'individual-detail?id=' + otherId);
    if (s.method) rows += detailRow('💳', 'Method', s.method);
    if (s.groupId) {
      var g = Store.getGroup(s.groupId);
      rows += detailRow('👥', 'Group', g ? g.name : s.groupId, 'group-detail?id=' + s.groupId);
    }
    rows += detailRow('📅', 'Date', timeStr ? fmtDate(s.date) + ' \u00b7 ' + timeStr : fmtDate(s.date));
    var detailsEl = root.querySelector('#js-sd-details');
    if (detailsEl) detailsEl.innerHTML = rows;

    // ── Undo settlement ──
    var undo = root.querySelector('#js-sd-undo');
    if (undo) {
      undo.onclick = function () {
        if (!window.confirm('Undo this settlement? The balance will be restored.')) return;
        if (typeof Store.deleteSettlement === 'function') Store.deleteSettlement(id);
        if (window.SettlrRouterSPA) window.history.back();
        else location.href = 'home-dashboard';
      };
    }
  }

  function onHide() {}

  if (window.SettlrViews) {
    window.SettlrViews.register('settlement-detail', { onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="settlement-detail"]');
      if (root) onShow(root, {});
    });
  }
})();
