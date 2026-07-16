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

  // ── Inline SVGs reused by the get-started checklist (mirror js/icons.js) ──
  var CL_ICON = {
    check:      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>',
    chevron:    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/></svg>',
    group:      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z"/></svg>',
    receipt:    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M72,104a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,104Zm8,40h96a8,8,0,0,0,0-16H80a8,8,0,0,0,0,16ZM232,56V208a8,8,0,0,1-11.58,7.15L192,200.94l-28.42,14.21a8,8,0,0,1-7.16,0L128,200.94,99.58,215.15a8,8,0,0,1-7.16,0L64,200.94,35.58,215.15A8,8,0,0,1,24,208V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Zm-16,0H40V195.06l20.42-10.22a8,8,0,0,1,7.16,0L96,199.06l28.42-14.22a8,8,0,0,1,7.16,0L160,199.06l28.42-14.22a8,8,0,0,1,7.16,0L216,195.06Z"/></svg>',
    userPlus:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M256,136a8,8,0,0,1-8,8H232v16a8,8,0,0,1-16,0V144H200a8,8,0,0,1,0-16h16V112a8,8,0,0,1,16,0v16h16A8,8,0,0,1,256,136Zm-57.87,58.85a8,8,0,0,1-12.26,10.3C165.75,181.19,138.09,168,108,168s-57.75,13.19-77.87,37.15a8,8,0,0,1-12.25-10.3c14.94-17.78,33.52-30.41,54.17-37.17a68,68,0,1,1,71.9,0C164.6,164.44,183.18,177.07,198.13,194.85ZM108,152a52,52,0,1,0-52-52A52.06,52.06,0,0,0,108,152Z"/></svg>',
    image:      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,172l52-52,80,80H40Zm176,28H194.63l-36-36,20-20L216,181.38V200ZM144,100a12,12,0,1,1,12,12A12,12,0,0,1,144,100Z"/></svg>'
  };

  var PREFS_KEY = 'settlr_prefs';
  function prefsGet(key) {
    try { var p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {}; return p[key]; }
    catch (e) { return undefined; }
  }
  function prefsSet(key, val) {
    try {
      var p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {};
      p[key] = val;
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch (e) {}
  }

  // ── Get-started checklist (dismissible; hidden once all steps done) ──
  function checklistRowHTML(step) {
    if (step.done) {
      // Completed step — green icon-wrap with a check, non-interactive.
      return '<div class="settings-row settings-row--no-pointer">' +
        '<div class="settings-row__icon-wrap settings-row__icon-wrap--green"><span class="icon-holder" aria-hidden="true">' + CL_ICON.check + '</span></div>' +
        '<div class="settings-row__text"><span class="settings-row__label">' + step.label + '</span></div>' +
      '</div>';
    }
    // Pending step — links to the action, brand icon-wrap + chevron.
    return '<a href="' + step.href + '" class="settings-row">' +
      '<div class="settings-row__icon-wrap settings-row__icon-wrap--brand"><span class="icon-holder" aria-hidden="true">' + step.icon + '</span></div>' +
      '<div class="settings-row__text"><span class="settings-row__label">' + step.label + '</span></div>' +
      '<div class="settings-row__right"><span class="settings-row__chevron"><span class="icon-holder" aria-hidden="true">' + CL_ICON.chevron + '</span></span></div>' +
    '</a>';
  }

  function renderChecklist(root) {
    var wrap = root.querySelector('#js-checklist');
    var card = root.querySelector('#js-checklist-card');
    if (!wrap || !card) return;

    // Permanently dismissed — never show again.
    if (prefsGet('checklistDismissed')) { wrap.hidden = true; return; }

    var user = Store.getCurrentUser();
    var steps = [
      { done: Store.getGroups().length > 0,        label: 'Create your first group', href: 'create-group-name', icon: CL_ICON.group },
      { done: Store.getActivityFeed().length > 0,  label: 'Add an expense',          href: 'add-amount',        icon: CL_ICON.receipt },
      { done: Store.getContacts().length > 0,      label: 'Add people',              href: 'add-friend',        icon: CL_ICON.userPlus },
      { done: !!(user && user.photo),              label: 'Add a profile photo',     href: 'edit-profile',      icon: CL_ICON.image }
    ];

    // All steps done — hide entirely (treat as complete).
    if (steps.every(function (s) { return s.done; })) { wrap.hidden = true; return; }

    card.innerHTML = steps.map(checklistRowHTML).join('');
    wrap.hidden = false;
  }

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
      // UX-20: a brand-new account has settled nothing \u2014 only claim "All settled
      // up" when there is actual history (expenses or settlements).
      var hasHistory = (Store.getActivityFeed() || []).length > 0 ||
                       (Store.getAllSettlements() || []).length > 0;
      labelEl.textContent  = hasHistory ? 'All settled up' : 'Nothing to settle yet';
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
    // One-time: the checklist Dismiss button persists a prefs flag (idempotent).
    var dismissBtn = root.querySelector('#js-checklist-dismiss');
    if (dismissBtn && !dismissBtn._wired) {
      dismissBtn._wired = true;
      dismissBtn.addEventListener('click', function () {
        prefsSet('checklistDismissed', true);
        var wrap = root.querySelector('#js-checklist');
        if (wrap) wrap.hidden = true;
      });
    }
  }

  function onShow(root, params) {
    renderHero(root);
    renderChecklist(root);
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
