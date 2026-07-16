/* ============================================================
   Settlr — Add Review view module
   Final confirm step of the add-expense flow. Former inline IIFE from
   screens/add-review.html, adapted to the compiled-shell lifecycle. All DOM
   lookups are scoped to `root` (the view <section>) so they never collide
   with other in-DOM views. The flow draft is read from
   sessionStorage('settlr_new_expense') on every onShow; if it is missing (or
   malformed) we redirect back to the first step (add-amount), mirroring how
   expense-detail redirects on a missing id.

   onShow fully REBUILDS the details + split rows (clearing any previously
   rendered nodes first) so navigating back/forward re-derives the latest
   draft. The "Add Expense" commit is GUARDED by a `committing` flag so a
   re-show or a double-tap can never double-add the expense.
   ============================================================ */
(function () {
  'use strict';

  function navigateAway() {
    if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('add-amount');
    else location.replace('add-amount');
  }

  function init(root, params) {
    // One-time wiring: footer scroll-border toggle. The data build runs in
    // onShow so navigating back re-derives the latest draft. The commit
    // listener is attached once here, guarded by a per-show `committing` flag
    // captured via the closure below in onShow.
    var footer = root.querySelector('.screen-footer');
    var scrollEl = root.querySelector('.view__content');
    if (footer && scrollEl && !scrollEl._footerWired) {
      scrollEl._footerWired = true;
      scrollEl.addEventListener('scroll', function () {
        footer.classList.toggle('is-scrolled', scrollEl.scrollTop > 0);
      }, { passive: true });
    }
  }

  function onShow(root, params) {
    // ── Context guard — redirect if flow draft is missing/malformed ──
    var raw = sessionStorage.getItem('settlr_new_expense');
    if (!raw) { navigateAway(); return; }
    var ctx;
    try { ctx = JSON.parse(raw); } catch (e) { navigateAway(); return; }
    if (!ctx || !ctx.totalAmount || !ctx.splitAmong || !ctx.splitAmong.length) { navigateAway(); return; }

    var me = Store.getCurrentUser();
    var meId = me.id;
    var total = ctx.totalAmount;
    var pp = ctx.perPerson || Math.round(total / ctx.splitAmong.length * 100) / 100;
    var paidById = ctx.paidById || meId;
    var iMePaying = paidById === meId;
    var splitMode = ctx.splitMethod || 'equal';
    var modeLabel = { equal: 'Equal split', amount: 'Custom amount', percent: 'By percentage', shares: 'By shares' }[splitMode] || 'Equal split';

    function amountFor(id) {
      // Review fix: use the store's paise-exact share (splitAmounts-aware) so the
      // confirm screen matches the ledger it creates — the flat perPerson diverged
      // by ₹0.01 on non-divisible equal splits (Track E made _shareOf paise-exact).
      return Store.shareOf(ctx, id);
    }
    // Multi-payer: what `id` paid, and their net (paid − share).
    function paidByFor(id) {
      if (ctx.payers) return parseFloat(ctx.payers[id]) || 0;
      return paidById === id ? total : 0;
    }
    function netFor(id) {
      return Math.round((paidByFor(id) - amountFor(id)) * 100) / 100;
    }
    var myAmount = amountFor(meId);

    // Route through Store.formatIn so amounts show in the expense's own currency.
    function fmt(n) { return Store.formatIn(n, ctx.currency); }

    function nameFor(id) {
      if (id === meId) return 'You';
      var c = Store.getContact(id);
      return c ? c.name.split(' ')[0] : id;
    }
    function fullNameFor(id) {
      if (id === meId) return 'You';
      var c = Store.getContact(id);
      return c ? c.name : id;
    }
    function initialsFor(id) {
      if (id === meId) return me.initials || 'DR';
      var c = Store.getContact(id);
      return c ? c.initials : id.slice(0, 2).toUpperCase();
    }

    // ── Hero ──
    root.querySelector('#js-category').textContent = (ctx.emoji || '') + ' ' + (ctx.category || 'Other');
    root.querySelector('#js-amount-review').textContent = fmt(total);
    root.querySelector('#js-desc').textContent = ctx.title || '';

    var d = new Date(ctx.date + 'T00:00:00');
    var dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    root.querySelector('#js-date').textContent = dateStr;
    function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

    // Balance pill — use CSS classes instead of inline styles
    var bal = root.querySelector('#js-balance');
    var balLabelEl = root.querySelector('#js-balance-label');
    var balAmountEl = root.querySelector('#js-balance-amount');
    var myNet = netFor(meId);
    if (myNet >= 0) {
      bal.className = 'expense-hero__balance balance-pill balance-pill--lent';
      balLabelEl.textContent = 'You get back';
      balAmountEl.textContent = fmt(myNet);
    } else {
      bal.className = 'expense-hero__balance balance-pill balance-pill--owe';
      balLabelEl.textContent = 'You owe';
      balAmountEl.textContent = fmt(-myNet);
    }

    // ── Details (rebuilt fresh each show) ──
    var detailsHtml = '';
    if (ctx.groupId) {
      var g = Store.getGroup(ctx.groupId);
      detailsHtml += '<div class="detail-row"><div class="detail-row__icon">👥</div><div class="detail-row__text"><span class="detail-row__label text-body-xs">Group</span><span class="detail-row__value text-title-sm">' + esc(g ? g.name : ctx.groupId) + '</span></div></div>';
    }
    var payerLabel = Store.getPayerSummary ? Store.getPayerSummary(ctx).label : nameFor(paidById);
    detailsHtml += '<div class="detail-row"><div class="detail-row__icon">💳</div><div class="detail-row__text"><span class="detail-row__label text-body-xs">Paid by</span><span class="detail-row__value text-title-sm">' + esc(payerLabel) + ' paid ' + fmt(total) + '</span></div></div>';
    detailsHtml += '<div class="detail-row"><div class="detail-row__icon">📅</div><div class="detail-row__text"><span class="detail-row__label text-body-xs">Date</span><span class="detail-row__value text-title-sm">' + dateStr + '</span></div></div>';
    detailsHtml += '<div class="detail-row"><div class="detail-row__icon"><span class="icon-holder" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM128,80a16,16,0,1,0-16-16A16,16,0,0,0,128,80Zm0,96a16,16,0,1,0,16,16A16,16,0,0,0,128,176Z"/></svg></span></div><div class="detail-row__text"><span class="detail-row__label text-body-xs">Split method</span><span class="detail-row__value text-title-sm">' + modeLabel + '</span></div></div>';
    root.querySelector('#js-details').innerHTML = detailsHtml;

    // ── Split breakdown (rebuilt fresh each show) ──
    var n = ctx.splitAmong.length;
    root.querySelector('#js-split-method').textContent = n + ' ' + (n === 1 ? 'person' : 'people') + ' · ' + modeLabel;
    root.querySelector('#js-split-list').innerHTML = ctx.splitAmong.map(function (id) {
      // Net = paid − share. >0 gets back, <0 owes, 0 settled.
      var net = netFor(id);
      var amtCls, amtText;
      if (net > 0.005) {
        amtCls = 'split-person__amount--lent';
        amtText = 'gets back ' + fmt(net);
      } else if (net < -0.005) {
        amtCls = 'split-person__amount--owe';
        amtText = 'owes ' + fmt(-net);
      } else {
        amtCls = 'split-person__amount--self';
        amtText = 'settled';
      }
      return '<div class="split-person">' +
        '<div class="split-person__avatar text-title-xs">' + esc(initialsFor(id)) + '</div>' +
        '<span class="split-person__name text-title-sm">' + esc(fullNameFor(id)) + '</span>' +
        '<span class="split-person__amount ' + amtCls + ' text-title-sm">' + amtText + '</span>' +
      '</div>';
    }).join('');

    // ── Add expense — committed once, guarded against re-show/double-tap ──
    var committing = false;
    var addBtn = root.querySelector('#js-add');
    addBtn.disabled = false;
    // Replace any prior listener by re-pointing a single named handler. The
    // closure captures the current draft; `committing` blocks re-entry.
    addBtn.onclick = function () {
      if (committing) return;
      committing = true;
      addBtn.disabled = true;
      var notes = root.querySelector('#js-notes').value.trim();
      var expense = {
        title: ctx.title,
        emoji: ctx.emoji || '📝',
        category: ctx.category || 'Other',
        totalAmount: total,
        paidById: paidById,
        payers: ctx.payers || null,
        splitAmong: ctx.splitAmong,
        splitMethod: splitMode,
        splitAmounts: ctx.splitAmounts || null,
        date: ctx.date,
        notes: notes,
        groupId: ctx.groupId || null,
        contactId: ctx.contactIds && ctx.contactIds.length === 1 ? ctx.contactIds[0] : null,
        currency: ctx.currency || null
      };
      Store.addExpense(expense);
      sessionStorage.removeItem('settlr_new_expense');
      // When the flow was started from a group/person detail page, return there
      // (set in add-amount as draft.origin) instead of dropping the user on home.
      var origin = ctx.origin || null;
      var dest = 'home-dashboard';
      var destParams = {};
      if (origin && origin.groupId) {
        dest = 'group-detail';
        destParams = { id: origin.groupId };
      } else if (origin && origin.contactId) {
        dest = 'individual-detail';
        destParams = { id: origin.contactId };
      }
      if (window.SettlrRouterSPA && window.SettlrRouterSPA.completeFlow) {
        // Collapse the whole add-expense wizard out of history, returning to the
        // launching view so Back from there goes to its natural parent (home),
        // not back through the flow.
        window.SettlrRouterSPA.completeFlow(dest, destParams);
      } else if (window.SettlrRouterSPA) {
        window.SettlrRouterSPA.navigate(dest, destParams);
      } else {
        location.href = dest + (destParams.id ? '?id=' + destParams.id : '');
      }
    };
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers). The
    // footer scroll listener is attached idempotently and lives with the view;
    // the commit handler is re-pointed (and re-guarded) on every onShow.
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('add-review', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="add-review"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
