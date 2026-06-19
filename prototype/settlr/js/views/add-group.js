/* ============================================================
   Settlr — Select People view module
   (file is screens/add-group.html — the "Select People" step of the
   add-expense flow). Former inline IIFE from screens/add-group.html, adapted
   to the compiled-shell lifecycle. All DOM lookups are scoped to `root` (the
   view <section>) so they never collide with other in-DOM views.

   - init   : one-time wiring of the search input, the Next CTA, and the
              save-as-group trigger + name validation.
   - onShow : re-derives groups/contacts from Store, RESETS the selection
              state (selected group / contacts), clears the rendered list, the
              selected-people chip row, and the save-as-group form, then
              rebuilds — so re-shows never duplicate rows or pills.
   - onHide : nothing persistent to tear down.

   The expense context comes from sessionStorage('settlr_new_expense'); the
   sessionStorage hand-off to the next step (add-split) is preserved. Cross-
   screen navigation uses SettlrRouterSPA.navigate(slug, params) when present,
   else the original href (location.href / location.replace).
   ============================================================ */
(function () {
  'use strict';

  // Per-view closure state, keyed off the root element so re-shows reuse it.
  function state(root) {
    if (!root._addGroupState) {
      root._addGroupState = {
        expCtx: {},
        selectedGroupId: null,
        selectedContactIds: {},
        groups: [],
        contacts: []
      };
    }
    return root._addGroupState;
  }

  function go(slug, href) {
    if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate(slug);
    else location.href = href;
  }
  function goReplace(slug, href) {
    if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate(slug, {}, { replace: true });
    else location.replace(href);
  }

  // ── HTML builders (identical markup to the standalone screen) ──
  function groupHTML(g) {
    var mc = g.memberIds.length;
    return '<div class="person-item" data-group-id="' + g.id + '">' +
      '<div class="person-item__group-icon">' + (g.emoji || '👥') + '</div>' +
      '<div class="person-item__text">' +
        '<span class="person-item__name">' + g.name + '</span>' +
        '<span class="person-item__subtext">' + mc + ' member' + (mc !== 1 ? 's' : '') + '</span>' +
      '</div>' +
      '<div class="person-item__action"><span class="icon-holder person-item__action-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/></svg></span></div>' +
    '</div>';
  }

  function contactHTML(c) {
    return '<div class="person-item" data-contact-id="' + c.id + '">' +
      '<div class="avatar avatar--initials avatar--md">' + c.initials + '</div>' +
      '<div class="person-item__text">' +
        '<span class="person-item__name">' + c.name + '</span>' +
        '<span class="person-item__subtext">' + (c.phone || '') + '</span>' +
      '</div>' +
      '<div class="checkbox-control"><span class="icon-holder checkbox-control__check" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z"/></svg></span></div>' +
    '</div>';
  }

  // ── Render filtered list ───────────────────────────────
  function renderList(root, filter) {
    var s = state(root);
    var listEl = root.querySelector('#js-list');
    var searchEmpty = root.querySelector('#js-search-empty');
    var searchInput = root.querySelector('.search-input input');
    if (!listEl) return;

    filter = (filter || '').toLowerCase();
    var html = '';
    var fg = s.groups.filter(function (g) { return !filter || g.name.toLowerCase().includes(filter); });
    var fc = s.contacts.filter(function (c) { return !filter || c.name.toLowerCase().includes(filter); });
    var hasResults = fg.length > 0 || fc.length > 0;

    if (fg.length) {
      html += '<div class="section-header">Groups</div>';
      fg.forEach(function (g) { html += groupHTML(g); });
    }
    if (fc.length) {
      html += '<div class="section-header">Friends</div>';
      fc.forEach(function (c) { html += contactHTML(c); });
    }
    // Reset the container before re-rendering so re-shows never duplicate.
    listEl.innerHTML = html;

    // Show/hide search empty state
    if (searchEmpty) {
      searchEmpty.classList.toggle('search-empty--visible', filter.length > 0 && !hasResults);
    }

    listEl.querySelectorAll('.person-item[data-group-id]').forEach(function (row) {
      var id = row.getAttribute('data-group-id');
      if (id === s.selectedGroupId) row.classList.add('is-selected');
      row.addEventListener('click', function () { selectGroup(root, id); });
    });

    listEl.querySelectorAll('.person-item[data-contact-id]').forEach(function (row) {
      var id = row.getAttribute('data-contact-id');
      if (s.selectedContactIds[id]) {
        row.classList.add('is-selected');
        var cb = row.querySelector('.checkbox-control');
        if (cb) cb.classList.add('is-selected');
      }
      row.addEventListener('click', function () {
        toggleContact(root, id, row.querySelector('.person-item__name').textContent.trim());
      });
    });
  }

  function currentFilter(root) {
    var searchInput = root.querySelector('.search-input input');
    return searchInput ? searchInput.value : '';
  }

  function selectGroup(root, id) {
    var s = state(root);
    var chipsRow = root.querySelector('#selected-chips');
    s.selectedContactIds = {};
    if (chipsRow) {
      chipsRow.innerHTML = '';
      chipsRow.classList.remove('selected-row--visible');
    }
    s.selectedGroupId = (s.selectedGroupId === id) ? null : id;
    renderList(root, currentFilter(root));
    updateNext(root);
  }

  function toggleContact(root, id, name) {
    var s = state(root);
    s.selectedGroupId = null;
    if (s.selectedContactIds[id]) {
      delete s.selectedContactIds[id];
    } else {
      s.selectedContactIds[id] = name;
    }
    renderChips(root);
    renderList(root, currentFilter(root));
    updateNext(root);
  }

  function renderChips(root) {
    var s = state(root);
    var chipsRow = root.querySelector('#selected-chips');
    if (!chipsRow) return;
    var ids = Object.keys(s.selectedContactIds);
    if (!ids.length) {
      chipsRow.innerHTML = '';
      chipsRow.classList.remove('selected-row--visible');
      return;
    }
    chipsRow.classList.add('selected-row--visible');
    chipsRow.innerHTML = ids.map(function (id) {
      var name = s.selectedContactIds[id];
      var initials = name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
      return '<div class="member-pill member-pill--removable" data-cid="' + id + '">' +
        '<div class="avatar avatar--initials avatar--sm">' + initials + '</div>' +
        '<span class="member-pill__name">' + name.split(' ')[0] + '</span>' +
        '<span class="icon-holder member-pill__remove" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg></span>' +
      '</div>';
    }).join('');
    chipsRow.querySelectorAll('.member-pill').forEach(function (chip) {
      chip.addEventListener('click', function () {
        delete s.selectedContactIds[chip.getAttribute('data-cid')];
        renderChips(root);
        renderList(root, currentFilter(root));
        updateNext(root);
      });
    });
  }

  function updateNext(root) {
    var s = state(root);
    var nextBtn = root.querySelector('#js-next-group');
    if (!nextBtn) return;
    var has = s.selectedGroupId || Object.keys(s.selectedContactIds).length > 0;
    nextBtn.classList.toggle('btn--disabled', !has);
    nextBtn.disabled = !has;
  }

  // ── Save-as-group inline form (trigger + validation) ──
  function toggleSaveGroup(root) {
    var check = root.querySelector('#save-check');
    var form  = root.querySelector('#save-group-form');
    if (!check || !form) return;
    var isOn = check.classList.toggle('is-selected');
    form.classList.toggle('save-group-row__form--visible', isOn);
    if (isOn) {
      var inp = form.querySelector('input');
      if (inp) inp.focus();
    } else {
      // Reset error state when hiding form
      var errEl = root.querySelector('#js-group-name-error');
      var inputEl = root.querySelector('#js-group-name-input');
      if (errEl) errEl.classList.add('is-hidden');
      if (inputEl) inputEl.classList.remove('save-group-input--error');
    }
  }

  function validateGroupName(root) {
    var inputEl = root.querySelector('#js-group-name-input');
    var errEl   = root.querySelector('#js-group-name-error');
    if (!inputEl || !errEl) return true;
    var isValid = inputEl.value.trim().length > 0;
    inputEl.classList.toggle('save-group-input--error', !isValid);
    errEl.classList.toggle('is-hidden', isValid);
    return isValid;
  }

  // ── Next CTA hand-off (preserves sessionStorage → add-split) ──
  function commitNext(root) {
    var s = state(root);
    var me = Store.getCurrentUser().id;
    var expCtx = s.expCtx;
    if (s.selectedGroupId) {
      var g = s.groups.find(function (gr) { return gr.id === s.selectedGroupId; });
      expCtx.groupId = s.selectedGroupId;
      expCtx.splitAmong = g ? g.memberIds.slice() : [me];
      if (!expCtx.splitAmong.includes(me)) expCtx.splitAmong.unshift(me);
      expCtx.paidById = me;
      delete expCtx.contactIds;
    } else {
      var cids = Object.keys(s.selectedContactIds);
      expCtx.contactIds = cids;
      expCtx.splitAmong = [me].concat(cids);
      expCtx.paidById = me;
      delete expCtx.groupId;
    }
    sessionStorage.setItem('settlr_new_expense', JSON.stringify(expCtx));
    go('add-split', 'add-split');
  }

  // ── Lifecycle ────────────────────────────────────────────
  function init(root, params) {
    // One-time wiring — listeners survive re-shows; data is (re)built in onShow.
    var searchInput = root.querySelector('.search-input input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        renderList(root, this.value);
      });
    }

    var nextBtn = root.querySelector('#js-next-group');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () { commitNext(root); });
    }

    var trigger = root.querySelector('.save-group-row__trigger');
    if (trigger) {
      trigger.addEventListener('click', function () { toggleSaveGroup(root); });
    }

    var nameInput = root.querySelector('#js-group-name-input');
    if (nameInput) {
      nameInput.addEventListener('input', function () { validateGroupName(root); });
    }
  }

  function onShow(root, params) {
    var s = state(root);

    // Guard: the flow requires an in-progress expense context.
    var expCtx = JSON.parse(sessionStorage.getItem('settlr_new_expense') || '{}');
    if (!expCtx.totalAmount) { goReplace('add-amount', 'add-amount'); return; }
    s.expCtx = expCtx;

    // Re-derive Store data on every show.
    s.groups   = Store.getGroups();
    s.contacts = Store.getContacts();

    // RESET selection state + rendered UI so re-shows never duplicate rows or
    // pills and never carry stale selections from a previous visit.
    s.selectedGroupId = null;
    s.selectedContactIds = {};

    var searchInput = root.querySelector('.search-input input');
    if (searchInput) searchInput.value = '';

    var chipsRow = root.querySelector('#selected-chips');
    if (chipsRow) {
      chipsRow.innerHTML = '';
      chipsRow.classList.remove('selected-row--visible');
    }

    // Reset the save-as-group form to its default (collapsed, no error).
    var check = root.querySelector('#save-check');
    var form  = root.querySelector('#save-group-form');
    var nameInput = root.querySelector('#js-group-name-input');
    var errEl = root.querySelector('#js-group-name-error');
    if (check) check.classList.remove('is-selected');
    if (form) form.classList.remove('save-group-row__form--visible');
    if (nameInput) { nameInput.value = ''; nameInput.classList.remove('save-group-input--error'); }
    if (errEl) errEl.classList.add('is-hidden');

    renderChips(root);
    renderList(root, '');
    updateNext(root);
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers).
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('add-group', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="add-group"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
