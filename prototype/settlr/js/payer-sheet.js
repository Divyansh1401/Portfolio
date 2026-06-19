/* ============================================================
   Settlr — Payer Sheet (shared)
   A reusable multi-payer bottom-sheet controller. Renders the "who paid"
   list (checkbox + avatar + name + per-payer amount input) plus a running
   sum hint, validates that the payers' amounts sum to the total, and
   open/closes the sheet (delegating to SettlrSheetDrag for the animation).

   It owns ONLY the sheet — each host screen renders its own "Paid by" bar in
   its `onChange` callback (add-split and edit-expense have different bar
   markup). The controller mutates the `payers` object you pass in.

   Usage:
     var ctrl = SettlrPayerSheet.create({
       root,                 // the view root element (sheet markup lives inside)
       participantIds,       // [id, …] rows to show
       total,                // bill total (for the sum hint + validity)
       getInfo,              // id → { name, initials }
       payers,               // { id: amount } — mutated in place
       onChange,             // () => void, called after every toggle/amount edit
       sheetId, listId, hintId   // optional id overrides (defaults below)
     });
     ctrl.open(); ctrl.close(); ctrl.render(); ctrl.isValid(); ctrl.total();
   ============================================================ */
(function () {
  'use strict';
  if (window.SettlrPayerSheet) return;

  var SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>';
  var SVG_CURRENCY_INR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M208,80a8,8,0,0,1-8,8H167.85c.09,1.32.15,2.65.15,4a60.07,60.07,0,0,1-60,60H92.69l72.69,66.08a8,8,0,1,1-10.76,11.84l-88-80A8,8,0,0,1,72,136h36a44.05,44.05,0,0,0,44-44c0-1.35-.07-2.68-.19-4H72a8,8,0,0,1,0-16h75.17A44,44,0,0,0,108,48H72a8,8,0,0,1,0-16H200a8,8,0,0,1,0,16H148.74a60.13,60.13,0,0,1,15.82,24H200A8,8,0,0,1,208,80Z"/></svg>';

  function iconHolder(svg, extraClass) {
    return '<span class="' + (extraClass ? 'icon-holder ' + extraClass : 'icon-holder') + '" aria-hidden="true">' + svg + '</span>';
  }
  function r2(n) { return Math.round(n * 100) / 100; }
  // Route through Store.formatINR so the payer-sum hint honors the currency pref.
  function fmt(n) {
    return (window.Store && Store.formatINR) ? Store.formatINR(n)
      : '\u20B9' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(r2(n));
  }

  function create(opts) {
    var root = opts.root;
    var sheetId = opts.sheetId || 'payer-sheet';
    var listId = opts.listId || 'js-payer-list';
    var hintId = opts.hintId || 'js-payer-hint';
    var payers = opts.payers;
    var getInfo = opts.getInfo;
    var onChange = opts.onChange || function () {};

    function ids() { return Object.keys(payers); }
    function total() {
      return r2(ids().reduce(function (s, id) { return s + (parseFloat(payers[id]) || 0); }, 0));
    }
    function isValid() { return Math.abs(total() - opts.total) < 0.01; }

    function togglePayer(id) {
      if (payers[id] !== undefined) {
        if (ids().length > 1) delete payers[id]; // always keep ≥1 payer
      } else {
        var remaining = r2(opts.total - total());
        payers[id] = remaining > 0 ? remaining : 0;
      }
      // A single selected payer must have paid the whole bill — auto-fill the
      // full total so the user doesn't have to type it (and the sum validates).
      var sel = ids();
      if (sel.length === 1) payers[sel[0]] = r2(opts.total);
    }

    function updateHint() {
      var hint = root.querySelector('#' + hintId);
      if (!hint) return;
      var ok = isValid();
      hint.textContent = ok
        ? fmt(total()) + ' of ' + fmt(opts.total) + ' \u2713'
        : fmt(total()) + ' of ' + fmt(opts.total) + ' \u2014 must add up';
      hint.classList.toggle('payer-hint--err', !ok);
    }

    function render() {
      var listEl = root.querySelector('#' + listId);
      if (!listEl) return;
      listEl.innerHTML = opts.participantIds.map(function (id) {
        var p = getInfo(id);
        var sel = payers[id] !== undefined;
        var val = sel ? (parseFloat(payers[id]) || 0) : 0;
        var amtCls = 'amount-input amount-input--currency payer-row__amount' + (sel ? '' : ' amount-input--inactive');
        var inp = '<input class="amount-input__field" type="number" min="0" step="0.01" data-pid="' + id + '" value="' + val + '"' + (sel ? '' : ' readonly tabindex="-1"') + '>';
        return '<div class="payer-row" data-pid="' + id + '">' +
          '<div class="checkbox-control js-payer-check' + (sel ? ' is-selected' : '') + '" data-pid="' + id + '">' + iconHolder(SVG_CHECK, 'checkbox-control__check') + '</div>' +
          '<div class="avatar avatar--initials avatar--md">' + p.initials + '</div>' +
          '<div class="payer-row__text"><span class="payer-row__name text-title-sm">' + p.name + '</span></div>' +
          '<div class="' + amtCls + '"><span class="amount-input__icon">' + iconHolder(SVG_CURRENCY_INR) + '</span>' + inp + '</div>' +
        '</div>';
      }).join('');
      updateHint();

      listEl.querySelectorAll('.js-payer-check').forEach(function (cb) {
        cb.addEventListener('click', function (ev) {
          ev.stopPropagation();
          togglePayer(cb.getAttribute('data-pid'));
          render();        // rebuild rows (checkbox + amount enabled state)
          onChange();      // host re-renders its bar + dependent UI
        });
      });
      listEl.querySelectorAll('.amount-input__field').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var pid = inp.getAttribute('data-pid');
          if (payers[pid] === undefined) return;
          payers[pid] = parseFloat(inp.value) || 0;
          updateHint();
          onChange();
        });
        inp.addEventListener('focus', function () { if (this.value === '0') this.select(); });
      });
    }

    function open() {
      var sheet = root.querySelector('#' + sheetId);
      if (!sheet) return;
      render();
      sheet.style.display = 'flex';
    }
    function close(e) {
      var sheet = root.querySelector('#' + sheetId);
      if (!sheet) return;
      if (e && e.target !== sheet) return; // overlay-only click
      if (window.SettlrSheetDrag && window.SettlrSheetDrag.close) {
        window.SettlrSheetDrag.close(sheet, function () { sheet.style.display = 'none'; });
      } else {
        sheet.style.display = 'none';
      }
    }

    return { open: open, close: close, render: render, isValid: isValid, total: total };
  }

  window.SettlrPayerSheet = { create: create };
})();
