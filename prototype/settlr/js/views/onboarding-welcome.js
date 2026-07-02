/* ============================================================
   Settlr — Onboarding welcome view module
   The post-signup first-run flow, merged from the approved review harness
   (screens/prototype.html) into the live compiled shell. Shown ONCE right after
   signup — welcome.html's "Let's Go!" enters via index.html#onboarding-welcome —
   then completing or skipping navigates to the real home-dashboard.

   Unlike the harness this is a real shell view: DOM lookups are scoped to `root`
   (the view <section>) and people added during onboarding persist as real
   contacts via Store.addContact, so they appear on home/people afterward.

   The view is a SINGLE conceptual screen (Welcome) with two sub-panels reached
   by interaction (Import result, Add-by-user-ID), swapped in-place by showPanel
   — NOT separate router views. Mock specifics (matched/unmatched import list,
   add-by-ID directory) are deferred to the Settlr-ID backend (see TODO.md).

   - init   : one-time wiring (disclosure, import/OS-prompt, add-by-ID search,
              invite copy/share, QR sheet, back carets) + hydrate invite/QR from
              the current user.
   - onShow : reset to the welcome panel, collapse the "more ways" disclosure,
              clear the search fields, close the QR sheet + OS prompt.
   - onHide : nothing persistent to tear down.
   ============================================================ */
(function () {
  'use strict';

  // Inline Phosphor SVGs (regular weight) — must match js/icons.js.
  var SVG_COPY  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/></svg>';
  var SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>';
  var SVG_PLUS  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>';
  function holderSm(svg) { return '<span class="icon-holder icon-holder--sm" aria-hidden="true">' + svg + '</span>'; }

  // Friends matched on contacts import (already on Settlr → auto-connected).
  // Mirror the markup in the import-result panel; persisted on Continue.
  var IMPORTED = [
    { name: 'Riya Sharma', phone: '+91 98765 43210', handle: '@riya' },
    { name: 'Aarav Mehta', phone: '+91 99201 55678', handle: '@aarav' },
    { name: 'Priya Patel', phone: '+91 98330 11223', handle: '@priya' },
    { name: 'Karan Singh', phone: '+91 97411 88990', handle: '@karan' },
    { name: 'Sneha Reddy', phone: '+91 90080 44556', handle: '@sneha' }
  ];
  function state(root) {
    if (!root._onbState) root._onbState = { copyTimers: {}, imported: false };
    return root._onbState;
  }

  // ── Navigate to the real app ────────────────────────────────
  function goHome() {
    if (window.SettlrRouterSPA && window.SettlrRouterSPA.navigate) {
      window.SettlrRouterSPA.navigate('home-dashboard');
    }
  }

  // ── Panel switching (interaction-driven, no tab bar) ────────
  function showPanel(root, name) {
    root.querySelectorAll('.onb-screen').forEach(function (el) {
      el.hidden = (el.getAttribute('data-screen') !== name);
    });
  }

  // ── Invite link / QR — hydrate from the current user ────────
  function inviteUrl() {
    var handle = 'divyansh';
    if (window.Store && Store.getCurrentUser) {
      var u = Store.getCurrentUser() || {};
      if (u.handle) handle = String(u.handle).replace(/^@/, '');
    }
    return location.origin + '/invite/' + handle;
  }
  // Display form of the invite URL (no scheme), e.g. "settlrapp.in/invite/divyansh".
  function inviteDisplay(handle) {
    return location.origin.replace(/^https?:\/\//, '') + '/invite/' + handle;
  }
  function hydrateInvite(root) {
    if (!(window.Store && Store.getCurrentUser)) return;
    var u = Store.getCurrentUser() || {};
    var handle = u.handle ? String(u.handle).replace(/^@/, '') : 'divyansh';
    var urlEl = root.querySelector('#js-onb-invite-url');
    if (urlEl) urlEl.textContent = inviteDisplay(handle);
    var nameEl = root.querySelector('#js-onb-qr-name');
    if (nameEl && u.name) nameEl.textContent = u.name;
    var subEl = root.querySelector('#js-onb-qr-sub');
    if (subEl) {
      var parts = ['@' + handle];
      if (u.phone) parts.push(u.phone);
      subEl.textContent = parts.join(' · ');
    }
    // Generate the per-user QR image (offline, via SettlrQR) from the invite URL.
    var img = root.querySelector('#js-onb-qr-img');
    if (img && window.SettlrQR) {
      var uri = SettlrQR.svgDataUri(inviteUrl());
      if (uri) img.src = uri;
    }
  }

  // ── Copy / Share ────────────────────────────────────────────
  function doCopy(root, btn) {
    if (navigator.clipboard) navigator.clipboard.writeText(inviteUrl()).catch(function () {});
    if (!btn) return;
    var s = state(root);
    btn.innerHTML = holderSm(SVG_CHECK);
    btn.setAttribute('aria-label', 'Copied');
    var id = btn.id;
    if (s.copyTimers[id]) clearTimeout(s.copyTimers[id]);
    s.copyTimers[id] = setTimeout(function () {
      btn.innerHTML = holderSm(SVG_COPY);
      btn.setAttribute('aria-label', 'Copy invite link');
    }, 2000);
  }
  // Native share when available; otherwise copy. The fallback flips the inline
  // copy icon (copyBtn) if given — NEVER the Share .btn itself (overwriting its
  // innerHTML would collapse the label/icon). With no copyBtn it copies silently.
  function doShare(root, copyBtn) {
    var data = { title: 'Settlr', text: 'Split expenses with me on Settlr', url: inviteUrl() };
    if (navigator.share) navigator.share(data).catch(function () {});
    else doCopy(root, copyBtn || null);
  }
  function wireInvite(root) {
    var copyLink = root.querySelector('#js-onb-copy-link');
    if (copyLink) copyLink.addEventListener('click', function () { doCopy(root, copyLink); });

    var hint = root.querySelector('#js-onb-sharehint');
    var shareLink = root.querySelector('#js-onb-share-link');
    if (shareLink) shareLink.addEventListener('click', function () {
      doShare(root, copyLink); // fallback flips the inline copy icon, not the Share btn
      if (hint) hint.hidden = false;
    });

    var shareQr = root.querySelector('#js-onb-qr-share');
    if (shareQr) shareQr.addEventListener('click', function () { doShare(root, null); });

    // Unmatched-contact "Invite" rows share the same link.
    root.querySelectorAll('.js-onb-invite-row').forEach(function (b) {
      b.addEventListener('click', function () { doShare(root, null); });
    });
  }

  // ── Real Contact Picker → render the actual picks ──────────
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function initialsOf(name) {
    var parts = String(name || '').trim().split(/\s+/);
    var a = parts[0] ? parts[0][0] : '';
    var b = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return ((a + b).toUpperCase()) || '?';
  }
  // Last-10-digit canonical form — mirrors Store._normalizePhone + the server-side
  // normalization in find_users_by_phones, so a pick maps back to its match_phone.
  function normPhone(raw) { return String(raw == null ? '' : raw).replace(/\D/g, '').slice(-10); }

  function personRow(name, sub) {
    return '<div class="person-item">' +
      '<div class="avatar avatar--initials avatar--md">' + escapeHtml(initialsOf(name)) + '</div>' +
      '<div class="person-item__text">' +
        '<p class="person-item__name text-title-sm">' + escapeHtml(name) + '</p>' +
        (sub ? '<p class="person-item__subtext text-body-xs">' + escapeHtml(sub) + '</p>' : '') +
      '</div>' +
    '</div>';
  }
  // Render the import result split into two sections: people already on Settlr
  // (auto-connected on Continue) and people to invite. Reads s.matched / s.unmatched.
  function renderImport(root) {
    var s = state(root);
    var list = root.querySelector('#js-onb-import-list');
    if (!list) return;
    var matched = s.matched || [], unmatched = s.unmatched || [];
    var html = '';
    if (matched.length) {
      html += '<div class="heading"><span class="heading__title text-heading-md">On Settlr</span></div>';
      html += matched.map(function (m) {
        return personRow(m.name || m.handle, m.handle ? '@' + String(m.handle).replace(/^@/, '') : m.phone);
      }).join('');
    }
    if (unmatched.length) {
      html += '<div class="heading"><span class="heading__title text-heading-md">Invite to Settlr</span></div>';
      html += unmatched.map(function (u) { return personRow(u.name, u.phone); }).join('');
    }
    if (!matched.length && !unmatched.length) {
      html = '<p class="onb-noresult text-body-sm">No contacts selected.</p>';
    }
    list.innerHTML = html;
    var summary = root.querySelector('.onb-import-summary');
    if (summary) {
      var parts = [];
      if (matched.length) parts.push(matched.length + ' on Settlr');
      if (unmatched.length) parts.push(unmatched.length + ' to invite');
      summary.textContent = parts.join(' · ') || 'No contacts added';
    }
  }
  // Partition real picked contacts into matched (registered) vs unmatched, using
  // the batch phone-match results keyed by normalized phone.
  function processPicks(root, mapped, results) {
    var s = state(root);
    var byPhone = {};
    (results || []).forEach(function (r) { if (r.phone) byPhone[r.phone] = r; });
    var matched = [], unmatched = [];
    mapped.forEach(function (c) {
      var prof = byPhone[normPhone(c.phone)];
      if (prof && prof.id) {
        matched.push({ id: prof.id, name: prof.name || c.name, handle: prof.handle, photo: prof.photo, phone: c.phone });
      } else {
        unmatched.push({ name: c.name, phone: c.phone });
      }
    });
    s.isMock = false; s.matched = matched; s.unmatched = unmatched;
    renderImport(root);
  }
  // Desktop / no-picker / nothing-picked fallback — show the mock matched set for
  // visual parity (mocks have no real profile id, so they persist via addContact).
  function loadMock(root) {
    var s = state(root);
    s.isMock = true; s.matched = IMPORTED.slice(); s.unmatched = []; s.picked = null;
    renderImport(root);
  }

  // ── Import from Contacts → OS prompt → result → persist → home ──
  function openOsPrompt(root) {
    var p = root.querySelector('#js-onb-os-prompt');
    if (p) p.hidden = false;
  }
  function closeOsPrompt(root) {
    var p = root.querySelector('#js-onb-os-prompt');
    if (p) p.hidden = true;
  }
  function grantContacts(root) {
    closeOsPrompt(root);
    // Real Contact Picker only on Chrome-Android over HTTPS. When it returns real
    // contacts we phone-match them against registered users (matched → auto-connect,
    // unmatched → invite); otherwise we fall back to the mock list.
    if (navigator.contacts && navigator.contacts.select) {
      navigator.contacts.select(['name', 'tel'], { multiple: true })
        .then(function (picked) {
          var mapped = (picked || []).map(function (c) {
            return { name: (c.name && c.name[0]) || '', phone: (c.tel && c.tel[0]) || '' };
          }).filter(function (c) { return c.name; });
          showPanel(root, 'import');
          if (mapped.length && window.Store && Store.findUsersByPhones) {
            state(root).picked = mapped;
            Store.findUsersByPhones(mapped.map(function (c) { return c.phone; }))
              .then(function (results) { processPicks(root, mapped, results); });
          } else {
            loadMock(root);
          }
        })
        .catch(function () { showPanel(root, 'import'); loadMock(root); });
    } else {
      showPanel(root, 'import');
      loadMock(root);
    }
  }
  function wireImport(root) {
    root.querySelectorAll('.js-onb-import').forEach(function (el) {
      el.addEventListener('click', function () { openOsPrompt(root); });
    });
    var allow = root.querySelector('#js-onb-os-allow');
    var deny  = root.querySelector('#js-onb-os-deny');
    var prompt = root.querySelector('#js-onb-os-prompt');
    if (allow) allow.addEventListener('click', function () { grantContacts(root); });
    if (deny) deny.addEventListener('click', function () { closeOsPrompt(root); });
    if (prompt) prompt.addEventListener('click', function (e) {
      if (e.target === prompt) closeOsPrompt(root);
    });
    var cont = root.querySelector('#js-onb-import-continue');
    if (cont) cont.addEventListener('click', function () {
      var s = state(root);
      if (!s.imported && window.Store) {
        if (s.isMock) {
          // Mock matches have no real profile id → persist as on-Settlr contacts.
          if (Store.addContact) IMPORTED.forEach(function (f) {
            Store.addContact({ name: f.name, phone: f.phone, handle: f.handle, onSettlr: true });
          });
        } else {
          // Real matches auto-connect (open consent); the rest become plain contacts.
          (s.matched || []).forEach(function (m) { if (m.id && Store.connect) Store.connect(m); });
          (s.unmatched || []).forEach(function (u) { if (Store.addContact) Store.addContact({ name: u.name, phone: u.phone }); });
        }
        s.imported = true;
      }
      goHome();
    });
  }

  // ── Add by user ID (dedicated panel — real handle lookup) ───
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function useridRow(p) {
    var name = p.name || p.handle || '';
    var initials = (name.trim().split(/\s+/).map(function (x) { return x[0] || ''; }).slice(0, 2).join('') || '?').toUpperCase();
    var avatar = p.photo
      ? '<div class="avatar avatar--md"><img src="' + escapeHtml(p.photo) + '" alt=""></div>'
      : '<div class="avatar avatar--initials avatar--md">' + escapeHtml(initials) + '</div>';
    return '<div class="person-item" data-uid="' + escapeHtml(p.id) + '">' +
      avatar +
      '<div class="person-item__text">' +
        '<p class="person-item__name text-title-sm">' + escapeHtml(name) + '</p>' +
        '<p class="person-item__subtext text-body-xs">@' + escapeHtml(p.handle || '') + '</p>' +
      '</div>' +
      '<div class="person-item__action">' +
        '<button type="button" class="btn btn--primary btn--sm js-onb-userid-add">' +
          '<span class="btn__content"><span class="btn__icon">' + holderSm(SVG_PLUS) + '</span>' +
          '<span class="btn__label text-title-xs">Add</span></span></button>' +
      '</div>' +
    '</div>';
  }
  function wireUserId(root) {
    var input  = root.querySelector('#js-onb-userid-search');
    var result = root.querySelector('#js-onb-userid-result');
    if (!input || !result) return;
    var s = state(root);
    input.addEventListener('input', function () {
      var q = input.value.trim().replace(/^@/, '');
      if (s.useridTimer) clearTimeout(s.useridTimer);
      if (!q) { result.innerHTML = ''; return; }
      s.useridTimer = setTimeout(function () {
        if (!(window.Store && Store.findUserByHandle)) { result.innerHTML = ''; return; }
        var token = (s.useridToken = (s.useridToken || 0) + 1);
        Store.findUserByHandle(q).then(function (profile) {
          if (s.useridToken !== token) return; // stale keystroke
          if (!profile || !profile.id) {
            result.innerHTML = '<p class="onb-noresult text-body-sm">No one found with that ID. Double-check it, or invite them instead.</p>';
            return;
          }
          result.innerHTML = useridRow(profile);
          var btn = result.querySelector('.js-onb-userid-add');
          if (btn) btn.addEventListener('click', function () {
            if (window.Store && Store.connect) Store.connect(profile);
            goHome();
          });
        });
      }, 300);
    });
  }

  // ── Show my QR (bottom sheet) ───────────────────────────────
  function closeSheet(root) {
    var sheet = root.querySelector('#js-onb-qr-sheet');
    if (!sheet) return;
    if (window.SettlrSheetDrag && window.SettlrSheetDrag.close) {
      window.SettlrSheetDrag.close(sheet, function () { sheet.hidden = true; });
    } else {
      sheet.hidden = true;
    }
  }
  function wireQrSheet(root) {
    var sheet = root.querySelector('#js-onb-qr-sheet');
    var open  = root.querySelector('#js-onb-view-qr');
    var close = root.querySelector('#js-onb-qr-close');
    if (open) open.addEventListener('click', function () { if (sheet) sheet.hidden = false; });
    if (close) close.addEventListener('click', function () { closeSheet(root); });
    if (sheet) sheet.addEventListener('click', function (e) {
      if (e.target === sheet) closeSheet(root); // tap the dimmed backdrop
    });
  }

  // ── Back caret (light-DOM link in settlr-top-app-bar) ───────
  // The bar renders back="#" → <a href="#">; the SPA router intercept returns
  // early on '#' hrefs, so it never hijacks these — we own them here and swap
  // the in-view sub-panel back to its data-back target instead.
  function wireBack(root) {
    root.querySelectorAll('.top-app-bar__back').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var bar = link.closest('settlr-top-app-bar');
        var target = bar && bar.getAttribute('data-back');
        if (target) showPanel(root, target);
      });
    });
  }

  // ── data-go jumps (welcome CTAs) ────────────────────────────
  function wireGo(root) {
    root.querySelectorAll('[data-go]').forEach(function (el) {
      el.addEventListener('click', function () { showPanel(root, el.getAttribute('data-go')); });
    });
  }

  // ── "More ways" disclosure + skip ───────────────────────────
  function collapseMore(root) {
    var toggle = root.querySelector('#js-onb-more');
    var panel  = root.querySelector('#js-onb-more-panel');
    if (panel) panel.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  function wireMore(root) {
    var toggle = root.querySelector('#js-onb-more');
    var panel  = root.querySelector('#js-onb-more-panel');
    if (toggle && panel) toggle.addEventListener('click', function () {
      var open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    var skip = root.querySelector('#js-onb-skip');
    if (skip) skip.addEventListener('click', goHome);
  }

  // ── Search filter over the imported contact list ────────────
  function applyImportFilter(root, q) {
    var list = root.querySelector('#js-onb-import-list');
    if (!list) return;
    var query = (q || '').trim().toLowerCase();
    var visible = 0;
    list.querySelectorAll('.person-item').forEach(function (row) {
      var nameEl = row.querySelector('.person-item__name');
      var subEl  = row.querySelector('.person-item__subtext');
      var hay = ((nameEl ? nameEl.textContent : '') + ' ' +
                 (subEl ? subEl.textContent : '')).toLowerCase();
      var show = (!query || hay.indexOf(query) !== -1);
      row.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    var empty = list.querySelector('#js-onb-import-empty');
    if (empty) empty.hidden = visible !== 0;
    list.querySelectorAll('.heading').forEach(function (h) {
      var any = false, el = h.nextElementSibling;
      while (el && !el.classList.contains('heading')) {
        if (el.classList.contains('person-item') && el.style.display !== 'none') { any = true; break; }
        el = el.nextElementSibling;
      }
      h.style.display = any ? '' : 'none';
    });
  }
  function wireImportSearch(root) {
    var input = root.querySelector('#js-onb-import-search');
    if (!input) return;
    input.addEventListener('input', function () { applyImportFilter(root, input.value); });
  }

  // ── Lifecycle ──────────────────────────────────────────────
  function init(root) {
    wireGo(root);
    wireMore(root);
    wireInvite(root);
    wireImport(root);
    wireUserId(root);
    wireQrSheet(root);
    wireBack(root);
    wireImportSearch(root);
    hydrateInvite(root);
  }

  function onShow(root) {
    var s = state(root);
    s.picked = null; // fresh import each activation
    // Reset copy icons left in the "copied" state by a prior show.
    Object.keys(s.copyTimers).forEach(function (id) { clearTimeout(s.copyTimers[id]); });
    s.copyTimers = {};
    var copyBtn = root.querySelector('#js-onb-copy-link');
    if (copyBtn) { copyBtn.innerHTML = holderSm(SVG_COPY); copyBtn.setAttribute('aria-label', 'Copy invite link'); }

    hydrateInvite(root);
    collapseMore(root);
    closeOsPrompt(root);
    closeSheet(root);

    var hint = root.querySelector('#js-onb-sharehint');
    if (hint) hint.hidden = true;
    var uidIn = root.querySelector('#js-onb-userid-search');
    if (uidIn) uidIn.value = '';
    var uidRes = root.querySelector('#js-onb-userid-result');
    if (uidRes) uidRes.innerHTML = '';
    var impIn = root.querySelector('#js-onb-import-search');
    if (impIn) impIn.value = '';
    applyImportFilter(root, '');

    showPanel(root, 'welcome');
  }

  function onHide(root) {
    var s = state(root);
    Object.keys(s.copyTimers).forEach(function (id) { clearTimeout(s.copyTimers[id]); });
    s.copyTimers = {};
    closeOsPrompt(root);
    closeSheet(root);
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('onboarding-welcome', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="onboarding-welcome"]');
      if (root) { init(root); onShow(root); }
    });
  }
})();
