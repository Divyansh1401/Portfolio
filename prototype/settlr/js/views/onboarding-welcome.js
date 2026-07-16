/* ============================================================
   Settlr — Onboarding welcome view module
   The post-signup first-run flow, merged from the approved review harness
   (screens/prototype.html) into the live compiled shell. Shown ONCE right after
   signup — welcome.html's "Let's Go!" enters via index.html#onboarding-welcome —
   then completing or skipping navigates to the real home-dashboard.

   Phase 0 (de-phone): phone-contact import is removed. The welcome panel now
   offers three ways to add people — by Settlr ID (handle), invite link, and QR —
   with no OS contacts access. (Email connect + invite tokens arrive in later phases.)

   - init   : one-time wiring (add-by-ID search, invite copy/share, QR sheet, back
              carets, skip) + hydrate invite/QR from the current user.
   - onShow : reset to the welcome panel, clear the search field, close the QR sheet.
   - onHide : clear copy timers, close the sheet.
   ============================================================ */
(function () {
  'use strict';

  // Inline Phosphor SVGs (regular weight) — must match js/icons.js.
  var SVG_COPY  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/></svg>';
  var SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>';
  var SVG_PLUS  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>';
  function holderSm(svg) { return '<span class="icon-holder icon-holder--sm" aria-hidden="true">' + svg + '</span>'; }

  function state(root) {
    if (!root._onbState) root._onbState = { copyTimers: {} };
    return root._onbState;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
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
    if (subEl) subEl.textContent = '@' + handle;
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
  }

  // ── Add by user ID (dedicated panel — real handle lookup) ───
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
      var raw = input.value.trim();
      var stripped = raw.replace(/^@/, '');
      if (s.useridTimer) clearTimeout(s.useridTimer);
      if (!stripped) { result.innerHTML = ''; return; }
      s.useridTimer = setTimeout(function () {
        if (!window.Store) { result.innerHTML = ''; return; }
        // '@' left after stripping a leading '@' → email; otherwise a handle.
        var isEmail = stripped.indexOf('@') !== -1;
        var lookup = isEmail
          ? (Store.findUserByEmail ? Store.findUserByEmail(raw) : Promise.resolve(null))
          : (Store.findUserByHandle ? Store.findUserByHandle(stripped) : Promise.resolve(null));
        var token = (s.useridToken = (s.useridToken || 0) + 1);
        lookup.then(function (profile) {
          if (s.useridToken !== token) return; // stale keystroke
          if (!profile || !profile.id) {
            result.innerHTML = '<p class="onb-noresult text-body-sm">No one found. Double-check the email or ID, or invite them instead.</p>';
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

  // ── Skip ("I'll do this later") ─────────────────────────────
  function wireSkip(root) {
    var skip = root.querySelector('#js-onb-skip');
    if (skip) skip.addEventListener('click', goHome);
  }

  // ── Lifecycle ──────────────────────────────────────────────
  function init(root) {
    wireGo(root);
    wireSkip(root);
    wireInvite(root);
    wireUserId(root);
    wireQrSheet(root);
    wireBack(root);
    hydrateInvite(root);
  }

  function onShow(root) {
    var s = state(root);
    // Reset copy icons left in the "copied" state by a prior show.
    Object.keys(s.copyTimers).forEach(function (id) { clearTimeout(s.copyTimers[id]); });
    s.copyTimers = {};
    var copyBtn = root.querySelector('#js-onb-copy-link');
    if (copyBtn) { copyBtn.innerHTML = holderSm(SVG_COPY); copyBtn.setAttribute('aria-label', 'Copy invite link'); }

    hydrateInvite(root);
    closeSheet(root);

    var hint = root.querySelector('#js-onb-sharehint');
    if (hint) hint.hidden = true;
    var uidIn = root.querySelector('#js-onb-userid-search');
    if (uidIn) uidIn.value = '';
    var uidRes = root.querySelector('#js-onb-userid-result');
    if (uidRes) uidRes.innerHTML = '';

    showPanel(root, 'welcome');
  }

  function onHide(root) {
    var s = state(root);
    Object.keys(s.copyTimers).forEach(function (id) { clearTimeout(s.copyTimers[id]); });
    s.copyTimers = {};
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
