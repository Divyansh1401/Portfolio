/* ============================================================
   Settlr — Create Group (Name) view module
   Former inline IIFE from screens/create-group-name.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views.

   The Next action validates the group name, stores a transient new-group
   payload in sessionStorage, then hands off to the create-group-members step.
   The sessionStorage hand-off is preserved exactly; cross-screen navigation
   goes through SettlrRouterSPA.navigate when the SPA router is present, and
   falls back to the original location.href for standalone use of
   screens/create-group-name.html.
   ============================================================ */
(function () {
  'use strict';

  function handoff() {
    if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('create-group-members');
    else location.href = 'create-group-members';
  }

  // Per-view state — the chosen photo dataURL + default currency are held here
  // until handoff, keyed off the root element so re-shows reuse it without
  // clobbering other views.
  function state(root) {
    if (!root._createGroupNameState) root._createGroupNameState = { photoDataUrl: null, currency: null, type: 'other', emoji: '📝' };
    return root._createGroupNameState;
  }

  // ── Group-type template picker (type-chip grid, single-select) ──
  function selectType(root, chip) {
    if (!chip) return;
    var grid = root.querySelector('#js-cgn-types');
    if (grid) Array.prototype.forEach.call(grid.querySelectorAll('.type-chip'), function (c) {
      c.classList.toggle('is-selected', c === chip);
    });
    state(root).type = chip.getAttribute('data-type') || 'other';
    state(root).emoji = chip.getAttribute('data-emoji') || '📝';
  }

  // ── Default-currency picker (mirrors add-amount's currency sheet) ──
  function currencyByCode(code) {
    var opts = Store.currencyOptions();
    return opts.find(function (c) { return c.code === code; }) || opts[0];
  }
  function applyCurrency(root, cur) {
    if (!cur) return;
    state(root).currency = cur.code;
    var label = root.querySelector('#js-cgn-currency-label');
    if (label) label.textContent = cur.symbol + ' ' + cur.code;
  }
  function openCurrencySheet(root) {
    var list = root.querySelector('#js-cgn-currency-list');
    var sel = state(root).currency;
    list.innerHTML = Store.currencyOptions().map(function (c) {
      var s = c.code === sel ? ' is-selected' : '';
      return '<div class="detail-row detail-row--clickable' + s + '" data-code="' + c.code + '">' +
        '<span class="detail-row__icon">' + c.symbol + '</span>' +
        '<div class="detail-row__text">' +
          '<span class="detail-row__value">' + c.code + '</span>' +
          '<span class="detail-row__label">' + c.name + '</span>' +
        '</div>' +
        '<div class="detail-row__right"><span class="detail-row__radio"><span class="detail-row__radio-dot"></span></span></div>' +
      '</div>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('.detail-row'), function (el) {
      el.addEventListener('click', function () {
        applyCurrency(root, currencyByCode(el.getAttribute('data-code')));
        closeCurrencySheet(root);
      });
    });
    root.querySelector('#cgnCurrencySheet').style.display = 'flex';
  }
  function closeCurrencySheet(root) {
    var sheet = root.querySelector('#cgnCurrencySheet');
    if (window.SettlrSheetDrag && window.SettlrSheetDrag.close) {
      window.SettlrSheetDrag.close(sheet, function () { sheet.style.display = 'none'; });
    } else {
      sheet.style.display = 'none';
    }
  }

  // Preview the picked image inside the .photo-upload tile (same FileReader →
  // dataURL pattern as edit-profile) and stash it for the Next handoff.
  function previewPhoto(root, tile, file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      state(root).photoDataUrl = e.target.result;
      if (tile) {
        tile.classList.add('photo-upload--photo');
        tile.style.backgroundImage = 'url(' + e.target.result + ')';
      }
    };
    reader.readAsDataURL(file);
  }

  function init(root) {
    // One-time wiring: attach the Next click handler once. Guarded by a flag
    // so re-shows (back navigation) don't stack listeners.
    var tile = root.querySelector('#js-group-photo');
    var photoInput = root.querySelector('#js-group-photo-input');
    if (tile && photoInput && !tile._wired) {
      tile._wired = true;
      tile.addEventListener('click', function () { photoInput.click(); });
      photoInput.addEventListener('change', function () {
        previewPhoto(root, tile, photoInput.files && photoInput.files[0]);
      });
    }

    // Currency picker wiring (idempotent).
    var curBtn = root.querySelector('#js-cgn-currency-btn');
    if (curBtn && !curBtn._wired) {
      curBtn._wired = true;
      curBtn.addEventListener('click', function () { openCurrencySheet(root); });
    }
    var curClose = root.querySelector('#js-cgn-currency-close');
    if (curClose && !curClose._wired) {
      curClose._wired = true;
      curClose.addEventListener('click', function () { closeCurrencySheet(root); });
    }
    var curSheet = root.querySelector('#cgnCurrencySheet');
    if (curSheet && !curSheet._wired) {
      curSheet._wired = true;
      curSheet.addEventListener('click', function (e) { if (e.target === curSheet) closeCurrencySheet(root); });
    }

    // Group-type chips (idempotent single-select wiring).
    var typeGrid = root.querySelector('#js-cgn-types');
    if (typeGrid && !typeGrid._wired) {
      typeGrid._wired = true;
      Array.prototype.forEach.call(typeGrid.querySelectorAll('.type-chip'), function (chip) {
        chip.addEventListener('click', function () { selectType(root, chip); });
      });
    }

    var nextBtn = root.querySelector('#js-next-cgn');
    if (nextBtn && !nextBtn._wired) {
      nextBtn._wired = true;
      nextBtn.addEventListener('click', function () {
        var nameInput = root.querySelector('#js-group-name');
        var name = nameInput.value.trim();
        if (!name) {
          nameInput.focus();
          nameInput.closest('.input-field').classList.add('input-field--error');
          return;
        }
        var payload = { name: name, type: state(root).type, emoji: state(root).emoji };
        var photo = state(root).photoDataUrl;
        if (photo) payload.photo = photo;
        if (state(root).currency) payload.currency = state(root).currency;
        sessionStorage.setItem('settlr_new_group', JSON.stringify(payload));
        handoff();
      });
    }
  }

  function onShow(root) {
    // Reset transient UI: clear any prior validation error so the field starts
    // clean each time the step is shown.
    var field = root.querySelector('.input-field');
    if (field) field.classList.remove('input-field--error');

    // Reset the photo picker so a fresh group never carries a previous preview.
    state(root).photoDataUrl = null;
    var tile = root.querySelector('#js-group-photo');
    if (tile) {
      tile.classList.remove('photo-upload--photo');
      tile.style.backgroundImage = '';
    }
    var photoInput = root.querySelector('#js-group-photo-input');
    if (photoInput) photoInput.value = '';

    // Default the currency chip to the global Settings currency each show.
    applyCurrency(root, currencyByCode(Store.currencyCode()));

    // Reset the group-type picker back to the default "Other" each show.
    var defaultType = root.querySelector('#js-cgn-types .type-chip[data-type="other"]');
    if (defaultType) selectType(root, defaultType);
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers). The
    // Next listener is attached idempotently and lives with the in-DOM view.
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('create-group-name', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="create-group-name"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
