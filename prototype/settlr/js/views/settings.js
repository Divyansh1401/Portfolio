/* ============================================================
   Settlr — Settings view module
   Makes the screen functional: the profile-hero reflects the live profile, the
   three notification toggles persist, the Currency / Default Split / Language
   rows open picker sheets that persist + reflect the choice, and the Account
   Actions (Log Out / Delete Account) confirm then leave to the right auth
   screen.

   All DOM lookups are scoped to `root`. Preferences live under `settlr_prefs`
   (toggles + currency/defaultSplit/language) and are restored on every onShow.
   The preference pickers are stored choices only — they don't re-localize the
   app or change INR formatting (out of scope).
   ============================================================ */
(function () {
  'use strict';

  var PREFS_KEY = 'settlr_prefs';

  // ── Picker option tables ─────────────────────────────────
  var CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' }
  ];
  var SPLITS = ['Equal split', 'By percentage', 'By shares', 'By exact amounts'];
  var LANGUAGES = ['English', 'हिन्दी (Hindi)', 'Español', 'Français'];

  // ── Prefs storage ────────────────────────────────────────
  function readPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function writePrefs(p) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) {}
  }
  function setPref(key, value) {
    var p = readPrefs();
    p[key] = value;
    writePrefs(p);
  }

  // ── Notification toggles ─────────────────────────────────
  function toggleKey(label) {
    var t = (label || '').toLowerCase();
    if (t.indexOf('push') !== -1)       return 'push';
    if (t.indexOf('reminder') !== -1)   return 'reminders';
    if (t.indexOf('settlement') !== -1) return 'alerts';
    return null;
  }
  function toggles(root) {
    return Array.prototype.map.call(
      root.querySelectorAll('.toggle-control'),
      function (ctrl) {
        return { key: toggleKey(ctrl.getAttribute('aria-label')), input: ctrl.querySelector('input[type="checkbox"]'), control: ctrl };
      }
    ).filter(function (t) { return t.key && t.input; });
  }

  // ── Sheet helpers ────────────────────────────────────────
  function closeSheet(root, id) {
    var sheet = root.querySelector('#' + id);
    if (!sheet) return;
    if (window.SettlrSheetDrag && window.SettlrSheetDrag.close) {
      window.SettlrSheetDrag.close(sheet, function () { sheet.style.display = 'none'; });
    } else {
      sheet.style.display = 'none';
    }
  }

  // Render a radio list into a sheet, wire selection → commit(value) + close.
  function openPicker(root, sheetId, listId, options, currentValue, commit) {
    var list = root.querySelector('#' + listId);
    var sheet = root.querySelector('#' + sheetId);
    if (!list || !sheet) return;
    list.innerHTML = options.map(function (o) {
      var sel = o.value === currentValue;
      var icon = o.symbol != null ? o.symbol : '';
      return '<div class="detail-row detail-row--clickable' + (sel ? ' is-selected' : '') + '" data-value="' + o.value + '">' +
        (icon ? '<div class="detail-row__icon">' + icon + '</div>' : '') +
        '<div class="detail-row__text"><span class="detail-row__value">' + o.label + '</span></div>' +
        '<span class="detail-row__radio" aria-hidden="true"><span class="detail-row__radio-dot"></span></span>' +
      '</div>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('.detail-row'), function (el) {
      el.addEventListener('click', function () {
        Array.prototype.forEach.call(list.querySelectorAll('.detail-row'), function (r) {
          r.classList.toggle('is-selected', r === el);
        });
        var val = el.getAttribute('data-value');
        setTimeout(function () { commit(val); closeSheet(root, sheetId); }, 200);
      });
    });
    sheet.style.display = 'flex';
  }

  // ── Reflect persisted preference values into the rows ────
  function currencyLabel(code) {
    var c = CURRENCIES.find(function (x) { return x.code === code; }) || CURRENCIES[0];
    return c.symbol + ' ' + c.name + ' (' + c.code + ')';
  }
  // Compact relative time for the rates "Updated …" label.
  function relTime(ts) {
    if (!ts) return 'Static rates';
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'Updated just now';
    var m = Math.floor(s / 60); if (m < 60) return 'Updated ' + m + 'm ago';
    var h = Math.floor(m / 60); if (h < 24) return 'Updated ' + h + 'h ago';
    return 'Updated ' + Math.floor(h / 24) + 'd ago';
  }
  function restorePrefRows(root) {
    var p = readPrefs();
    var cur = root.querySelector('#js-pref-currency-val');
    if (cur) cur.textContent = currencyLabel(p.currency || 'INR');
    var split = root.querySelector('#js-pref-split-val');
    if (split) split.textContent = p.defaultSplit || 'Equal split';
    var lang = root.querySelector('#js-pref-language-val');
    if (lang) lang.textContent = p.language || 'English';
    var rates = root.querySelector('#js-pref-rates-val');
    if (rates) rates.textContent = relTime(typeof Store.ratesUpdatedAt === 'function' ? Store.ratesUpdatedAt() : null);
  }

  // ── Populate the profile-hero from Store ─────────────────
  function populateProfile(root) {
    if (typeof Store.getCurrentUser !== 'function') return;
    var u = Store.getCurrentUser();
    var avatar = root.querySelector('#js-settings-avatar');
    if (avatar) {
      if (u.photo) {
        avatar.style.backgroundImage = 'url(' + u.photo + ')';
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.textContent = '';
      } else {
        avatar.style.backgroundImage = '';
        avatar.textContent = u.initials || 'DR';
      }
    }
    var nameEl = root.querySelector('#js-settings-name');
    if (nameEl && u.name) nameEl.textContent = u.name;
    var phoneEl = root.querySelector('#js-settings-phone');
    if (phoneEl && u.phone) phoneEl.textContent = Store.formatPhone ? Store.formatPhone(u.phone) : u.phone;
    // Account-card rows (were static seed values — real users must see their own).
    var rowName = root.querySelector('#js-settings-row-name');
    if (rowName && u.name) rowName.textContent = u.name;
    var rowPhone = root.querySelector('#js-settings-row-phone');
    if (rowPhone && u.phone) rowPhone.textContent = Store.formatPhone ? Store.formatPhone(u.phone) : u.phone;
    var rowUpi = root.querySelector('#js-settings-row-upi');
    if (rowUpi && u.upi) rowUpi.textContent = u.upi;
  }

  // ── Lifecycle ────────────────────────────────────────────
  function init(root) {
    if (root._settingsWired) return;
    root._settingsWired = true;

    // Notification toggles → persist on change.
    toggles(root).forEach(function (t) {
      t.input.addEventListener('change', function () {
        setPref(t.key, t.input.checked);
        t.control.setAttribute('aria-checked', t.input.checked ? 'true' : 'false');
      });
    });

    // Preference pickers.
    var curRow = root.querySelector('#js-pref-currency');
    if (curRow) curRow.addEventListener('click', function () {
      openPicker(root, 'js-currency-sheet', 'js-pref-currency-list',
        CURRENCIES.map(function (c) { return { value: c.code, label: c.name + ' (' + c.code + ')', symbol: c.symbol }; }),
        readPrefs().currency || 'INR',
        function (code) { setPref('currency', code); var el = root.querySelector('#js-pref-currency-val'); if (el) el.textContent = currencyLabel(code); });
    });
    var splitRow = root.querySelector('#js-pref-split');
    if (splitRow) splitRow.addEventListener('click', function () {
      openPicker(root, 'js-split-sheet', 'js-pref-split-list',
        SPLITS.map(function (s) { return { value: s, label: s }; }),
        readPrefs().defaultSplit || 'Equal split',
        function (v) { setPref('defaultSplit', v); var el = root.querySelector('#js-pref-split-val'); if (el) el.textContent = v; });
    });
    var langRow = root.querySelector('#js-pref-language');
    if (langRow) langRow.addEventListener('click', function () {
      openPicker(root, 'js-language-sheet', 'js-pref-language-list',
        LANGUAGES.map(function (l) { return { value: l, label: l }; }),
        readPrefs().language || 'English',
        function (v) { setPref('language', v); var el = root.querySelector('#js-pref-language-val'); if (el) el.textContent = v; });
    });

    // Exchange rates: manual on-demand refresh (static fallback on failure).
    var ratesRow = root.querySelector('#js-pref-rates');
    if (ratesRow) ratesRow.addEventListener('click', function () {
      if (ratesRow._busy || typeof Store.refreshRates !== 'function') return;
      ratesRow._busy = true;
      var val = root.querySelector('#js-pref-rates-val');
      if (val) val.textContent = 'Updating\u2026';
      Store.refreshRates().then(function (res) {
        ratesRow._busy = false;
        if (val) val.textContent = res && res.ok ? 'Updated just now' : 'Couldn\u2019t update \u2014 using saved rates';
        // Reflect any new rate in the currency row label immediately.
        var cur = root.querySelector('#js-pref-currency-val');
        if (cur) cur.textContent = currencyLabel(readPrefs().currency || 'INR');
      });
    });

    // Sheet close buttons + backdrop clicks.
    root.querySelectorAll('[data-sheet-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeSheet(root, btn.getAttribute('data-sheet-close')); });
    });
    ['js-currency-sheet', 'js-split-sheet', 'js-language-sheet'].forEach(function (id) {
      var sheet = root.querySelector('#' + id);
      if (sheet) sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(root, id); });
    });

    // Log Out → confirm in-app (window.confirm is unreliable in standalone PWAs),
    // then clear the Supabase session and leave — navigating REGARDLESS of whether
    // signOut resolves, rejects, or hangs (the CDN lib / network revoke can stall
    // when launched from the home screen, which otherwise traps the user).
    var logoutRow = root.querySelector('.settings-row--logout');
    if (logoutRow) logoutRow.addEventListener('click', function () {
      confirmSheet({ title: 'Log out of Settlr?', confirmLabel: 'Log Out' }, function () {
        var go = function () { window.location.replace('/screens/login.html'); };
        var p = (window.SettlrAuth && SettlrAuth.signOut) ? SettlrAuth.signOut() : Promise.resolve();
        Promise.race([
          Promise.resolve(p),
          new Promise(function (r) { setTimeout(r, 1500); })
        ]).then(go, go);
      });
    });

    // Delete Account → wipe data → onboarding.
    var deleteRow = root.querySelector('.settings-row--destructive');
    if (deleteRow) deleteRow.addEventListener('click', function () {
      confirmSheet({
        title: 'Delete account?',
        body: 'Permanently delete your account and all data. This cannot be undone.',
        confirmLabel: 'Delete', danger: true
      }, function () {
        // Await server-side account deletion, then sign out, then leave.
        // Navigating before the request resolves would abort it (page unload).
        // Only proceed if the server confirmed the delete — otherwise surface
        // the failure so the user isn't told "deleted" while data survives.
        var done = function () { window.location.replace('/screens/welcome.html'); };
        var del = (typeof Store.deleteAllData === 'function')
          ? Store.deleteAllData() : Promise.resolve({ ok: true });
        Promise.resolve(del).then(function (res) {
          if (res && res.ok === false) {
            confirmSheet({
              title: 'Couldn’t delete account',
              body: 'Something went wrong deleting your account. Please check your connection and try again, or email support.',
              confirmLabel: 'OK'
            }, function () {});
            return;
          }
          var so = (window.SettlrAuth && SettlrAuth.signOut) ? SettlrAuth.signOut() : Promise.resolve();
          Promise.resolve(so).then(done, done);
        }, function () {
          confirmSheet({
            title: 'Couldn’t delete account',
            body: 'Something went wrong deleting your account. Please check your connection and try again, or email support.',
            confirmLabel: 'OK'
          }, function () {});
        });
      });
    });
  }

  /* In-app confirmation sheet — reuses the .sheet / .btn components so it works
     in standalone PWA mode where native window.confirm() is unreliable. Pure DOM:
     no native dialog. Tapping the overlay or Cancel dismisses; Confirm runs cb. */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function confirmSheet(opts, onConfirm) {
    var overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    overlay.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="js-settings-confirm-title">' +
        '<div class="sheet__handle"><div class="sheet__handle-bar"></div></div>' +
        '<div class="sheet__header"><span class="sheet__title" id="js-settings-confirm-title">' + esc(opts.title) + '</span></div>' +
        '<div class="sheet__content" style="display:flex; flex-direction:column; gap:var(--spacing-12); padding-bottom:var(--spacing-24)">' +
          (opts.body ? '<p class="text-body-sm" style="color:var(--text-secondary); margin:0">' + esc(opts.body) + '</p>' : '') +
          '<button type="button" class="btn btn--lg btn--full ' + (opts.danger ? 'btn--destructive' : 'btn--primary') + '" data-act="confirm"><span class="btn__content">' + esc(opts.confirmLabel || 'Confirm') + '</span></button>' +
          '<button type="button" class="btn btn--lg btn--full btn--ghost" data-act="cancel"><span class="btn__content">Cancel</span></button>' +
        '</div>' +
      '</div>';
    function close() { overlay.remove(); }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-act="cancel"]')) { close(); return; }
      if (e.target.closest('[data-act="confirm"]')) { close(); onConfirm(); }
    });
    document.body.appendChild(overlay);
    var cancelBtn = overlay.querySelector('[data-act="cancel"]');
    if (cancelBtn) cancelBtn.focus();
  }

  function onShow(root) {
    // Restore toggle state.
    var prefs = readPrefs();
    toggles(root).forEach(function (t) {
      if (prefs[t.key] != null) t.input.checked = !!prefs[t.key];
      t.control.setAttribute('aria-checked', t.input.checked ? 'true' : 'false');
    });
    restorePrefRows(root);
    populateProfile(root);
  }

  function onHide(root) {
    ['js-currency-sheet', 'js-split-sheet', 'js-language-sheet'].forEach(function (id) {
      var sheet = root.querySelector('#' + id);
      if (sheet) sheet.style.display = 'none';
    });
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('settings', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="settings"]');
      if (root) { init(root); onShow(root); }
    });
  }
})();
