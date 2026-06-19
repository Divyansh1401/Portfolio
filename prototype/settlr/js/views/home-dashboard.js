/* ============================================================
   Settlr — Home Dashboard view module
   Former inline IIFE from screens/home-dashboard.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views.

   - init   : no heavy one-time wiring needed; everything is re-derived in
              onShow so navigating back reflects the latest Store state.
   - onShow : runs on EVERY activation (the home tab is the highest-traffic
              return target). It MUST reset the containers it appends to before
              rebuilding, otherwise group cards + activity rows would duplicate
              each time you return home:
                · #js-cards-row is reset back to ONLY the static .card-create
                  link (any appended .card-group cards + any injected groups
                  empty-state are removed) before re-appending.
                · #js-activity-list innerHTML is set fresh each time (an
                  injected empty-state is overwritten by the new content).
              Hero balance + user initials are re-derived each show too.
   - onHide : nothing persistent to tear down.

   Recent-groups product rule (PRESERVED EXACTLY):
     1. ALL active (non-settled) groups are shown — even if > 4.
     2. If active count < 4, pad with most-recent settled groups until 4 total.
     3. Final list ordered by createdAt desc.
   The no-groups and no-activity empty-states and the date-section grouping
   (Store.groupExpensesByDate) are preserved.
   ============================================================ */
(function () {
  'use strict';

  // ── User initials + hero balance (re-derived every show) ──
  function renderHero(root) {
    var user = Store.getCurrentUser();
    var initialsEl = root.querySelector('#js-user-initials');
    if (initialsEl) {
      // Show the saved profile photo when present, else fall back to initials.
      if (user.photo) {
        initialsEl.style.backgroundImage = 'url(' + user.photo + ')';
        initialsEl.style.backgroundSize = 'cover';
        initialsEl.style.backgroundPosition = 'center';
        initialsEl.textContent = '';
      } else {
        initialsEl.style.backgroundImage = '';
        initialsEl.textContent = user.initials;
      }
    }

    // Store.getNetBalance() → { amount, direction: 'lent'|'owe'|'settled' }
    var net      = Store.getNetBalance();
    var labelEl  = root.querySelector('#js-hero-label');
    var amountEl = root.querySelector('#js-hero-amount');
    if (!labelEl || !amountEl) return;
    if (net.direction === 'lent') {
      labelEl.textContent  = 'Overall you are owed';
      amountEl.textContent = Store.formatINR(net.amount);
    } else if (net.direction === 'owe') {
      labelEl.textContent  = 'Overall you owe';
      amountEl.textContent = Store.formatINR(net.amount);
    } else {
      labelEl.textContent  = 'All settled up';
      amountEl.textContent = '\u20B90';
    }
  }

  // ── Recent groups (carousel) ──
  function renderGroups(root) {
    var cardsRow = root.querySelector('#js-cards-row');
    if (!cardsRow) return;
    var createCard = cardsRow.querySelector('.card-create');

    // RESET: rebuild the cards row back to ONLY the static create card so
    // re-shows never duplicate group cards. Also drop any previously injected
    // groups empty-state (it sits as a sibling before the cards row).
    cardsRow.innerHTML = '';
    if (createCard) cardsRow.appendChild(createCard);
    var prevEmpty = root.querySelector('#js-groups-empty');
    if (prevEmpty) prevEmpty.remove();

    // Recent groups rules:
    //   1. ALL active (non-settled) groups must be shown — even if > 4.
    //   2. If active count < 4, pad with most-recent settled groups until 4 total.
    //   3. Final list ordered by createdAt desc.
    var allGroups = Store.getGroups()
      .slice()
      .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    var groupsWithBal = allGroups.map(function (g) {
      return { group: g, bal: Store.getGroupBalance(g.id) };
    });
    var active  = groupsWithBal.filter(function (x) { return x.bal.direction !== 'settled'; });
    var settled = groupsWithBal.filter(function (x) { return x.bal.direction === 'settled'; });
    var padCount = Math.max(0, 4 - active.length);
    var groups   = active.concat(settled.slice(0, padCount))
      .sort(function (a, b) { return (b.group.createdAt || '').localeCompare(a.group.createdAt || ''); })
      .map(function (x) { return x.group; });

    if (groups.length === 0) {
      // Show empty state above the cards row; create card always remains visible.
      var emptyGroups = document.createElement('div');
      emptyGroups.className = 'empty-state';
      emptyGroups.id = 'js-groups-empty';
      emptyGroups.innerHTML =
        '<div class="empty-state__illustration">' +
          '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
            '<path d="M24 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zM8 38c0-8.8 7.2-16 16-16s16 7.2 16 16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
          '</svg>' +
        '</div>' +
        '<div class="empty-state__text">' +
          '<p class="empty-state__title text-heading-sm">No groups yet</p>' +
          '<p class="empty-state__body text-body-md">Create one to get started</p>' +
        '</div>';
      // Insert the empty state before the cards row.
      cardsRow.parentNode.insertBefore(emptyGroups, cardsRow);
    } else {
      groups.forEach(function (g) {
        var bal  = Store.getGroupBalance(g.id);
        var html = Render.groupCard(g, bal);
        var tmp  = document.createElement('div');
        tmp.innerHTML = html;
        cardsRow.appendChild(tmp.firstChild);
      });
    }
  }

  // ── Activity feed (date sections + empty state) ──
  function renderActivity(root) {
    var activityList = root.querySelector('#js-activity-list');
    if (!activityList) return;
    var feed = Store.getActivityFeed(8);

    if (!feed.length) {
      // RESET via fresh innerHTML — empty state when no activity.
      activityList.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-state__illustration">' +
            '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
              '<rect x="10" y="6" width="28" height="36" rx="4" stroke="currentColor" stroke-width="3"/>' +
              '<path d="M16 18h16M16 26h10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
            '</svg>' +
          '</div>' +
          '<div class="empty-state__text">' +
            '<p class="empty-state__title text-heading-sm">No expenses yet</p>' +
            '<p class="empty-state__body text-body-md">Add one to get started</p>' +
          '</div>' +
        '</div>';
    } else {
      // Group by date using Store.groupExpensesByDate() — returns an ordered
      // array of [label, items[]] pairs (newest date first).
      var grouped = Store.groupExpensesByDate(feed);
      var html = '';
      grouped.forEach(function (pair) {
        var label = pair[0];
        var items = pair[1]
          .map(function (e) { return Render.expenseItem(e, e.net, e.contextLabel); })
          .join('');
        html += Render.dateSection(label, items);
      });
      // RESET via fresh innerHTML so re-shows never duplicate activity rows.
      activityList.innerHTML = html;
    }
  }

  // ── Lifecycle ────────────────────────────────────────────
  function init(root, params) {
    // No one-time heavy build — all rendering happens in onShow so the
    // highest-traffic home tab always reflects the latest Store state.
  }

  function onShow(root, params) {
    renderHero(root);
    renderGroups(root);
    renderActivity(root);
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / sheets / viewport handlers).
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('home-dashboard', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="home-dashboard"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
