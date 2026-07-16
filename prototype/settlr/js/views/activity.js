/* ============================================================
   Settlr — Activity view module
   Former inline IIFE from screens/activity.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views. Filter chips +
   search state come from `params` (router) with a fallback to the URL query
   string for standalone use of screens/activity.html.

   NOTE: this view no longer relies on js/icon-upgrade.js (removed in the
   compiled shell). The dynamically-built update-item rows therefore emit the
   icon-holder + inline SVG directly — the exact output icon-upgrade used to
   produce — so there is ZERO visual change and ZERO remaining font icons.
   ============================================================ */
(function () {
  'use strict';

  function init(root, params) {
    // One-time wiring lives in onShow (guarded by a flag) so listeners survive
    // re-show without duplicating, and the feed re-derives the latest Store
    // state every activation.
  }

  function onShow(root, params) {
    var expenseList = root.querySelector('#js-expense-list');
    var emptyState  = root.querySelector('#empty-activity');

    // ── Filter + search ────────────────────────────────────
    // Reads LIVE state on every call — the fresh Store feed, chip on/off from the
    // DOM, and the current search value — so the once-wired listeners can never
    // operate on a stale earlier-show closure (fixes a re-visit filtering bug).
    function applyFilters() {
      var meId = Store.getCurrentUser().id;
      var allFeed = Store.getActivityFeed();
      // Real settlements involving the user, shaped for the dated feed + filters.
      var settleItems = (Store.getAllSettlements ? Store.getAllSettlements() : []).map(function (s) {
        var youPaid = s.fromId === meId;
        var otherId = youPaid ? s.toId : s.fromId;
        var other = Store.getContact(otherId);
        return Object.assign({}, s, {
          _settlement: true,
          _youPaid: youPaid,
          _name: other ? other.name.split(' ')[0] : otherId,
          _type: s.groupId ? 'group' : 'individual',
          _dir: youPaid ? 'owe' : 'lent'
        });
      });
      // Filter state read straight from the DOM (chip.--on) + the live search box.
      var chipsOn = {};
      root.querySelectorAll('.chip[data-filter]').forEach(function (c) { chipsOn[c.dataset.filter] = c.classList.contains('chip--on'); });
      var searchEl = root.querySelector('.search-input input');
      var searchQuery = searchEl ? searchEl.value.trim() : '';

      // Reset the feed container before rebuilding to avoid duplicate rows
      // when the view is re-shown (router keeps the DOM in place).
      expenseList.innerHTML = '';

      var typeActive = chipsOn.individual || chipsOn.group;
      var dirActive  = chipsOn.lend || chipsOn.owe;

      // Unified predicate over expenses + settlements (settlements expose
      // parallel _type/_dir/_name fields).
      function passes(it) {
        var isSet = it._settlement;
        var type = isSet ? it._type : (it.groupId ? 'group' : 'individual');
        var dir  = isSet ? it._dir  : it.net.direction;
        if (typeActive) {
          var passType = (chipsOn.individual && type === 'individual') ||
                         (chipsOn.group      && type === 'group');
          if (!passType) return false;
        }
        if (dirActive) {
          var passDir = (chipsOn.lend && dir === 'lent') ||
                        (chipsOn.owe  && dir === 'owe');
          if (!passDir) return false;
        }
        if (searchQuery) {
          var q = searchQuery.toLowerCase();
          var hay = isSet
            ? (it._name + ' settlement ' + (it.method || ''))
            : (it.title + ' ' + (it.contextLabel || '') + ' ' + (it.category || ''));
          if (hay.toLowerCase().indexOf(q) === -1) return false;
        }
        return true;
      }

      // Sort the combined expenses + settlements newest-first BEFORE grouping,
      // so date sections (and the settlement rows within) stay chronological —
      // groupExpensesByDate preserves date-label encounter order. Order by the
      // full transaction time (occurredAt), tiebroken by date, so multiple
      // transactions on the same day stay in the right order.
      var results = allFeed.concat(settleItems)
        .filter(passes)
        .sort(function (a, b) {
          return ((b.occurredAt || b.date || '')).localeCompare(a.occurredAt || a.date || '');
        });

      // Real-data-only feed: show the empty state when nothing matches.
      if (!results.length) {
        expenseList.innerHTML = '';
        emptyState.style.display = '';
        return;
      }
      emptyState.style.display = 'none';

      var grouped = Store.groupExpensesByDate(results);
      var html = '';
      grouped.forEach(function (pair) {
        var items = pair[1].map(function (e) {
          return e._settlement
            ? Render.settlementRow(e, e._name, e._youPaid)
            : Render.expenseItem(e, e.net, e.contextLabel);
        }).join('');
        html += Render.dateSection(pair[0], items);
      });
      expenseList.innerHTML = html;
    }

    // ── Chip toggle ────────────────────────────────────────
    root.querySelectorAll('.chip[data-filter]').forEach(function (chip) {
      // Reset state on (re-)show, then attach a single click listener.
      chip.classList.remove('chip--on');
      chip.setAttribute('aria-pressed', 'false');
      if (!chip._wired) {
        chip._wired = true;
        chip.addEventListener('click', function () {
          var on = chip.classList.toggle('chip--on');
          chip.setAttribute('aria-pressed', on ? 'true' : 'false');
          applyFilters();
        });
      }
    });

    // ── Search input ───────────────────────────────────────
    var searchInput = root.querySelector('.search-input input');
    if (searchInput) {
      searchInput.value = '';
      if (!searchInput._wired) {
        searchInput._wired = true;
        searchInput.addEventListener('input', function () { applyFilters(); });
      }
    }

    // ── ?filter= param (router params first, URL query fallback) ──
    var urlFilter = (params && params.filter) ||
      new URLSearchParams(location.search).get('filter');
    if (urlFilter) {
      var urlChip = root.querySelector('.chip[data-filter="' + urlFilter + '"]');
      if (urlChip) {
        urlChip.classList.add('chip--on');
        urlChip.setAttribute('aria-pressed', 'true');
        urlChip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }

    // ── Initial render ─────────────────────────────────────
    applyFilters();
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers). Chip
    // and search listeners are attached idempotently and live with the
    // in-DOM view; state is reset at the top of onShow.
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('activity', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="activity"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
