/* ============================================================
   Settlr — Add Friend view module
   Former inline <script> from screens/add-friend.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views.

   The original screen exposed two globals (copyLink / toggleAdd) invoked via
   inline onclick. Here they become root-scoped listeners wired once in init().
   Behavior is identical: Copy flips the button to a check + "Copied!" for 2s,
   the suggested "+ Add" buttons toggle to "✓ Added", and the search box filters
   the rendered contact rows. Because the shell drops icon-upgrade.js, the icon
   swapped in by Copy is injected as the same inline Phosphor SVG used elsewhere.

   - init   : one-time wiring of copy / add / share / search behavior, and a
              snapshot of each filterable row's original innerHTML so onShow can
              fully reset the list before re-filtering.
   - onShow : resets every contact/invite row to its captured state (clears any
              prior "Copied!"/"✓ Added"/filter-hidden state) and re-applies an
              empty filter so navigating back always shows the full list.
   - onHide : nothing persistent to tear down.
   ============================================================ */
(function () {
  'use strict';

  // Inline Phosphor 'check' / 'copy' SVG paths (regular weight) — must match
  // js/icons.js so the inline copy-icon swap is visually correct in the shell.
  var SVG_COPY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/></svg>';
  var SVG_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>';
  var SVG_PLUS = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>';
  function holderSm(svg) {
    return '<span class="icon-holder icon-holder--sm" aria-hidden="true">' + svg + '</span>';
  }

  // Per-user invite URL, derived from the current user's Settlr ID (handle).
  // Falls back to 'divyansh' only if the Store/handle is somehow unavailable.
  function currentHandle() {
    if (window.Store && Store.getCurrentUser) {
      var u = Store.getCurrentUser() || {};
      if (u.handle) return String(u.handle).replace(/^@/, '');
    }
    return 'divyansh';
  }
  function inviteUrl() { return 'https://settlr.app/invite/' + currentHandle(); }

  function state(root) {
    if (!root._addFriendState) root._addFriendState = { rows: [], copyTimer: null };
    return root._addFriendState;
  }

  // Fill the invite-link text, the QR-sheet id label, and generate the per-user
  // QR image from the invite URL (offline, via SettlrQR). Safe to call repeatedly.
  function hydrateInvite(root) {
    var handle = currentHandle();
    var urlEl = root.querySelector('#js-af-invite-url');
    if (urlEl) urlEl.textContent = 'settlr.app/invite/' + handle;
    var idEl = root.querySelector('#js-af-qr-id');
    if (idEl) idEl.textContent = '@' + handle;
    var img = root.querySelector('#js-af-qr-img');
    if (img && window.SettlrQR) {
      var uri = SettlrQR.svgDataUri(inviteUrl());
      if (uri) img.src = uri;
    }
  }

  // ── Copy invite link (inline icon in the link field) ──────
  function doCopy(root) {
    var btn = root.querySelector('#js-copy-link');
    var s = state(root);
    if (navigator.clipboard) navigator.clipboard.writeText(inviteUrl());
    if (btn) {
      btn.innerHTML = holderSm(SVG_CHECK);
      btn.setAttribute('aria-label', 'Copied');
      if (s.copyTimer) clearTimeout(s.copyTimer);
      s.copyTimer = setTimeout(function () {
        btn.innerHTML = holderSm(SVG_COPY);
        btn.setAttribute('aria-label', 'Copy invite link');
      }, 2000);
    }
  }
  function wireCopy(root) {
    var btn = root.querySelector('#js-copy-link');
    if (btn) btn.addEventListener('click', function () { doCopy(root); });
  }

  // ── Share (native OS share sheet; falls back to copy) ─────
  function doShare(root) {
    var data = { title: 'Settlr', text: 'Split expenses with me on Settlr', url: inviteUrl() };
    if (navigator.share) {
      navigator.share(data).catch(function () {}); // user dismiss → ignore
    } else {
      doCopy(root); // no Web Share API → copy the link instead
    }
  }
  function wireShare(root) {
    var btn = root.querySelector('#js-share-link');
    if (btn) btn.addEventListener('click', function () { doShare(root); });
  }

  // ── QR overlay (minimal placeholder; tap card or eye to open) ──
  function openQr(root) {
    var ov = root.querySelector('#js-qr-overlay');
    if (ov) ov.hidden = false;
  }
  function closeQr(root) {
    var ov = root.querySelector('#js-qr-overlay');
    if (!ov) return;
    if (window.SettlrSheetDrag && window.SettlrSheetDrag.close) {
      window.SettlrSheetDrag.close(ov, function () { ov.hidden = true; });
    } else {
      ov.hidden = true;
    }
  }
  function wireQr(root) {
    var card = root.querySelector('#js-qr-card');
    var overlay = root.querySelector('#js-qr-overlay');
    if (card) card.addEventListener('click', function () { openQr(root); });
    if (overlay) {
      var close = overlay.querySelector('#js-qr-close');
      var share = overlay.querySelector('#js-qr-share');
      if (close) close.addEventListener('click', function () { closeQr(root); });
      if (share) share.addEventListener('click', function () { doShare(root); });
      // Backdrop tap (outside the sheet) closes the overlay.
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeQr(root);
      });
    }
  }

  // ── Suggested "+ Add" toggle ───────────────────────────────
  // Swaps the icon-holder glyph (plus ↔ check) and the label ("Add" ↔ "Added")
  // rather than rewriting textContent, so the icon stays inside .icon-holder.
  function setAdd(btn, added) {
    var holder = btn.querySelector('.icon-holder');
    var label = btn.querySelector('.btn__label');
    btn.classList.toggle('btn--added', added);
    if (holder) holder.innerHTML = added ? SVG_CHECK : SVG_PLUS;
    if (label) label.textContent = added ? 'Added' : 'Add';
  }
  function wireAdd(root) {
    root.querySelectorAll('.js-add-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setAdd(btn, !btn.classList.contains('btn--added'));
      });
    });
  }

  // ── Search filter over the rendered contact/invite rows ────
  function applyFilter(root, q) {
    var query = (q || '').trim().toLowerCase();
    var visible = 0;
    state(root).rows.forEach(function (row) {
      var nameEl = row.querySelector('.person-item__name');
      var subEl  = row.querySelector('.person-item__subtext');
      var hay = ((nameEl ? nameEl.textContent : '') + ' ' +
                 (subEl ? subEl.textContent : '')).toLowerCase();
      var show = (!query || hay.indexOf(query) !== -1);
      row.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    // Hide the section headings when their list is fully filtered out, and show
    // a single no-results message when nothing matches.
    root.querySelectorAll('.heading').forEach(function (h) {
      var any = false, el = h.nextElementSibling;
      if (el && !el.classList.contains('heading')) {
        any = !!el.querySelector('.person-item:not([style*="display: none"])');
      }
      h.style.display = (!query || any) ? '' : 'none';
    });
    var empty = root.querySelector('#js-af-no-results');
    if (empty) empty.hidden = !(query && visible === 0);
  }

  // ── Real add-by-Settlr-ID search (registered users via RPC) ──
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Build a result row for a found registered user, with an Add → connect button.
  function renderResult(root, profile) {
    var name = profile.name || profile.handle || '';
    var initials = (name.trim().split(/\s+/).map(function (p) { return p[0] || ''; }).slice(0, 2).join('') || '?').toUpperCase();
    var avatar = profile.photo
      ? '<div class="avatar avatar--md"><img src="' + escapeHtml(profile.photo) + '" alt=""></div>'
      : '<div class="avatar avatar--initials avatar--md">' + escapeHtml(initials) + '</div>';
    var row = document.createElement('div');
    row.className = 'person-item';
    row.innerHTML = avatar +
      '<div class="person-item__text">' +
        '<p class="person-item__name text-title-sm">' + escapeHtml(name) + '</p>' +
        '<p class="person-item__subtext text-body-xs">@' + escapeHtml(profile.handle || '') + '</p>' +
      '</div>' +
      '<div class="person-item__action">' +
        '<button class="btn btn--primary btn--sm js-result-add" type="button">' +
          '<span class="btn__content">' +
            '<span class="btn__icon">' + holderSm(SVG_PLUS) + '</span>' +
            '<span class="btn__label text-title-xs">Add</span>' +
          '</span>' +
        '</button>' +
      '</div>';
    var btn = row.querySelector('.js-result-add');
    btn.addEventListener('click', function () {
      if (btn.classList.contains('btn--added')) return;
      if (window.Store && Store.connect) Store.connect(profile);
      setAdd(btn, true);
    });
    return row;
  }

  function clearResults(root) {
    var box = root.querySelector('#js-af-search-results');
    var list = root.querySelector('#js-af-search-list');
    if (list) list.innerHTML = '';
    if (box) box.hidden = true;
  }

  function runHandleSearch(root, q) {
    var box = root.querySelector('#js-af-search-results');
    var list = root.querySelector('#js-af-search-list');
    if (!box || !list) return;
    var handle = (q || '').trim().replace(/^@/, '');
    if (!handle || !(window.Store && Store.findUserByHandle)) { clearResults(root); return; }
    var token = (state(root).searchToken = (state(root).searchToken || 0) + 1);
    Store.findUserByHandle(handle).then(function (profile) {
      // Ignore out-of-order responses from a stale keystroke.
      if (state(root).searchToken !== token) return;
      list.innerHTML = '';
      if (profile && profile.id) {
        // Don't offer to add someone already in the address book.
        var already = (window.Store && Store.getContact && Store.getContact(profile.id));
        var row = renderResult(root, profile);
        if (already) {
          var btn = row.querySelector('.js-result-add');
          if (btn) setAdd(btn, true);
        }
        list.appendChild(row);
        box.hidden = false;
      } else {
        box.hidden = true;
      }
    });
  }

  function wireSearch(root) {
    var input = root.querySelector('.search-input input');
    if (!input) return;
    input.addEventListener('input', function () {
      applyFilter(root, input.value);
      var s = state(root);
      if (s.searchTimer) clearTimeout(s.searchTimer);
      s.searchTimer = setTimeout(function () { runHandleSearch(root, input.value); }, 300);
    });
  }

  // ── New-contact inline form ────────────────────────────────
  function wireNewContact(root) {
    var nameEl  = root.querySelector('#js-nc-name');
    var phoneEl = root.querySelector('#js-nc-phone');
    var errEl   = root.querySelector('#js-nc-error');
    var saveEl  = root.querySelector('#js-nc-save');
    if (!saveEl || saveEl._wired) return;
    saveEl._wired = true;
    saveEl.addEventListener('click', function () {
      var name = (nameEl && nameEl.value || '').trim();
      if (!name) { if (errEl) errEl.hidden = false; if (nameEl) nameEl.focus(); return; }
      if (errEl) errEl.hidden = true;
      var digits = (phoneEl && phoneEl.value || '').replace(/\D/g, '');
      var contact = { name: name };
      if (digits) contact.phone = '+91 ' + digits;
      if (window.Store && Store.addContact) Store.addContact(contact);
      // Feedback: clear the fields + briefly flip the button label.
      if (nameEl) nameEl.value = '';
      if (phoneEl) phoneEl.value = '';
      var lbl = saveEl.querySelector('.btn__label');
      if (lbl) {
        var orig = lbl.textContent;
        lbl.textContent = 'Added \u2713';
        if (saveEl._fbTimer) clearTimeout(saveEl._fbTimer);
        saveEl._fbTimer = setTimeout(function () { lbl.textContent = orig; }, 1500);
      }
      if (nameEl) nameEl.focus();
    });
  }
  function resetNewContact(root) {
    var nameEl  = root.querySelector('#js-nc-name');
    var phoneEl = root.querySelector('#js-nc-phone');
    var errEl   = root.querySelector('#js-nc-error');
    if (nameEl) nameEl.value = '';
    if (phoneEl) phoneEl.value = '';
    if (errEl) errEl.hidden = true;
  }

  // ── Lifecycle ──────────────────────────────────────────────
  function init(root, params) {
    var s = state(root);
    // Snapshot each filterable contact row so onShow can fully reset it.
    s.rows = Array.prototype.slice.call(root.querySelectorAll('.person-item'));
    wireCopy(root);
    wireShare(root);
    wireQr(root);
    wireAdd(root);
    wireSearch(root);
    wireNewContact(root);
  }

  function onShow(root, params) {
    var s = state(root);
    // Reset the inline copy icon if a previous show left it in the "copied" state.
    if (s.copyTimer) { clearTimeout(s.copyTimer); s.copyTimer = null; }
    var copyBtn = root.querySelector('#js-copy-link');
    if (copyBtn) { copyBtn.innerHTML = holderSm(SVG_COPY); copyBtn.setAttribute('aria-label', 'Copy invite link'); }

    // Reset each "+ Add" toggle and clear any filter-hidden rows before rebuild.
    s.rows.forEach(function (row) {
      row.style.display = '';
      var btn = row.querySelector('.js-add-btn');
      if (btn) setAdd(btn, false);
    });

    // Reset the search field + re-apply an empty filter (full list).
    var input = root.querySelector('.search-input input');
    if (input) input.value = '';
    applyFilter(root, '');
    if (s.searchTimer) { clearTimeout(s.searchTimer); s.searchTimer = null; }
    clearResults(root);

    // Fill the per-user invite link + generate the QR from it.
    hydrateInvite(root);

    // Always start with the QR overlay closed.
    closeQr(root);

    // Clear the new-contact form each show.
    resetNewContact(root);
  }

  function onHide(root) {
    var s = state(root);
    if (s.copyTimer) { clearTimeout(s.copyTimer); s.copyTimer = null; }
    if (s.searchTimer) { clearTimeout(s.searchTimer); s.searchTimer = null; }
    closeQr(root);
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('add-friend', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="add-friend"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
