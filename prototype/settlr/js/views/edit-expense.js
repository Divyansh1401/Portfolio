/* ============================================================
   Settlr — Edit Expense view module
   Former inline IIFE from screens/edit-expense.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views. The expense id
   comes from `params.id` (router) with a fallback to the URL query string for
   standalone use of screens/edit-expense.html.

   onShow re-derives the latest Store state on every activation and fully
   repopulates the editable form (amount, description, category chip, paid-by,
   split rows, notes). The split rows are rebuilt from the expense each show —
   any previously-built rows are removed first so navigating back never leaves
   stale rows behind.
   ============================================================ */
(function () {
  'use strict';

  var payerCtrl = null;     // SettlrPayerSheet controller (created each onShow)

  function resolveId(root, params) {
    if (params && params.id) return params.id;
    return new URLSearchParams(location.search).get('id');
  }

  function navigateAway() {
    if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('home-dashboard');
    else location.replace('home-dashboard');
  }

  function init(root, params) {
    // One-time wiring. Category selection uses inline onclick="selectCat(this)"
    // in the markup, so expose a stateless global helper (idempotent — re-show
    // does not need to re-wire it). Footer links are (re)pointed in onShow.
    if (!window.selectCat) {
      window.selectCat = function (el) {
        // Scope the deselect to the chips-row this chip belongs to so other
        // in-DOM views are never touched.
        var rowEl = el.closest ? el.closest('.chips-row') : null;
        var chips = rowEl ? rowEl.querySelectorAll('.chip') : [];
        Array.prototype.forEach.call(chips, function (c) { c.classList.remove('chip--on'); });
        el.classList.add('chip--on');
      };
    }
  }

  function onShow(root, params) {
    var id = resolveId(root, params);
    if (!id) { navigateAway(); return; }

    var allExpenses = Store.getActivityFeed();
    var exp = allExpenses.find(function (e) { return e.id === id; });
    if (!exp) { navigateAway(); return; }

    var user  = Store.getCurrentUser();
    var share = Math.round(exp.totalAmount / exp.splitAmong.length * 100) / 100;

    function nameOf(cid) {
      if (cid === user.id) return 'You';
      var c = Store.getContact(cid);
      return c ? c.name.split(' ')[0] : cid;
    }
    function initialsOf(cid) {
      if (cid === user.id) return user.initials;
      var c = Store.getContact(cid);
      return c ? c.initials : cid.slice(0, 2).toUpperCase();
    }

    // ── Amount ──────────────────────────────────────────────
    // Stored INR → shown/edited in the display currency.
    var amountInput = root.querySelector('.amount-input-wrap input');
    if (amountInput) amountInput.value = String(Store.fromBaseIn(exp.totalAmount, exp.currency));
    var amtSymbol = root.querySelector('.amount-input-wrap__symbol');
    if (amtSymbol) amtSymbol.textContent = Store.currencySymbolOf(exp.currency);
    var eeCode = exp.currency || Store.currencyCode();
    var eeChip = root.querySelector('.currency-chip');
    if (eeChip && eeChip.firstChild) eeChip.firstChild.textContent = Store.currencySymbolOf(exp.currency) + ' ' + eeCode + ' ';

    // ── Description ─────────────────────────────────────────
    var descInput = root.querySelector('.input-field__box input');
    if (descInput) descInput.value = exp.title;

    // ── Category chip ───────────────────────────────────────
    // Match the expense category against the chip labels; select the matching
    // chip (reset all first), falling back to leaving the markup default.
    var chipsRow = root.querySelector('.chips-row');
    if (chipsRow) {
      var chips = chipsRow.querySelectorAll('.chip');
      var cat = (exp.category || '').toLowerCase();
      var matched = false;
      Array.prototype.forEach.call(chips, function (c) {
        var label = (c.textContent || '').toLowerCase();
        var isMatch = cat && label.indexOf(cat) !== -1;
        c.classList.toggle('chip--on', isMatch);
        if (isMatch) matched = true;
      });
      // If nothing matched, keep the first chip selected (mirrors a sensible
      // default rather than an empty selection).
      if (!matched && chips.length) {
        Array.prototype.forEach.call(chips, function (c) { c.classList.remove('chip--on'); });
        chips[0].classList.add('chip--on');
      }
    }

    // ── Paid by (multi-payer; shared SettlrPayerSheet) ──────
    // Seed the payers map from the expense (falls back to single payer).
    var payers = {};
    if (exp.payers && Object.keys(exp.payers).length) {
      Object.keys(exp.payers).forEach(function (k) { payers[k] = parseFloat(exp.payers[k]) || 0; });
    } else {
      payers[exp.paidById] = exp.totalAmount;
    }
    function renderPaidByCard() {
      var ids = Object.keys(payers);
      var av = root.querySelector('#js-ee-paid-avatars');
      if (av) av.innerHTML = ids.map(function (cid) {
        return '<div class="avatar avatar--initials avatar--md">' + initialsOf(cid) + '</div>';
      }).join('');
      var nm = root.querySelector('#js-ee-paid-name');
      if (nm) {
        var label = Store.getPayerSummary ? Store.getPayerSummary({ payers: payers, paidById: ids[0] }).label : nameOf(ids[0]);
        nm.textContent = label + ' · ' + Store.formatIn(exp.totalAmount, exp.currency);
      }
    }
    payerCtrl = window.SettlrPayerSheet.create({
      root: root,
      sheetId: 'ee-payer-sheet', listId: 'js-ee-payer-list', hintId: 'js-ee-payer-hint',
      participantIds: exp.splitAmong,
      total: exp.totalAmount,
      getInfo: function (cid) { return { name: nameOf(cid), initials: initialsOf(cid) }; },
      payers: payers,
      currency: exp.currency,
      onChange: renderPaidByCard
    });
    renderPaidByCard();
    // Wire open (tap the card) + close (X / backdrop / Done). Idempotent.
    var card = root.querySelector('#js-ee-paid-card');
    if (card && !card._eeWired) {
      card._eeWired = true;
      card.addEventListener('click', function () { if (payerCtrl) payerCtrl.open(); });
    }
    var eeSheet = root.querySelector('#ee-payer-sheet');
    if (eeSheet && !eeSheet._eeWired) {
      eeSheet._eeWired = true;
      eeSheet.addEventListener('click', function (e) { if (e.target === eeSheet && payerCtrl) payerCtrl.close(e); });
      var cls = function () { if (payerCtrl) payerCtrl.close(); };
      var x = root.querySelector('#ee-payer-close'); if (x) x.addEventListener('click', cls);
      var done = root.querySelector('#ee-payer-done'); if (done) done.addEventListener('click', cls);
    }

    // ── Split summary ───────────────────────────────────────
    var summaryAmount = root.querySelector('.split-section__summary-amount');
    if (summaryAmount) summaryAmount.textContent = Store.formatIn(share, exp.currency);

    // ── Split rows ──────────────────────────────────────────
    // Rebuild the per-person rows from the expense each show. Remove any
    // existing rows first (reset before rebuild) but keep the total footer.
    var list = root.querySelector('.split-section__list');
    if (list) {
      list.querySelectorAll('.split-section__row').forEach(function (el) { el.remove(); });
      var total = list.querySelector('.split-section__total');
      var checkSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>';
      exp.splitAmong.forEach(function (cid) {
        var isPayer = cid === exp.paidById;
        var shareText = isPayer
          ? 'Paid ' + Store.formatIn(exp.totalAmount, exp.currency)
          : 'Owes ' + Store.formatIn(share, exp.currency);
        var row = document.createElement('div');
        row.className = 'split-section__row';
        row.innerHTML =
          '<span class="split-section__check"><span class="icon-holder" aria-hidden="true">' + checkSVG + '</span></span>' +
          '<div class="avatar avatar--initials avatar--md">' + initialsOf(cid) + '</div>' +
          '<div class="split-section__text">' +
            '<span class="split-section__name text-title-sm">' + nameOf(cid) + '</span>' +
            '<span class="split-section__share text-body-xs">' + shareText + '</span>' +
          '</div>' +
          '<span class="split-section__amount-pill text-amount-xs">' + Store.formatIn(share, exp.currency) + '</span>';
        if (total) list.insertBefore(row, total);
        else list.appendChild(row);
      });
      // Total value (keep the trailing check-circle glyph already in markup).
      var totalValue = root.querySelector('.split-section__total-value');
      if (totalValue) {
        var glyph = totalValue.querySelector('.icon-holder');
        totalValue.textContent = Store.formatIn(exp.totalAmount, exp.currency) + ' ';
        if (glyph) totalValue.appendChild(glyph);
      }
    }

    // ── Date ────────────────────────────────────────────────
    var dateValue = root.querySelector('.detail-row__value');
    if (dateValue) {
      var d = new Date(exp.date + 'T00:00:00');
      dateValue.textContent =
        d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // ── Notes ───────────────────────────────────────────────
    var notes = root.querySelector('.notes-card__textarea');
    if (notes) notes.value = exp.notes || '';

    // ── Footer / back navigation ────────────────────────────
    // The top-bar back arrow uses `javascript:history.back()` (set in markup) so
    // it POPS the history entry the user arrived from (expense-detail), matching
    // expense-detail's own back. Do NOT re-point it to a navigate() push — that
    // caused an infinite back loop (edit pushes detail → detail's history.back()
    // pops to edit → …). Discard + Save are explicit destinations, re-pointed
    // each show so standalone (real navigation) carries the id.
    var backTarget = 'expense-detail?id=' + id;

    function leave() {
      if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('expense-detail', { id: id });
      else location.href = backTarget;
    }
    // Persist the edited fields to the Store, then go to the detail.
    function saveAndLeave() {
      var amtEl = root.querySelector('.amount-input-wrap input');
      var descEl = root.querySelector('.input-field__box input');
      var chip = root.querySelector('.chips-row .chip--on');
      var fields = {
        title: descEl ? descEl.value.trim() : exp.title,
        totalAmount: amtEl ? (Store.toBaseIn(parseFloat(amtEl.value), exp.currency) || exp.totalAmount) : exp.totalAmount,
        notes: notes ? notes.value.trim() : exp.notes,
        payers: JSON.parse(JSON.stringify(payers)),
        paidById: Object.keys(payers)[0] || exp.paidById,
        currency: exp.currency || null
      };
      if (chip) {
        var parts = (chip.textContent || '').trim().split(/\s+/);
        if (parts.length > 1) { fields.emoji = parts[0]; fields.category = parts.slice(1).join(' '); }
      }
      Store.updateExpense(id, fields);
      leave();
    }
    // Save (primary) persists; Discard (ghost) just leaves. onclick is
    // re-pointed each show so it always uses the current expense's context.
    var saveBtn = root.querySelector('.screen-footer .btn--primary');
    var discardBtn = root.querySelector('.screen-footer .btn--ghost');
    if (saveBtn) { saveBtn.setAttribute('href', backTarget); saveBtn.onclick = function (ev) { ev.preventDefault(); saveAndLeave(); }; }
    if (discardBtn) { discardBtn.setAttribute('href', backTarget); discardBtn.onclick = function (ev) { ev.preventDefault(); leave(); }; }
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers). The
    // footer/category listeners are attached idempotently and live with the
    // in-DOM view.
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('edit-expense', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="edit-expense"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
