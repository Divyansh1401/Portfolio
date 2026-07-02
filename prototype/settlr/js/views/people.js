/* ============================================================
   Settlr — People view module
   Former inline IIFEs from screens/people.html, adapted to the compiled-shell
   lifecycle. All DOM lookups are scoped to `root` (the view <section>) so they
   never collide with other in-DOM views.

   - init   : one-time wiring of chip toggles + the quick-actions sheet.
   - onShow : re-derives contact/group items from Store, applies the active
              filter (params.filter first, then ?filter= query for standalone),
              clears the list container, and re-renders. Runs on every show so
              navigating back reflects the latest Store state.
   - onHide : closes the quick-actions sheet so it never lingers behind another
              view.

   The filter comes from `params.filter` (router) with a fallback to the URL
   query string for standalone use of screens/people.html.
   ============================================================ */
(function () {
  'use strict';

  // Per-view closure state, keyed off the root element so re-shows reuse it.
  function state(root) {
    if (!root._peopleState) root._peopleState = { items: [], query: '' };
    return root._peopleState;
  }

  // ── Build item data from Store (re-derived on every show) ──
  function buildItems() {
    var contactItems = Store.getContacts().map(function (c) {
      var bal      = Store.getContactBalance(c.id);
      var hasTxns  = Store.hasContactTransactions(c.id);
      var lastDate = Store.getLastTransactionDate(c.id);
      return {
        type:     'individual',
        dir:      bal.direction,
        lastDate: lastDate,
        name:     c.name || '',
        html:     Render.personItem(c, bal, hasTxns)
      };
    });

    var groupItems = Store.getGroups().map(function (g) {
      var bal      = Store.getGroupBalance(g.id);
      var expenses = Store.getExpenses(g.id);
      var hasTxns  = expenses.length > 0;
      var lastDate = expenses.length > 0 ? expenses[0].date : null;
      return {
        type:     'group',
        dir:      bal.direction,
        lastDate: lastDate,
        name:     g.name || '',
        html:     Render.groupItem(g, bal, hasTxns)
      };
    });

    // Sort by most recent transaction date — null (no history) goes last
    return contactItems.concat(groupItems).sort(function (a, b) {
      if (!a.lastDate && !b.lastDate) return 0;
      if (!a.lastDate) return 1;
      if (!b.lastDate) return -1;
      return b.lastDate.localeCompare(a.lastDate);
    });
  }

  // ── Render filtered list ───────────────────────────────
  function renderList(root) {
    var s          = state(root);
    var list       = root.querySelector('#js-person-list');
    var emptyState = root.querySelector('#empty-people');
    if (!list) return;

    var chips = root.querySelectorAll('.chip');
    var active = {};
    chips.forEach(function (c) {
      active[c.dataset.filter] = c.classList.contains('is-active');
    });

    var noTypeFilter = !active.individual && !active.group;
    var query = (s.query || '').trim().toLowerCase();

    var filtered = s.items.filter(function (item) {
      // Text search (name contains query)
      if (query && item.name.toLowerCase().indexOf(query) === -1) return false;
      // Type filter
      if (!noTypeFilter) {
        if (item.type === 'individual' && !active.individual) return false;
        if (item.type === 'group'      && !active.group)      return false;
      }
      // Balance filter — if none active, show all
      var noBalFilter = !active.active && !active.lend && !active.owe;
      if (!noBalFilter) {
        if (active.active && (item.dir === 'lent' || item.dir === 'owe')) return true;
        if (active.lend   && item.dir === 'lent')  return true;
        if (active.owe    && item.dir === 'owe')   return true;
        return false;
      }
      return true;
    });

    var html = filtered.map(function (i) { return i.html; }).join('');
    // Reset the container before re-rendering so re-shows never duplicate.
    list.innerHTML = html;
    if (emptyState) emptyState.style.display = html ? 'none' : '';
  }

  // ── Quick-actions sheet (kebab menu) ─────────────────────
  function wireSheet(root) {
    var btn     = root.querySelector('#js-people-menu-btn');
    var overlay = root.querySelector('#js-people-menu-overlay');
    var close   = root.querySelector('#js-people-menu-close');
    if (!btn || !overlay) return;

    function open() {
      overlay.hidden = false;
    }
    function shut() {
      if (window.SettlrSheetDrag && window.SettlrSheetDrag.close) {
        window.SettlrSheetDrag.close(overlay, function () { overlay.hidden = true; });
      } else {
        overlay.hidden = true;
      }
    }
    // Expose shut() so onHide can dismiss an open sheet.
    root._peopleShutSheet = shut;

    btn.addEventListener('click', open);
    if (close) close.addEventListener('click', shut);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) shut(); });
    overlay.addEventListener('settlr:sheet-dismiss', shut);

    // Dismiss when a menu row is tapped (for # placeholder links too)
    overlay.querySelectorAll('.settings-row').forEach(function (row) {
      row.addEventListener('click', shut);
    });
  }

  // ── Invite to Settlr ─────────────────────────────────────
  // Shares the app link via the native share sheet (mobile) and falls back to
  // copying it to the clipboard with brief inline confirmation. Previously a
  // dead href="#" that cleared the route hash on click.
  function wireInvite(root) {
    var row = root.querySelector('#js-invite-row');
    if (!row || row._wired) return;
    row._wired = true;

    var labelEl = row.querySelector('.settings-row__label');
    // Per-user invite link so opening it auto-connects the invitee to me.
    var handle = '';
    if (window.Store && Store.getCurrentUser) {
      var u = Store.getCurrentUser() || {};
      handle = u.handle ? String(u.handle).replace(/^@/, '') : '';
    }
    var base = location.origin || 'https://settlrapp.in';
    var url = handle ? base + '/invite/' + handle : base;
    var share = { title: 'Settlr', text: 'Split expenses with me on Settlr', url: url };

    function confirmCopied() {
      if (!labelEl) return;
      var original = labelEl.textContent;
      labelEl.textContent = 'Link copied!';
      setTimeout(function () { labelEl.textContent = original; }, 1600);
    }

    row.addEventListener('click', function (e) {
      e.preventDefault();
      if (navigator.share) {
        navigator.share(share).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(confirmCopied, function () {});
      }
    });
  }

  // ── Lifecycle ────────────────────────────────────────────
  function init(root, params) {
    // One-time chip wiring — re-renders on toggle using the latest items.
    root.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        chip.classList.toggle('is-active');
        renderList(root);
      });
    });

    // Live search — filter the list by name as the user types.
    var search = root.querySelector('#js-people-search');
    if (search) {
      search.addEventListener('input', function () {
        state(root).query = search.value;
        renderList(root);
      });
    }

    wireSheet(root);
    wireInvite(root);
  }

  function onShow(root, params) {
    var s = state(root);
    s.items = buildItems();

    // URL filter — params.filter (router) first, then ?filter= for standalone.
    var filter = (params && params.filter) ||
      new URLSearchParams(location.search).get('filter');
    if (filter) {
      root.querySelectorAll('.chip').forEach(function (c) {
        c.classList.remove('is-active');
      });
      var match = root.querySelector('.chip[data-filter="' + filter + '"]');
      if (match) {
        match.classList.add('is-active');
        match.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }

    renderList(root);
  }

  function onHide(root) {
    // Close an open quick-actions sheet so it never lingers behind a new view.
    if (typeof root._peopleShutSheet === 'function') root._peopleShutSheet();
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('people', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="people"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
