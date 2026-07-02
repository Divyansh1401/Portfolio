/* ============================================================
   Settlr — Edit Group view module
   Former inline IIFE from screens/edit-group.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views. The group id comes
   from `params.id` (router) with a fallback to the URL query string for
   standalone use of screens/edit-group.html; an invalid id sends the user home.

   COMPLEX-SCREEN NOTES
   • Emoji sheet stays GLOBAL: ss-edit-group-emoji.html loads edit-group.html in
     an <iframe> and opens the picker via
     `iframe.contentDocument.getElementById('js-emoji-overlay').classList.add('is-open')`.
     To keep that working — and to expose a clean programmatic entry point —
     openEmojiSheet()/closeEmojiSheet() are assigned to `window.` (re-bound to the
     active root each show). Sheets are local overlays, not routes.
   • onShow repopulates the form (name, emoji/avatar) from Store every show and
     rebuilds the member list from Store before re-wiring, so back-navigation
     reflects the latest state and never stacks duplicated rows/listeners.
   • Save commits to Store (guarded against double-save) then navigates back to
     the group. Cross-screen nav goes through SettlrRouterSPA.navigate when the
     SPA router is present, else the original href/location.
   ============================================================ */
(function () {
  'use strict';

  /* Inline icon SVGs that were formerly emitted by JS / lived in markup, kept
     here as constants so no font-icon machinery is needed. (Currently the
     rebuilt member rows reuse the X glyph for the remove button.) */
  var ICON_X = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>';

  function resolveId(root, params) {
    if (params && params.id) return params.id;
    return new URLSearchParams(location.search).get('id') || 'goa-trip';
  }

  // ── Default-currency picker (mirrors add-amount's currency sheet) ──
  // The selected code lives on root._egCurrency; onShow seeds it from the group.
  function currencyByCode(code) {
    var opts = Store.currencyOptions();
    return opts.find(function (c) { return c.code === code; }) || opts[0];
  }
  function applyCurrency(root, cur) {
    if (!cur) return;
    root._egCurrency = cur.code;
    var label = root.querySelector('#js-eg-currency-label');
    if (label) label.textContent = cur.symbol + ' ' + cur.code;
  }
  function openCurrencySheet(root) {
    var list = root.querySelector('#js-eg-currency-list');
    var sel = root._egCurrency;
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
    root.querySelector('#egCurrencySheet').style.display = 'flex';
  }
  function closeCurrencySheet(root) {
    var sheet = root.querySelector('#egCurrencySheet');
    if (window.SettlrSheetDrag && window.SettlrSheetDrag.close) {
      window.SettlrSheetDrag.close(sheet, function () { sheet.style.display = 'none'; });
    } else {
      sheet.style.display = 'none';
    }
  }

  function navigateAway() {
    if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('home-dashboard');
    else location.replace('home-dashboard');
  }

  function goToGroup(groupId) {
    if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('group-detail', { id: groupId });
    else location.href = 'group-detail?id=' + groupId;
  }

  function updateMemberCount(root) {
    var count = root.querySelectorAll('.member-row').length;
    var label = root.querySelector('#js-member-count');
    if (label) label.textContent = 'Members \u00b7 ' + count;
  }

  // Current member ids from the rendered rows (each carries data-member).
  function collectMemberIds(root) {
    return Array.prototype.map.call(
      root.querySelectorAll('.member-row'),
      function (r) { return r.dataset.member; }
    ).filter(Boolean);
  }

  function init(root) {
    // One-time wiring of the controls that survive re-shows. Per-show state
    // (form values, member rows, current group id) is set in onShow. Listeners
    // are guarded by flags so back-navigation never stacks them.

    var pendingRow = null;

    var confirmOverlay = root.querySelector('#js-confirm-overlay');
    var emojiOverlay   = root.querySelector('#js-emoji-overlay');

    // ── Confirm sheet (remove member / leave group) ──
    function openConfirmFor(row) {
      pendingRow = row;
      var isSelf = row.dataset.self === 'true';
      var nameEl = row.querySelector('.member-row__name');
      var name = nameEl ? nameEl.textContent.trim() : 'this member';
      var titleEl  = root.querySelector('#js-confirm-title');
      var bodyEl   = root.querySelector('#js-confirm-body');
      var actionEl = root.querySelector('#js-confirm-action');

      if (isSelf) {
        titleEl.textContent = 'Leave this group?';
        bodyEl.textContent = "You'll lose access to all expenses and balances in this group. Outstanding amounts will still need to be settled.";
        actionEl.textContent = 'Leave group';
      } else {
        titleEl.textContent = 'Remove ' + name + '?';
        bodyEl.textContent = name + ' will lose access to this group. Outstanding balances with them will still need to be settled.';
        actionEl.textContent = 'Remove';
      }
      if (confirmOverlay) confirmOverlay.classList.add('is-open');
    }

    function closeConfirm() {
      if (!confirmOverlay) return;
      if (window.SettlrSheetDrag && window.SettlrSheetDrag.close) {
        window.SettlrSheetDrag.close(confirmOverlay, function () { confirmOverlay.classList.remove('is-open'); });
      } else {
        confirmOverlay.classList.remove('is-open');
      }
    }

    function confirmRemove() {
      if (pendingRow) {
        var row = pendingRow;
        var isSelf = row.dataset.self === 'true';
        row.style.transition = 'opacity 0.2s, transform 0.2s';
        row.style.opacity = '0';
        row.style.transform = 'translateX(16px)';
        setTimeout(function () {
          row.remove();
          updateMemberCount(root);
          if (isSelf) {
            // Self exited — persist the removal, then bounce to home.
            var groupId = root._groupId;
            if (groupId && typeof Store.updateGroup === 'function') {
              Store.updateGroup(groupId, { memberIds: collectMemberIds(root) });
            }
            if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('home-dashboard');
            else location.href = 'home-dashboard';
          }
        }, 200);
        pendingRow = null;
      }
      closeConfirm();
    }

    // Delegated remove-button handler on the members list (survives row rebuilds).
    var membersList = root.querySelector('#js-members-list');
    if (membersList && !membersList._wiredRemove) {
      membersList._wiredRemove = true;
      membersList.addEventListener('click', function (e) {
        var removeBtn = e.target.closest('[data-remove]');
        if (removeBtn && membersList.contains(removeBtn)) {
          openConfirmFor(removeBtn.closest('.member-row'));
          return;
        }
        var addRow = e.target.closest('[data-add-member]');
        if (addRow && membersList.contains(addRow)) {
          if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('create-group-members');
          else location.href = 'create-group-members';
        }
      });
    }

    var confirmAction = root.querySelector('#js-confirm-action');
    if (confirmAction && !confirmAction._wired) {
      confirmAction._wired = true;
      confirmAction.addEventListener('click', confirmRemove);
    }
    var confirmClose = root.querySelector('#js-confirm-close');
    if (confirmClose && !confirmClose._wired) {
      confirmClose._wired = true;
      confirmClose.addEventListener('click', closeConfirm);
    }
    var confirmCancel = root.querySelector('#js-confirm-cancel');
    if (confirmCancel && !confirmCancel._wired) {
      confirmCancel._wired = true;
      confirmCancel.addEventListener('click', closeConfirm);
    }
    // Overlay backdrop click closes (only when the backdrop itself is hit).
    if (confirmOverlay && !confirmOverlay._wired) {
      confirmOverlay._wired = true;
      confirmOverlay.addEventListener('click', function (e) {
        if (e.target === confirmOverlay) closeConfirm();
      });
    }

    // ── Emoji picker (kept GLOBAL for the iframe entry point) ──
    var avatarBtn = root.querySelector('#js-avatar-btn');

    function openEmojiSheet() {
      if (emojiOverlay) emojiOverlay.classList.add('is-open');
    }
    function closeEmojiSheet() {
      if (emojiOverlay) emojiOverlay.classList.remove('is-open');
    }
    // Expose globally so ss-edit-group-emoji.html's iframe can open it, and so
    // any external caller has a stable programmatic hook. Re-bound each init to
    // the active root's overlay (single-instance per document is fine here).
    window.openEmojiSheet = openEmojiSheet;
    window.closeEmojiSheet = closeEmojiSheet;

    if (avatarBtn && !avatarBtn._wired) {
      avatarBtn._wired = true;
      avatarBtn.addEventListener('click', openEmojiSheet);
    }
    if (emojiOverlay && !emojiOverlay._wired) {
      emojiOverlay._wired = true;
      emojiOverlay.addEventListener('click', function (e) {
        if (e.target === emojiOverlay) closeEmojiSheet();
      });
    }

    // Emoji selection (delegated so it survives selection-class shuffles).
    var emojiGrid = emojiOverlay ? emojiOverlay.querySelector('.emoji-grid') : null;
    if (emojiGrid && !emojiGrid._wired) {
      emojiGrid._wired = true;
      emojiGrid.addEventListener('click', function (e) {
        var btn = e.target.closest('.emoji-btn');
        if (!btn || !emojiGrid.contains(btn)) return;
        var emoji = btn.dataset.emoji;
        var avatarEl = root.querySelector('#js-group-avatar');
        if (avatarEl) avatarEl.innerHTML = '<span>' + emoji + '</span>';
        emojiGrid.querySelectorAll('.emoji-btn').forEach(function (b) { b.classList.remove('is-selected'); });
        btn.classList.add('is-selected');
        setTimeout(closeEmojiSheet, 150);
      });
    }

    // ── Default-currency picker wiring (idempotent) ──
    var curBtn = root.querySelector('#js-eg-currency-btn');
    if (curBtn && !curBtn._wired) {
      curBtn._wired = true;
      curBtn.addEventListener('click', function () { openCurrencySheet(root); });
    }
    var curClose = root.querySelector('#js-eg-currency-close');
    if (curClose && !curClose._wired) {
      curClose._wired = true;
      curClose.addEventListener('click', function () { closeCurrencySheet(root); });
    }
    var curSheet = root.querySelector('#egCurrencySheet');
    if (curSheet && !curSheet._wired) {
      curSheet._wired = true;
      curSheet.addEventListener('click', function (e) { if (e.target === curSheet) closeCurrencySheet(root); });
    }

    // ── Delete group (danger zone) ──
    var deleteRow = root.querySelector('[data-delete-group]');
    if (deleteRow && !deleteRow._wired) {
      deleteRow._wired = true;
      deleteRow.addEventListener('click', function () {
        var nameInput = root.querySelector('#js-group-name-edit');
        var gname = (nameInput && nameInput.value.trim()) || 'this group';
        if (window.confirm('Delete "' + gname + '"? This cannot be undone.')) {
          if (root._groupId && typeof Store.deleteGroup === 'function') {
            Store.deleteGroup(root._groupId);
          }
          if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('home-dashboard');
          else location.href = 'home-dashboard';
        }
      });
    }

    // ── Save (guarded against double-save) ──
    var saveBtn = root.querySelector('#js-save-btn');
    if (saveBtn && !saveBtn._wired) {
      saveBtn._wired = true;
      saveBtn.addEventListener('click', function () {
        if (saveBtn._saving) return;          // double-save guard
        saveBtn._saving = true;

        var groupId = root._groupId;
        // Persist the editable fields (name, emoji, member list) to the Store.
        if (groupId && typeof Store.updateGroup === 'function') {
          var nameInput = root.querySelector('#js-group-name-edit');
          var avatarSpan = root.querySelector('#js-group-avatar span');
          var fields = { memberIds: collectMemberIds(root) };
          if (nameInput) fields.name = nameInput.value.trim();
          if (avatarSpan) fields.emoji = avatarSpan.textContent;
          if (root._egCurrency) fields.currency = root._egCurrency;
          Store.updateGroup(groupId, fields);
        }

        saveBtn.textContent = 'Saved \u2713';
        saveBtn.style.background = 'var(--expense-lent-fg)';
        setTimeout(function () {
          if (groupId) goToGroup(groupId);
          else if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('group-detail');
          else location.href = 'group-detail';
        }, 600);
      });
    }

    // ── Footer scroll detection (border-on-scroll) ──
    var footer = root.querySelector('.screen-footer');
    var scrollEl = root.querySelector('.view__content');
    if (footer && scrollEl && !scrollEl._wiredScroll) {
      scrollEl._wiredScroll = true;
      scrollEl.addEventListener('scroll', function () {
        footer.classList.toggle('is-scrolled', scrollEl.scrollTop > 0);
      }, { passive: true });
    }
  }

  function onShow(root, params) {
    var groupId = resolveId(root, params);
    var group = Store.getGroup(groupId);
    if (!group) { navigateAway(); return; }
    root._groupId = groupId;

    document.title = 'Settlr — Edit ' + group.name;

    // ── Repopulate form fields from Store ──
    var nameInput = root.querySelector('#js-group-name-edit');
    if (nameInput) nameInput.value = group.name;

    var avatarEl = root.querySelector('#js-group-avatar');
    if (avatarEl) avatarEl.innerHTML = '<span>' + group.emoji + '</span>';

    // Reflect the group's default currency on the chip (falls back to global).
    applyCurrency(root, currencyByCode(group.currency || Store.currencyCode()));

    // Sync the emoji-picker selection highlight to the stored emoji.
    var emojiGrid = root.querySelector('#js-emoji-overlay .emoji-grid');
    if (emojiGrid) {
      emojiGrid.querySelectorAll('.emoji-btn').forEach(function (b) {
        b.classList.toggle('is-selected', b.dataset.emoji === group.emoji);
      });
    }

    // ── Rebuild the member list from Store (reset before re-render) ──
    var membersList = root.querySelector('#js-members-list');
    if (membersList) {
      var addRow = membersList.querySelector('[data-add-member]');
      // Clear existing member rows (keep the persistent "Add a member" row).
      membersList.querySelectorAll('.member-row').forEach(function (el) { el.remove(); });

      var currentUser = Store.getCurrentUser();
      var html = '';
      group.memberIds.forEach(function (mid) {
        var isSelf = mid === currentUser.id;
        var contact = isSelf ? currentUser : Store.getContact(mid);
        var name = contact ? (isSelf ? 'You (' + currentUser.name.split(' ')[0] + ')' : contact.name) : mid;
        var initials = contact ? contact.initials : mid.slice(0, 2).toUpperCase();
        var role = isSelf ? 'Admin' : 'Member';
        var avatarMod = isSelf ? ' member-row__avatar--you' : '';
        var ariaLabel = isSelf ? 'Leave group' : ('Remove ' + (contact ? contact.name.split(' ')[0] : mid));
        html +=
          '<div class="member-row" data-member="' + mid + '"' + (isSelf ? ' data-self="true"' : '') + '">' +
            '<div class="member-row__avatar' + avatarMod + ' text-title-sm">' + initials + '</div>' +
            '<div class="member-row__text">' +
              '<span class="member-row__name text-title-sm">' + name + '</span>' +
              '<span class="member-row__role text-body-xs">' + role + '</span>' +
            '</div>' +
            '<button class="icon-btn icon-btn--destructive icon-btn--xs member-row__remove" data-remove aria-label="' + ariaLabel + '">' +
              '<span class="icon-holder icon-btn__icon" aria-hidden="true">' + ICON_X + '</span>' +
            '</button>' +
          '</div>';
      });
      if (addRow) addRow.insertAdjacentHTML('beforebegin', html);
      else membersList.innerHTML = html;
    }
    updateMemberCount(root);

    // Reset transient UI: close any open sheets and clear the save button state.
    var confirmOverlay = root.querySelector('#js-confirm-overlay');
    if (confirmOverlay) confirmOverlay.classList.remove('is-open');
    var emojiOverlay = root.querySelector('#js-emoji-overlay');
    if (emojiOverlay) emojiOverlay.classList.remove('is-open');

    var saveBtn = root.querySelector('#js-save-btn');
    if (saveBtn) {
      saveBtn._saving = false;
      saveBtn.textContent = 'Save Changes';
      saveBtn.style.background = '';
    }

    // Back button → replay the inverse of the entry transition (router-aware).
    // history.back() restores the group-detail entry (with its id); deep-link
    // entries fall back to group-detail. Re-point each show to this group.
    var backEl = root.querySelector('.hero-section__actions a[aria-label="Back"]');
    if (backEl) {
      backEl.onclick = function (ev) {
        if (window.SettlrRouterSPA) {
          ev.preventDefault();
          window.SettlrRouterSPA.back('group-detail');
        } else {
          backEl.setAttribute('href', 'group-detail?id=' + groupId);
        }
      };
      if (!window.SettlrRouterSPA) backEl.setAttribute('href', 'group-detail?id=' + groupId);
    }
  }

  function onHide(root) {
    // Close any open sheets so they never linger behind the next view. No
    // timers or visualViewport handlers are registered, so nothing else to tear
    // down. Listeners attached in init are idempotent and live with the in-DOM
    // view. Leave window.openEmojiSheet/closeEmojiSheet in place so the iframe
    // entry point keeps resolving.
    var confirmOverlay = root.querySelector('#js-confirm-overlay');
    if (confirmOverlay) confirmOverlay.classList.remove('is-open');
    var emojiOverlay = root.querySelector('#js-emoji-overlay');
    if (emojiOverlay) emojiOverlay.classList.remove('is-open');
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('edit-group', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="edit-group"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
