/* ============================================================
   Settlr — Settle Select view module
   Former inline IIFE from screens/settle-select.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views.

   - init   : one-time wiring of the search input listener.
   - onShow : re-derives active group/person rows from Store, clears the two
              list containers, re-renders, and re-applies the current search
              filter. Runs on every show so navigating back reflects the latest
              Store state.
   - onHide : nothing persistent to tear down.

   Flow handoff: selecting a person links to settle-amount?contactId=…, a group
   to group-detail?id=…. These are plain <a href> links — the SPA router
   intercepts the click and animates the swap; standalone falls back to a real
   navigation. This screen does NOT write sessionStorage (settlr_settle is
   written later by settle-amount), so there is nothing extra to persist here.
   ============================================================ */
(function () {
  'use strict';

  // Per-view closure state, keyed off the root element so re-shows reuse it.
  function state(root) {
    if (!root._settleSelectState) root._settleSelectState = { groupsHtml: '', peopleHtml: '' };
    return root._settleSelectState;
  }

  // Optional group scope: when settling FROM a group, the flow stays tagged to
  // it (params.groupId → ?groupId= query). null = general person-level settle.
  function resolveGroupId(params) {
    if (params && params.groupId != null && params.groupId !== '') return params.groupId;
    var qs = new URLSearchParams(location.search).get('groupId');
    return (qs != null && qs !== '') ? qs : null;
  }

  // ── Row builders (ported verbatim from the former inline IIFE) ──
  function groupRow(group, bal) {
    var dir = bal.direction;
    var mod = dir === 'owe' ? ' person-item--owe' : ' person-item--lent';
    var label = dir === 'owe' ? 'You owe' : 'You lent';
    var right = '<div class="expense-item__right">' +
      '<span class="expense-item__label expense-item__label--' + dir + ' text-label-xs">' + label + '</span>' +
      '<span class="expense-item__amount expense-item__amount--' + dir + '">' + Store.formatINR(bal.amount) + '</span>' +
    '</div>';
    // Tapping a group re-scopes the settle flow to that group (members list),
    // NOT the group detail page. data-settle-group is handled by a delegated
    // click that force-re-activates settle-select (same-view router guard would
    // otherwise no-op it); the href is the standalone fallback.
    return '<a class="person-item' + mod + '" href="settle-select?groupId=' + group.id + '" data-settle-group="' + group.id + '">' +
      '<div class="person-item__group-icon">' + (group.emoji || '👥') + '</div>' +
      '<div class="person-item__text">' +
        '<span class="person-item__name text-title-sm">' + group.name + '</span>' +
        '<span class="person-item__subtext text-body-xs">' + group.memberCount + ' members</span>' +
      '</div>' +
      right +
    '</a>';
  }

  function personRow(contact, bal, groupId) {
    var dir = bal.direction;
    var mod = dir === 'owe' ? ' person-item--owe' : ' person-item--lent';
    var label = dir === 'owe' ? 'You owe' : 'You lent';
    var commonGroups = Store.getCommonGroups(contact.id);
    var subtext = commonGroups.length ? commonGroups.map(function(g){ return g.name; }).join(', ') : 'Individual';
    var right = '<div class="expense-item__right">' +
      '<span class="expense-item__label expense-item__label--' + dir + ' text-label-xs">' + label + '</span>' +
      '<span class="expense-item__amount expense-item__amount--' + dir + '">' + Store.formatINR(bal.amount) + '</span>' +
    '</div>';
    var href = 'settle-amount?contactId=' + contact.id + (groupId ? '&groupId=' + groupId : '');
    return '<a class="person-item' + mod + '" href="' + href + '">' +
      '<div class="avatar avatar--initials avatar--md text-title-md">' + contact.initials + '</div>' +
      '<div class="person-item__text">' +
        '<span class="person-item__name text-title-sm">' + contact.name + '</span>' +
        '<span class="person-item__subtext text-body-xs">' + subtext + '</span>' +
      '</div>' +
      right +
    '</a>';
  }

  // ── Build item HTML from Store (re-derived on every show) ──
  function buildItems(root, groupId) {
    var s = state(root);

    // Group-scoped mode: list ONLY this group's members (with their group
    // balance), no Groups section; each link carries the groupId.
    if (groupId) {
      var peopleHtml = '';
      Store.getMemberBalancesForGroup(groupId).forEach(function (m) {
        if (m.direction === 'settled') return;
        var contact = Store.getContact(m.contactId) || { id: m.contactId, name: m.name, initials: m.initials };
        peopleHtml += personRow(contact, { amount: m.amount, direction: m.direction }, groupId);
      });
      s.groupsHtml = '';
      s.peopleHtml = peopleHtml;
      return;
    }

    // General mode — all active (non-settled) groups + people.
    var groupsHtml = '';
    Store.getGroups().forEach(function (g) {
      var bal = Store.getGroupBalance(g.id);
      if (bal.direction !== 'settled') groupsHtml += groupRow(g, bal);
    });

    var peopleHtmlAll = '';
    Store.getContacts().forEach(function (c) {
      var bal = Store.getContactBalance(c.id);
      if (bal.direction !== 'settled') peopleHtmlAll += personRow(c, bal);
    });

    s.groupsHtml = groupsHtml;
    s.peopleHtml = peopleHtmlAll;
  }

  // ── Render filtered lists ───────────────────────────────
  function renderList(root, filter) {
    var s = state(root);
    filter = (filter || '').toLowerCase();

    var groupsList = root.querySelector('#js-groups-list');
    var peopleList = root.querySelector('#js-people-list');
    if (!groupsList || !peopleList) return;

    // Reset both containers before re-rendering so re-shows never duplicate.
    groupsList.innerHTML = s.groupsHtml;
    peopleList.innerHTML = s.peopleHtml;

    var visibleCount = 0;
    if (filter) {
      root.querySelectorAll('.person-item').forEach(function (row) {
        var name = row.querySelector('.person-item__name').textContent.toLowerCase();
        var show = name.includes(filter);
        row.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });
    } else {
      visibleCount = root.querySelectorAll('.person-item').length;
    }

    // Nothing to settle when there's no data at all, or when an active search
    // filter hides every row. Show the empty state and keep labels hidden then.
    var hasData = !!(s.groupsHtml || s.peopleHtml);
    var isEmpty = !hasData || visibleCount === 0;

    var emptyEl = root.querySelector('#js-settle-empty');
    if (emptyEl) emptyEl.style.display = isEmpty ? '' : 'none';

    // Show/hide section labels based on content. Use display (not the [hidden]
    // attribute) since `.heading` sets display and would override [hidden].
    var groupsLabel = root.querySelector('#js-groups-label');
    var peopleLabel = root.querySelector('#js-people-label');
    if (groupsLabel) groupsLabel.style.display = (!isEmpty && s.groupsHtml) ? '' : 'none';
    if (peopleLabel) peopleLabel.style.display = (!isEmpty && s.peopleHtml) ? '' : 'none';
  }

  // ── Lifecycle ────────────────────────────────────────────
  function init(root, params) {
    // One-time search wiring — re-renders on input using the current items.
    var searchInput = root.querySelector('.search-input input');
    if (searchInput && !searchInput._wired) {
      searchInput._wired = true;
      searchInput.addEventListener('input', function () { renderList(root, this.value); });
    }

    // Tapping a group row re-scopes settle-select to that group's members
    // (instead of opening group-detail). The router's same-view guard would
    // no-op a plain nav, so force a re-activation with the new groupId.
    var groupsList = root.querySelector('#js-groups-list');
    if (groupsList && !groupsList._wiredScope) {
      groupsList._wiredScope = true;
      groupsList.addEventListener('click', function (e) {
        var a = e.target.closest('[data-settle-group]');
        if (!a || !groupsList.contains(a)) return;
        var gid = a.getAttribute('data-settle-group');
        if (window.SettlrRouterSPA) {
          e.preventDefault();
          window.SettlrRouterSPA.navigate('settle-select', { groupId: gid }, { force: true });
        }
        // else: fall through to the href (standalone real navigation).
      });
    }
  }

  function onShow(root, params) {
    var groupId = resolveGroupId(params);
    var group = groupId ? Store.getGroup(groupId) : null;

    // Title + back reflect the scope: a group name + return-to-group when
    // settling within a group, otherwise the default "Settle Up" → home.
    var titleEl = root.querySelector('.top-app-bar__title');
    if (titleEl) titleEl.textContent = group ? 'Settle Up \u00b7 ' + group.name : 'Settle Up';
    var backEl = root.querySelector('.top-app-bar__back');
    if (backEl) {
      backEl.onclick = function (ev) {
        if (!window.SettlrRouterSPA) return;
        ev.preventDefault();
        // Replay the inverse of the entry transition; history.back() restores
        // the prior entry (group-detail with its id when group-scoped). Deep
        // links fall back to the scoped group or home.
        window.SettlrRouterSPA.back(group ? 'group-detail' : 'home-dashboard');
      };
      if (!window.SettlrRouterSPA) backEl.setAttribute('href', group ? 'group-detail?id=' + groupId : 'home-dashboard');
    }

    // Re-derive items from the latest Store state, then render unfiltered.
    buildItems(root, groupId);
    var searchInput = root.querySelector('.search-input input');
    renderList(root, searchInput ? searchInput.value : '');
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / open sheets / viewport handlers).
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('settle-select', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="settle-select"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
