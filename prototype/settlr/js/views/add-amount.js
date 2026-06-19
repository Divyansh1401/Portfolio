/* ============================================================
   Settlr — Add Amount (Add Expense, step 1) view module
   Former inline IIFE from screens/add-amount.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views.

   COMPLEX-SCREEN NOTES
   --------------------
   • Bottom sheets stay as window globals. The ss-add-amount-currency.html /
     ss-add-amount-category.html iframe wrappers load this screen and call
     `iframe.contentWindow.openCurrencySheet()` / `openCategorySheet()` on
     load — so those open/close functions MUST remain on `window`. They are
     wired in init (scoped to the active root internally) and re-pointed each
     show so they always target the live view. The sheets are local
     display:flex overlays inside the view (NOT routes).
   • visualViewport keyboard handler is registered in onShow and REMOVED in
     onHide (handler ref stored on the module) so it never leaks across views.
   • Flow hand-off: writes sessionStorage('settlr_new_expense') then advances
     to the next step (add-group) via SettlrRouterSPA when present, else a real
     navigation for standalone use.
   • onShow repopulates amount / currency / category from any existing draft
     and resets transient state (errors, auto-category, popping).

   Icons emitted dynamically by JS are inline SVG (no font <i>), mirroring the
   expense-detail.js check/copy approach — the constants below are the exact
   Phosphor glyphs the old screen rendered via icons.js.
   ============================================================ */
(function () {
  'use strict';

  // ── Inline SVG glyphs for JS-emitted icons (exact Phosphor regular paths) ──
  var SVG_CARET_DOWN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg>';
  var SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>';

  // ── Category data ───────────────────────────────────────
  var CATEGORIES = [
    { emoji: '🍽️', label: 'Food' },
    { emoji: '✈️', label: 'Travel' },
    { emoji: '🏠', label: 'Housing' },
    { emoji: '🚗', label: 'Transport' },
    { emoji: '🛒', label: 'Shopping' },
    { emoji: '🎬', label: 'Entertainment' },
    { emoji: '💊', label: 'Health' },
    { emoji: '📱', label: 'Utilities' },
    { emoji: '🎓', label: 'Education' },
    { emoji: '🏋️', label: 'Fitness' },
    { emoji: '🎁', label: 'Gifts' },
    { emoji: '📝', label: 'Other' }
  ];

  // ── Auto-category keyword map ────────────────────────────
  var CATEGORY_KEYWORDS = {
    'Food':          ['dinner','lunch','breakfast','food','restaurant','cafe','coffee','tea','pizza','burger','sushi','meal','snack','groceries','grocery','drink','drinks','bar','beer','wine','brunch','biryani','dosa','chai','canteen','bakery','sweets','eating'],
    'Travel':        ['flight','hotel','uber','ola','cab','taxi','train','bus','ticket','trip','travel','tour','hostel','airbnb','airport','metro','railway','boarding'],
    'Housing':       ['rent','electricity','maintenance','repair','furniture','society','maid','house','flat','pg','deposit','lease','landlord'],
    'Transport':     ['petrol','fuel','parking','toll','transport','commute','auto','rickshaw','scooter','bike service','car wash'],
    'Shopping':      ['amazon','flipkart','clothes','shirt','shoes','bag','mall','online order','delivery','shopping','meesho','myntra','zara'],
    'Entertainment': ['movie','netflix','spotify','prime','gaming','concert','show','club','streaming','cinema','theatre','hotstar','ott','disney'],
    'Health':        ['doctor','hospital','medicine','pharmacy','medical','dentist','clinic','consultation','chemist','lab test','prescription'],
    'Utilities':     ['phone bill','recharge','internet bill','subscription','broadband','cable','gas bill','electricity bill','water bill','wifi'],
    'Education':     ['books','course','class','tuition','fees','coaching','school fees','college fees','udemy','coursera','workshop'],
    'Fitness':       ['gym','yoga','fitness','workout','swimming','cycling','zumba','crossfit','protein','supplements'],
    'Gifts':         ['gift','birthday','anniversary','present','wedding gift','bouquet','cake']
  };

  // ── Per-view mutable state ──────────────────────────────
  // Currency is global (Settings preference) — no per-expense currency picker.
  var selectedCategory = { emoji: '📝', label: 'Other' };
  var userPickedManually = false;
  var viewportHandler = null;   // visualViewport handler ref (for teardown)

  function detectCategory(text) {
    var lower = text.toLowerCase();
    var best = null, bestScore = 0;
    Object.keys(CATEGORY_KEYWORDS).forEach(function (cat) {
      var score = 0;
      CATEGORY_KEYWORDS[cat].forEach(function (kw) {
        if (lower.indexOf(kw) !== -1) score += kw.length;
      });
      if (score > bestScore) { bestScore = score; best = cat; }
    });
    return best ? CATEGORIES.find(function (c) { return c.label === best; }) : null;
  }

  function applyAutoCategory(root, cat) {
    var btn = root.querySelector('#js-cat-btn');
    var changed = !btn.classList.contains('has-value') || selectedCategory.label !== cat.label;
    selectedCategory = cat;
    btn.querySelector('.category-chip-btn__emoji').textContent = cat.emoji;
    root.querySelector('#js-cat-label').textContent = cat.label;
    btn.classList.add('has-value');
    if (changed) {
      btn.classList.remove('is-popping');
      void btn.offsetWidth;
      btn.classList.add('is-popping');
      btn.addEventListener('animationend', function () {
        btn.classList.remove('is-popping');
      }, { once: true });
    }
  }

  function resetCategoryChip(root) {
    selectedCategory = { emoji: '📝', label: 'Other' };
    var btn = root.querySelector('#js-cat-btn');
    btn.querySelector('.category-chip-btn__emoji').textContent = '🏷️';
    root.querySelector('#js-cat-label').textContent = 'Category';
    btn.classList.remove('has-value');
  }

  function resizeAmt(amtInput) {
    amtInput.style.width = Math.max(1, amtInput.value.length || 1) + 'ch';
  }

  // ── Init: one-time wiring, scoped to root, sheets exposed on window ──
  function init(root, params) {
    // Title → auto-category
    var titleInput = root.querySelector('#js-title');
    titleInput.addEventListener('input', function () {
      if (userPickedManually) return;
      var val = this.value.trim();
      if (!val) { resetCategoryChip(root); return; }
      var detected = detectCategory(val) || CATEGORIES.find(function (c) { return c.label === 'Other'; });
      applyAutoCategory(root, detected);
    });

    // Amount auto-resize + tab-to-title
    var amtInput = root.querySelector('#js-amount');
    amtInput.addEventListener('input', function () { resizeAmt(amtInput); });
    resizeAmt(amtInput);
    amtInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        root.querySelector('#js-title').focus();
      }
    });

    // Footer scroll-shadow (mirrors the old inline scroll listener)
    var footer = root.querySelector('.screen-footer');
    var scrollEl = root.querySelector('.view__content');
    if (footer && scrollEl) {
      scrollEl.addEventListener('scroll', function () {
        footer.classList.toggle('is-scrolled', scrollEl.scrollTop > 0);
      }, { passive: true });
    }

    // Next button → flow hand-off
    root.querySelector('#js-next').addEventListener('click', function () {
      var amtEl = root.querySelector('#js-amount');
      var amountError = root.querySelector('#amount-error');
      var amt = parseFloat(amtEl.value);
      if (!amt || amt <= 0) {
        amountError.style.display = 'block';
        amtEl.focus();
        return;
      }
      amountError.style.display = 'none';
      var title = root.querySelector('#js-title').value.trim();
      if (!title) { alert('Add a title for this expense'); return; }
      var draft = {
        totalAmount: Store.toBase(amt), // typed in display currency → store INR
        title: title,
        category: selectedCategory.label,
        emoji: selectedCategory.emoji,
        date: new Date().toISOString().slice(0, 10)
      };

      // When the flow was started from a group or person detail page, the
      // participants are already known — pre-fill them and skip the people
      // picker (add-group), going straight to the split step.
      var origin = root._expenseOrigin;
      if (origin) {
        var me = Store.getCurrentUser().id;
        if (origin.groupId) {
          var g = Store.getGroup(origin.groupId);
          var members = (g && g.memberIds) ? g.memberIds.slice() : [me];
          if (members.indexOf(me) === -1) members.unshift(me);
          draft.groupId = origin.groupId;
          draft.splitAmong = members;
          draft.paidById = me;
          // Remember where the flow started so add-review can return there on save.
          draft.origin = { groupId: origin.groupId };
        } else if (origin.contactId) {
          draft.contactIds = [origin.contactId];
          draft.splitAmong = [me, origin.contactId];
          draft.paidById = me;
          draft.origin = { contactId: origin.contactId };
        }
        sessionStorage.setItem('settlr_new_expense', JSON.stringify(draft));
        if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('add-split');
        else location.href = 'add-split';
        return;
      }

      sessionStorage.setItem('settlr_new_expense', JSON.stringify(draft));
      if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('add-group');
      else location.href = 'add-group';
    });

    // ── Sheets as window globals (the ss-* iframe wrappers call these) ──
    // Each is scoped to the active `root` internally but exposed on window so
    // `iframe.contentWindow.openCurrencySheet()` keeps working unchanged.
    window.openCategorySheet = function () {
      var grid = root.querySelector('#js-cat-grid');
      grid.innerHTML = CATEGORIES.map(function (c) {
        var sel = c.label === selectedCategory.label ? ' is-selected' : '';
        return '<div class="cat-item' + sel + '" data-cat="' + c.label + '">' +
          '<span class="cat-item__emoji">' + c.emoji + '</span>' +
          '<span class="cat-item__label text-caption-sm">' + c.label + '</span>' +
        '</div>';
      }).join('');
      // Delegate selection (clean markup, no inline onclick)
      Array.prototype.forEach.call(grid.querySelectorAll('.cat-item'), function (el) {
        el.addEventListener('click', function () { window.selectCategory(el.getAttribute('data-cat')); });
      });
      root.querySelector('#categorySheet').style.display = 'flex';
    };
    window.selectCategory = function (label) {
      userPickedManually = true;
      selectedCategory = CATEGORIES.find(function (c) { return c.label === label; });
      var btn = root.querySelector('#js-cat-btn');
      btn.querySelector('.category-chip-btn__emoji').textContent = selectedCategory.emoji;
      root.querySelector('#js-cat-label').textContent = selectedCategory.label;
      btn.classList.add('has-value');
      window.closeCategorySheet();
    };
    window.closeCategorySheet = function (e) {
      var sheet = root.querySelector('#categorySheet');
      if (e && e.target !== sheet) return;
      if (window.SettlrSheetDrag && window.SettlrSheetDrag.close) {
        window.SettlrSheetDrag.close(sheet, function () { sheet.style.display = 'none'; });
      } else {
        sheet.style.display = 'none';
      }
    };

  }

  // ── Show: repopulate from draft, reset transient state, attach viewport ──
  function onShow(root, params) {
    var amtInput = root.querySelector('#js-amount');
    var titleInput = root.querySelector('#js-title');
    var amountError = root.querySelector('#amount-error');

    // Reset transient state
    amountError.style.display = 'none';
    userPickedManually = false;

    // Origin context: when the flow is started from a group or person detail
    // page, the router passes groupId / contactId so the next step pre-fills
    // the participants and skips the people picker. Stored on the root so the
    // (one-time-wired) Next handler can read it, and refreshed on every show —
    // including back-navigation, since the router restores params from history.
    root._expenseOrigin = null;
    if (params && params.groupId) root._expenseOrigin = { groupId: params.groupId };
    else if (params && params.contactId) root._expenseOrigin = { contactId: params.contactId };

    // Amount symbol follows the global settings currency (amounts are typed in
    // the chosen display currency; stored as INR via Store.toBase).
    var prefixEl = root.querySelector('.amount-prefix');
    if (prefixEl) prefixEl.textContent = Store.currencySymbol();

    // Repopulate from any existing draft (stored INR → show in display currency)
    var draft = null;
    try { draft = JSON.parse(sessionStorage.getItem('settlr_new_expense') || 'null'); } catch (e) { draft = null; }

    // No draft yet = the START of a fresh add-expense flow. Mark the history
    // depth so add-review can collapse the whole wizard out of the back stack on
    // save (so Back from the destination doesn't replay the flow). Skipped on
    // back-revisit (draft present) so the original mark is preserved.
    if (!draft && window.SettlrRouterSPA && window.SettlrRouterSPA.beginFlow) {
      window.SettlrRouterSPA.beginFlow();
    }

    if (draft) {
      amtInput.value = (draft.totalAmount != null) ? String(Store.fromBase(draft.totalAmount)) : '';
      titleInput.value = draft.title || '';
      if (draft.category) {
        var cat = CATEGORIES.find(function (c) { return c.label === draft.category; });
        if (cat) {
          selectedCategory = { emoji: draft.emoji || cat.emoji, label: cat.label };
          userPickedManually = true;
          var btn = root.querySelector('#js-cat-btn');
          btn.querySelector('.category-chip-btn__emoji').textContent = selectedCategory.emoji;
          root.querySelector('#js-cat-label').textContent = selectedCategory.label;
          btn.classList.add('has-value');
        }
      } else {
        resetCategoryChip(root);
      }
    } else {
      amtInput.value = '';
      titleInput.value = '';
      resetCategoryChip(root);
    }
    resizeAmt(amtInput);

    // ── Keyboard-aware CTA via visualViewport (registered here, torn down in
    //    onHide so it never leaks across views) ──
    var cta = root.querySelector('#js-cta');
    viewportHandler = function () {
      var vv = window.visualViewport;
      if (!vv) return;
      var keyboardH = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (keyboardH > 50) {
        cta.style.bottom = keyboardH + 'px';
        cta.style.paddingBottom = 'var(--spacing-12)';
      } else {
        cta.style.bottom = '0px';
        cta.style.paddingBottom = 'var(--spacing-32)';
      }
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', viewportHandler);
      window.visualViewport.addEventListener('scroll', viewportHandler);
    }
  }

  // ── Hide: remove the visualViewport handler + close open sheets ──
  function onHide(root) {
    if (viewportHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', viewportHandler);
      window.visualViewport.removeEventListener('scroll', viewportHandler);
    }
    viewportHandler = null;
    var catSheet = root.querySelector('#categorySheet');
    var curSheet = root.querySelector('#currencySheet');
    if (catSheet) catSheet.style.display = 'none';
    if (curSheet) curSheet.style.display = 'none';
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('add-amount', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="add-amount"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
