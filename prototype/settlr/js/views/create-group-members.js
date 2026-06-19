/* ============================================================
   Settlr — Add Members view module
   (file is screens/create-group-members.html — the 2nd step of group
   creation). Former inline IIFE from screens/create-group-members.html,
   adapted to the compiled-shell lifecycle. All DOM lookups are scoped to `root`
   (the view <section>) so they never collide with other in-DOM views.

   - init   : one-time wiring of the search input and the Create CTA.
   - onShow : reads the in-progress group draft from
              sessionStorage('settlr_new_group') (handed off from
              create-group-name); if missing, redirects back to
              create-group-name. RESETS the selection state, clears the
              rendered contact list, the selected member-pills, and the search
              field, then rebuilds — so re-shows never duplicate rows or pills
              and never carry a stale selection.
   - onHide : nothing persistent to tear down.

   The group draft comes from sessionStorage('settlr_new_group'). The Create
   action finalizes the group via Store.addGroup, guarded against double-create
   by a `committing` flag, clears the draft, and navigates to the new group's
   detail screen. Cross-screen navigation uses SettlrRouterSPA.navigate(slug,
   params) when present, else the original href (location.href /
   location.replace).
   ============================================================ */
(function () {
  'use strict';

  // Per-view closure state, keyed off the root element so re-shows reuse it.
  function state(root) {
    if (!root._createGroupMembersState) {
      root._createGroupMembersState = {
        ctx: {},
        selectedIds: {},   // id -> { name, initials }
        contacts: [],
        committing: false
      };
    }
    return root._createGroupMembersState;
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
  function rowHTML(c) {
    return '<div class="person-item" data-id="' + c.id + '" data-name="' + c.name + '" data-initials="' + c.initials + '">' +
      '<div class="avatar avatar--initials avatar--md">' + c.initials + '</div>' +
      '<div class="person-item__text">' +
        '<span class="person-item__name">' + c.name + '</span>' +
        '<span class="person-item__subtext">' + (c.phone || '') + '</span>' +
      '</div>' +
      '<div class="checkbox-control">' +
        '<svg class="checkbox-control__check" viewBox="0 0 12 10" fill="none">' +
          '<path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</div>' +
    '</div>';
  }

  function currentFilter(root) {
    var searchInput = root.querySelector('.search-input input');
    return searchInput ? searchInput.value : '';
  }

  // ── Render filtered list ───────────────────────────────
  function renderList(root, filter) {
    var s = state(root);
    var listEl = root.querySelector('#js-contact-list');
    if (!listEl) return;

    filter = (filter || '').toLowerCase();
    var fc = s.contacts.filter(function (c) { return !filter || c.name.toLowerCase().includes(filter); });
    // Reset the container before re-rendering so re-shows never duplicate.
    listEl.innerHTML = '<div class="heading"><span class="heading__title">Contacts</span></div>' + fc.map(rowHTML).join('');

    listEl.querySelectorAll('.person-item').forEach(function (row) {
      var id = row.getAttribute('data-id');
      if (s.selectedIds[id]) {
        row.classList.add('is-selected');
        var cb = row.querySelector('.checkbox-control');
        if (cb) cb.classList.add('is-selected');
      }
      row.addEventListener('click', function () {
        toggle(root, id, row.getAttribute('data-name'), row.getAttribute('data-initials'));
      });
    });
  }

  function toggle(root, id, name, initials) {
    var s = state(root);
    if (s.selectedIds[id]) {
      delete s.selectedIds[id];
    } else {
      s.selectedIds[id] = { name: name, initials: initials };
    }
    renderList(root, currentFilter(root));
    renderChips(root);
    updateCount(root);
  }

  function renderChips(root) {
    var s = state(root);
    var chipsEl = root.querySelector('#js-chips');
    if (!chipsEl) return;
    var ids = Object.keys(s.selectedIds);
    chipsEl.innerHTML = ids.map(function (id) {
      var info = s.selectedIds[id];
      return '<div class="member-pill member-pill--removable" data-cid="' + id + '">' +
        '<div class="avatar avatar--xs avatar--initials">' + info.initials + '</div>' +
        '<span class="member-pill__name">' + info.name.split(' ')[0] + '</span>' +
        '<span class="icon-holder member-pill__remove" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg></span>' +
      '</div>';
    }).join('');
    chipsEl.querySelectorAll('.member-pill').forEach(function (chip) {
      chip.addEventListener('click', function () {
        delete s.selectedIds[chip.getAttribute('data-cid')];
        renderList(root, currentFilter(root));
        renderChips(root);
        updateCount(root);
      });
    });
  }

  function updateCount(root) {
    var s = state(root);
    var createBtn = root.querySelector('#js-create');
    if (!createBtn) return;
    var n = Object.keys(s.selectedIds).length;
    if (n > 0) {
      createBtn.style.opacity = '';
      createBtn.style.pointerEvents = '';
    } else {
      createBtn.style.opacity = '0.4';
      createBtn.style.pointerEvents = 'none';
    }
  }

  // ── Create CTA hand-off (finalizes the group, clears the draft) ──
  function commitCreate(root) {
    var s = state(root);
    // Guard against double-create (e.g. a fast double-tap).
    if (s.committing) return;
    s.committing = true;

    var me = Store.getCurrentUser();
    var memberIds = [me.id].concat(Object.keys(s.selectedIds));
    var group = {
      name: s.ctx.name,
      type: s.ctx.type || 'other',
      emoji: s.ctx.emoji || '📝',
      memberIds: memberIds
    };
    // Carry the optional group photo picked in step 1 (create-group-name).
    if (s.ctx.photo) group.photo = s.ctx.photo;
    var newId = Store.addGroup(group);

    // Clear the transient group draft now that the group is persisted.
    sessionStorage.removeItem('settlr_new_group');

    // Skip standalone "Group Created" screen — go straight to group detail.
    go('group-detail', 'group-detail?id=' + encodeURIComponent(newId));
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

    var createBtn = root.querySelector('#js-create');
    if (createBtn) {
      createBtn.addEventListener('click', function () { commitCreate(root); });
    }
  }

  function onShow(root, params) {
    var s = state(root);

    // Guard: the flow requires an in-progress group draft from
    // create-group-name. If missing, redirect back to the name step.
    var ctx = JSON.parse(sessionStorage.getItem('settlr_new_group') || '{}');
    if (!ctx.name) { goReplace('create-group-name', 'create-group-name'); return; }
    s.ctx = ctx;

    // Re-derive Store data on every show.
    s.contacts = Store.getContacts();

    // RESET selection state + rendered UI so re-shows never duplicate rows or
    // pills and never carry a stale selection from a previous visit. Also clear
    // the committing guard so a re-shown step can create again.
    s.selectedIds = {};
    s.committing = false;

    var searchInput = root.querySelector('.search-input input');
    if (searchInput) searchInput.value = '';

    var chipsEl = root.querySelector('#js-chips');
    if (chipsEl) chipsEl.innerHTML = '';

    var listEl = root.querySelector('#js-contact-list');
    if (listEl) listEl.innerHTML = '';

    renderChips(root);
    renderList(root, '');
    updateCount(root);
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers).
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('create-group-members', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="create-group-members"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
