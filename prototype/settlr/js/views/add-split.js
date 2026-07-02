/* ============================================================
   Settlr — Add Split view module
   Former inline IIFE from screens/add-split.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views.

   This is step 3 of the add-expense flow. The draft is read from
   sessionStorage('settlr_new_expense'); if it is missing (no amount /
   participants) the view redirects back to add-amount.

   onShow re-reads the draft and FULLY rebuilds the split editor every
   activation (paid-by bar, segment mode, participant rows, payer sheet list)
   so re-shows never leave stale rows behind. A per-show state object holds
   the live split selections; it is reset on each onShow.

   PAYER SHEET — GLOBAL: the payer bottom-sheet open/close functions are kept
   on `window` (window.openPayerSheet / window.closePayerSheet) because the
   ss-add-split-payer iframe opens this screen standalone and calls
   `iframe.contentWindow.openPayerSheet()` on load. They resolve the active
   view root so they work in both the standalone document and the SPA shell.
   The sheet is a local overlay, not a route.

   Inline JS-emitted Phosphor icons are inlined as SVG constants below (zero
   font icons remain). The footer scroll listener is torn down in onHide.
   ============================================================ */
(function () {
  'use strict';

  // ── Inlined Phosphor SVGs (regular weight, currentColor) ──
  // Sourced verbatim from js/icons.js so the JS-rendered amount inputs +
  // checkboxes carry inline SVGs (no font <i>, no icon-upgrade dependency).
  var SVG_CURRENCY_INR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M208,80a8,8,0,0,1-8,8H167.85c.09,1.32.15,2.65.15,4a60.07,60.07,0,0,1-60,60H92.69l72.69,66.08a8,8,0,1,1-10.76,11.84l-88-80A8,8,0,0,1,72,136h36a44.05,44.05,0,0,0,44-44c0-1.35-.07-2.68-.19-4H72a8,8,0,0,1,0-16h75.17A44,44,0,0,0,108,48H72a8,8,0,0,1,0-16H200a8,8,0,0,1,0,16H148.74a60.13,60.13,0,0,1,15.82,24H200A8,8,0,0,1,208,80Z"/></svg>';
  var SVG_PERCENT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,61.64l-144,144a8,8,0,0,1-11.32-11.32l144-144a8,8,0,0,1,11.32,11.31ZM50.54,101.44a36,36,0,0,1,50.92-50.91h0a36,36,0,0,1-50.92,50.91ZM56,76A20,20,0,1,0,90.14,61.84h0A20,20,0,0,0,56,76ZM216,180a36,36,0,1,1-10.54-25.46h0A35.76,35.76,0,0,1,216,180Zm-16,0a20,20,0,1,0-5.86,14.14A19.87,19.87,0,0,0,200,180Z"/></svg>';
  var SVG_CHART_PIE_SLICE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M100,116.43a8,8,0,0,0,4-6.93v-72A8,8,0,0,0,93.34,30,104.06,104.06,0,0,0,25.73,147a8,8,0,0,0,4.52,5.81,7.86,7.86,0,0,0,3.35.74,8,8,0,0,0,4-1.07ZM88,49.62v55.26L40.12,132.51C40,131,40,129.48,40,128A88.12,88.12,0,0,1,88,49.62ZM128,24a8,8,0,0,0-8,8v91.82L41.19,169.73a8,8,0,0,0-2.87,11A104,104,0,1,0,128,24Zm0,192a88.47,88.47,0,0,1-71.49-36.68l75.52-44a8,8,0,0,0,4-6.92V40.36A88,88,0,0,1,128,216Z"/></svg>';
  // `ph-bold ph-check` → ph-bold is a weight class (stripped by icon-upgrade);
  // the name resolves to the regular `check` SVG. Inlined verbatim.
  var SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>';

  // Map the settings "Default Split" preference label → internal split mode.
  var SPLIT_PREF_MAP = {
    'Equal split': 'equal',
    'By exact amounts': 'amount',
    'By percentage': 'percent',
    'By shares': 'shares'
  };
  function defaultSplitMode() {
    try {
      var p = JSON.parse(localStorage.getItem('settlr_prefs') || '{}') || {};
      return SPLIT_PREF_MAP[p.defaultSplit] || 'equal';
    } catch (e) { return 'equal'; }
  }

  function iconHolder(svg, extraClass) {
    var cls = extraClass ? 'icon-holder ' + extraClass : 'icon-holder';
    return '<span class="' + cls + '" aria-hidden="true">' + svg + '</span>';
  }

  // ── Per-view state. Rebuilt fresh in onShow; nulled in onHide. ──
  var S = null;
  var payerCtrl = null;     // SettlrPayerSheet controller (created each onShow)
  var footerScrollEl = null;
  var footerScrollHandler = null;

  // ── PAYER SHEET globals (kept on window for the iframe entry) ──
  // Delegate to the shared SettlrPayerSheet controller created in onShow.
  if (!window.openPayerSheet) {
    window.openPayerSheet = function () { if (payerCtrl) payerCtrl.open(); };
  }
  if (!window.closePayerSheet) {
    window.closePayerSheet = function (e) { if (payerCtrl) payerCtrl.close(e); };
  }

  function init(root, params) {
    // One-time wiring. The footer scroll-shadow listener and the heavy build
    // both run in onShow (re-derived each show), so init is intentionally
    // light. The payer-sheet globals are installed at module load (above).
  }

  function onShow(root, params) {
    var ctx = JSON.parse(sessionStorage.getItem('settlr_new_expense') || '{}');
    if (!ctx.totalAmount || !ctx.splitAmong) {
      if (window.SettlrRouterSPA && window.SettlrRouterSPA.navigate &&
          document.getElementById('view-add-amount')) {
        window.SettlrRouterSPA.navigate('add-amount');
      } else {
        location.replace('add-amount');
      }
      return;
    }

    var me = Store.getCurrentUser();
    var participantIds = ctx.splitAmong;
    // activeIds = subset of participants who are actually splitting. Toggled
    // via per-row checkbox. Calculations use activeIds; the full participantIds
    // list is preserved so unchecked rows stay visible (greyed) + re-checkable.
    S = {
      ctx: ctx,
      me: me,
      participantIds: participantIds,
      activeIds: participantIds.slice(),
      paidById: ctx.paidById || participantIds[0],
      total: ctx.totalAmount,
      currency: ctx.currency || null,   // per-expense currency (null ⇒ global)
      splitMode: defaultSplitMode(),
      customSplits: {},
      // Multi-payer map { id: amountPaid }. Default: a single payer covered the
      // whole bill (mirrors the old single-payer model). paidById is kept in
      // sync as the PRIMARY (first) payer for the commit hand-off.
      payers: {},
      nextBtn: root.querySelector('#js-next-split')
    };
    S.payers[S.paidById] = S.total;

    // Reset the segment control to the user's default split mode (from the
    // settings preference) on every show so a re-show never inherits a stale
    // active mode.
    var modeMap = ['equal', 'amount', 'percent', 'shares'];
    var activeIdx = Math.max(0, modeMap.indexOf(S.splitMode));
    var segItems = root.querySelectorAll('.segment-item');
    Array.prototype.forEach.call(segItems, function (b, i) {
      b.classList.toggle('is-active', i === activeIdx);
    });

    // Wire segment buttons + Next once per view (idempotent listeners), but
    // route them through `S` (reassigned fresh every onShow) so re-shows always
    // run the CURRENT activation's logic — never a stale first-show closure.
    Array.prototype.forEach.call(segItems, function (btn, i) {
      if (btn._wired) return;
      btn._wired = true;
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(root.querySelectorAll('.segment-item'), function (b) {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');
        S.splitMode = modeMap[i];
        S.initSplits(S.splitMode);
        S.renderParticipants();
      });
    });

    if (S.nextBtn && !S.nextBtn._wired) {
      S.nextBtn._wired = true;
      S.nextBtn.addEventListener('click', function () { S.commit(); });
    }

    // ── Footer scroll-shadow ── (re)bind to this view's scroll container.
    bindFooterScroll(root);

    // Expose this activation's logic on S so the once-wired segment/Next
    // listeners always call the current show's closures (function decls below
    // are hoisted, so these references are valid here).
    S.initSplits = initSplits;
    S.renderParticipants = renderParticipants;
    S.commit = commitNext;

    // Shared multi-payer sheet controller. It owns the sheet; this screen owns
    // the Paid-by bar + participant rows, re-rendered via onChange.
    payerCtrl = window.SettlrPayerSheet.create({
      root: root,
      participantIds: S.participantIds,
      total: S.total,
      currency: S.currency,
      getInfo: getInfo,
      payers: S.payers,
      onChange: function () {
        S.paidById = Object.keys(S.payers)[0]; // primary payer (commit hand-off)
        renderPayerBar(root);
        renderParticipants();
      }
    });

    // Initial full build.
    renderPayerBar(root);
    renderParticipants();

    // ── helpers (closures over S + root) ─────────────────────
    function isActive(id) { return S.activeIds.indexOf(id) !== -1; }
    function toggleActive(id) {
      var i = S.activeIds.indexOf(id);
      if (i === -1) {
        S.activeIds.push(id);
      } else if (S.activeIds.length > 1) {
        // Always keep at least one person in the split.
        S.activeIds.splice(i, 1);
      }
    }

    function r2(n) { return Math.round(n * 100) / 100; }
    // Route through Store.formatIn so amounts honor this expense's currency.
    function fmt(n) { return Store.formatIn(n, S.currency); }
    function getInfo(id) {
      if (id === S.me.id) return { name: 'You', initials: S.me.initials || 'ME' };
      var c = Store.getContact(id);
      return c ? { name: c.name.split(' ')[0], initials: c.initials } : { name: id, initials: id.slice(0, 2).toUpperCase() };
    }

    // FLOW HAND-OFF — persist the chosen split into the draft and advance to
    // add-review (SPA navigate when the sibling view exists, else real nav).
    function commitNext() {
      var c = S.ctx;
      c.paidById = S.paidById;
      c.payers = JSON.parse(JSON.stringify(S.payers));
      c.splitMethod = S.splitMode;
      // Only the active subset participates in the split.
      c.splitAmong = S.activeIds.slice();
      if (S.splitMode === 'equal') {
        c.perPerson = r2(S.total / S.activeIds.length);
        delete c.splitAmounts;
      } else {
        var amounts = {};
        S.activeIds.forEach(function (id) { amounts[id] = getAmountForId(id); });
        c.splitAmounts = amounts;
        c.perPerson = null;
      }
      sessionStorage.setItem('settlr_new_expense', JSON.stringify(c));
      if (window.SettlrRouterSPA && document.getElementById('view-add-review')) {
        window.SettlrRouterSPA.navigate('add-review');
      } else {
        location.href = 'add-review';
      }
    }

    function initSplits(mode) {
      var ids = S.activeIds;
      var n = ids.length;
      if (mode === 'amount') {
        var base = r2(S.total / n);
        var last = r2(S.total - base * (n - 1));
        ids.forEach(function (id, i) { S.customSplits[id] = i === n - 1 ? last : base; });
      } else if (mode === 'percent') {
        var basePct = Math.floor(100 / n);
        ids.forEach(function (id, i) { S.customSplits[id] = i === n - 1 ? 100 - basePct * (n - 1) : basePct; });
      } else if (mode === 'shares') {
        ids.forEach(function (id) { if (!S.customSplits[id]) S.customSplits[id] = 1; });
      }
    }

    function getAmountForId(id) {
      if (!isActive(id)) return 0;
      if (S.splitMode === 'equal') return r2(S.total / S.activeIds.length);
      if (S.splitMode === 'amount') return r2(parseFloat(S.customSplits[id]) || 0);
      if (S.splitMode === 'percent') return r2(S.total * (parseFloat(S.customSplits[id]) || 0) / 100);
      if (S.splitMode === 'shares') {
        var ts = S.activeIds.reduce(function (s, i) { return s + (parseFloat(S.customSplits[i]) || 1); }, 0);
        return r2(S.total * ((parseFloat(S.customSplits[id]) || 1) / ts));
      }
    }

    // ── Payers (multi) — toggle/validation live in SettlrPayerSheet now. ──
    // Net settlement for a person = what they paid − what they owe (their share).
    function netForId(id) {
      var paid = parseFloat(S.payers[id]) || 0;
      var share = isActive(id) ? getAmountForId(id) : 0;
      return r2(paid - share);
    }
    function netLabel(id) {
      if (!isActive(id) && S.payers[id] === undefined) return 'Not splitting';
      var net = netForId(id);
      if (net > 0.005) return 'Gets back ' + fmt(net);
      if (net < -0.005) return 'Owes ' + fmt(-net);
      return 'Settled';
    }

    function runningTotal() {
      if (S.splitMode === 'amount') return r2(S.activeIds.reduce(function (s, id) { return s + (parseFloat(S.customSplits[id]) || 0); }, 0));
      if (S.splitMode === 'percent') return r2(S.activeIds.reduce(function (s, id) { return s + (parseFloat(S.customSplits[id]) || 0); }, 0));
      return S.total;
    }

    function isValid() {
      if (S.splitMode === 'equal' || S.splitMode === 'shares') return true;
      if (S.splitMode === 'amount') return Math.abs(runningTotal() - S.total) < 0.01;
      if (S.splitMode === 'percent') return Math.abs(runningTotal() - 100) < 0.5;
    }

    function updateTotalBar() {
      var el = root.querySelector('#js-total');
      var errEl = root.querySelector('#js-split-error');
      var valid = isValid();
      if (S.splitMode === 'equal' || S.splitMode === 'shares') {
        el.textContent = fmt(S.total) + ' \u2713';
        el.className = 'total-bar__ok';
        errEl.textContent = '';
        errEl.classList.remove('split-error--visible');
      } else if (S.splitMode === 'amount') {
        var sa = runningTotal();
        el.textContent = fmt(sa) + ' / ' + fmt(S.total) + (valid ? ' \u2713' : '');
        el.className = valid ? 'total-bar__ok' : 'total-bar__err';
        if (valid) {
          errEl.textContent = '';
          errEl.classList.remove('split-error--visible');
        } else {
          errEl.textContent = 'Amounts don\u2019t add up to ' + fmt(S.total);
          errEl.classList.add('split-error--visible');
        }
      } else if (S.splitMode === 'percent') {
        var sp = runningTotal();
        el.textContent = sp + '% / 100%' + (valid ? ' \u2713' : '');
        el.className = valid ? 'total-bar__ok' : 'total-bar__err';
        if (valid) {
          errEl.textContent = '';
          errEl.classList.remove('split-error--visible');
        } else {
          errEl.textContent = 'Percentages must total 100%';
          errEl.classList.add('split-error--visible');
        }
      }
      // Next also requires the payers' amounts to sum to the total.
      var canNext = valid && (payerCtrl ? payerCtrl.isValid() : true);
      S.nextBtn.style.opacity = canNext ? '' : String(0.4);
      S.nextBtn.style.pointerEvents = canNext ? '' : 'none';
    }

    function inputCol(id) {
      var active = isActive(id);
      var val = active
        ? (S.customSplits[id] !== undefined ? S.customSplits[id] : 0)
        : 0;
      // customSplits is stored in INR; amount-mode inputs are entered/shown in
      // the display currency (percent/shares are unitless → no conversion).
      if (S.splitMode === 'amount') val = Store.fromBaseIn(val, S.currency);
      var step = S.splitMode === 'shares' ? '1' : '0.01';
      var roAttr = active ? '' : ' readonly tabindex="-1"';
      var inp = '<input class="amount-input__field" type="number" min="0" step="' + step +
                '" data-pid="' + id + '" value="' + val + '"' + roAttr + '>';
      var inactiveCls = active ? '' : ' amount-input--inactive js-reactivate';
      var attrs = active ? '' : ' data-pid="' + id + '"';
      if (S.splitMode === 'amount')  return '<div class="amount-input amount-input--currency' + inactiveCls + '"' + attrs + '><span class="amount-input__icon">' + Store.currencySymbolOf(S.currency) + '</span>' + inp + '</div>';
      if (S.splitMode === 'percent') return '<div class="amount-input amount-input--percent' + inactiveCls + '"' + attrs + '>' + inp + '<span class="amount-input__icon">' + iconHolder(SVG_PERCENT) + '</span></div>';
      if (S.splitMode === 'shares')  return '<div class="amount-input amount-input--shares' + inactiveCls + '"' + attrs + '>' + inp + '<span class="amount-input__icon">' + iconHolder(SVG_CHART_PIE_SLICE) + '</span></div>';
    }

    function renderParticipants() {
      var nActive = Math.max(1, S.activeIds.length);
      var pp = r2(S.total / nActive);
      var summaryLabels = { equal: fmt(pp), amount: 'Custom', percent: '% split', shares: 'By shares' };
      var showLabel = { equal: true, amount: false, percent: false, shares: false };
      root.querySelector('#js-per-person').textContent = summaryLabels[S.splitMode];
      root.querySelector('#js-per-person-label').style.display = showLabel[S.splitMode] ? '' : 'none';

      // Reset + rebuild the rows (clear before re-render).
      root.querySelector('#js-participants').innerHTML = S.participantIds.map(function (id) {
        var p = getInfo(id);
        var active = isActive(id);
        var amtForId = getAmountForId(id);
        // Sublabel = net settlement (paid − share): "Gets back" / "Owes" / "Settled".
        var shareLabel = netLabel(id);
        var amtCol;
        if (S.splitMode === 'equal') {
          // Equal mode has no input — always show the amount span. When
          // inactive, display \u20B90 in a click-to-reactivate wrapper.
          var dispVal = active ? fmt(amtForId) : fmt(0);
          var equalCls = active ? '' : ' js-reactivate';
          var equalAttrs = active ? '' : ' data-pid="' + id + '"';
          amtCol = '<div class="participant-item__amount' + equalCls + '"' + equalAttrs + '>' +
                     '<span class="participant-item__amount-value text-amount-sm">' + dispVal + '</span>' +
                   '</div>';
        } else {
          amtCol = inputCol(id);
        }
        var rowMod = active ? '' : ' participant-item--inactive';
        var checkMod = active ? ' is-selected' : '';
        return '<div class="participant-item' + rowMod + '" data-pid="' + id + '">' +
          '<div class="checkbox-control js-toggle-participant' + checkMod + '" data-pid="' + id + '">' + iconHolder(SVG_CHECK, 'checkbox-control__check') + '</div>' +
          '<div class="avatar avatar--initials avatar--md">' + p.initials + '</div>' +
          '<div class="participant-item__text">' +
            '<span class="participant-item__name text-title-sm">' + p.name + '</span>' +
            '<span class="participant-item__share text-body-xs js-share-lbl" data-pid="' + id + '">' + shareLabel + '</span>' +
          '</div>' +
          amtCol +
        '</div>';
      }).join('');

      // Wire toggle checkboxes
      root.querySelectorAll('#js-participants .js-toggle-participant').forEach(function (cb) {
        cb.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var pid = cb.getAttribute('data-pid');
          toggleActive(pid);
          if (S.splitMode !== 'equal') initSplits(S.splitMode);
          renderParticipants();
        });
      });

      // Click on inactive amount column / input also reactivates
      root.querySelectorAll('#js-participants .js-reactivate').forEach(function (el) {
        el.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var pid = el.getAttribute('data-pid');
          if (!pid || isActive(pid)) return;
          toggleActive(pid);
          if (S.splitMode !== 'equal') initSplits(S.splitMode);
          renderParticipants();
          // After re-render, focus the now-editable input for this row
          var inp = root.querySelector('#js-participants .amount-input__field[data-pid="' + pid + '"]');
          if (inp) inp.focus();
        });
      });

      if (S.splitMode !== 'equal') {
        root.querySelectorAll('#js-participants .amount-input__field').forEach(function (inp) {
          inp.addEventListener('input', function () {
            var pid = inp.getAttribute('data-pid');
            var typed = parseFloat(inp.value) || 0;
            // Amount mode is typed in the display currency → store INR; percent/
            // shares are unitless and stored as-is.
            S.customSplits[pid] = (S.splitMode === 'amount') ? Store.toBaseIn(typed, S.currency) : typed;
            // A share change shifts everyone's net (the payers are fixed), so
            // refresh every row's sublabel, not just this one.
            root.querySelectorAll('.js-share-lbl').forEach(function (lbl) {
              lbl.textContent = netLabel(lbl.getAttribute('data-pid'));
            });
            updateTotalBar();
          });
          inp.addEventListener('focus', function () { if (this.value === '0') this.select(); });
        });
      }
      updateTotalBar();
    }

    // Paid-by bar (this screen owns it; the shared sheet calls onChange → here).
    function renderPayerBar(r) {
      var ids = Object.keys(S.payers);
      r.querySelector('#js-paid-avatars').innerHTML = ids.map(function (id) {
        return '<div class="avatar avatar--initials avatar--md">' + getInfo(id).initials + '</div>';
      }).join('');
      var nameEl = r.querySelector('#js-paid-name');
      if (ids.length <= 1) {
        nameEl.textContent = ids.length ? getInfo(ids[0]).name : '—';
      } else {
        var extra = ids.length - 1;
        nameEl.textContent = getInfo(ids[0]).name + ' + ' + extra + (extra === 1 ? ' other' : ' others');
      }
    }
  }

  function bindFooterScroll(root) {
    // Tear down any prior binding first (idempotent across re-shows).
    if (footerScrollEl && footerScrollHandler) {
      footerScrollEl.removeEventListener('scroll', footerScrollHandler);
    }
    var footer = root.querySelector('.screen-footer');
    var scrollEl = root.querySelector('.view__content');
    if (!footer || !scrollEl) { footerScrollEl = null; footerScrollHandler = null; return; }
    footerScrollHandler = function () {
      footer.classList.toggle('is-scrolled', scrollEl.scrollTop > 0);
    };
    scrollEl.addEventListener('scroll', footerScrollHandler, { passive: true });
    footerScrollEl = scrollEl;
  }

  function onHide(root) {
    // Tear down the footer scroll listener (the only persistent listener).
    if (footerScrollEl && footerScrollHandler) {
      footerScrollEl.removeEventListener('scroll', footerScrollHandler);
    }
    footerScrollEl = null;
    footerScrollHandler = null;
    // Close any open payer sheet so it doesn't linger on the next show.
    var sheet = root.querySelector('#payer-sheet');
    if (sheet) sheet.style.display = 'none';
    S = null;
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('add-split', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="add-split"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
