/* ============================================================
   Settlr — Search view module
   Searches live Store data (contacts, groups, expenses) and renders result
   rows with real `?id=` links so tapping a result opens the right detail
   screen. All DOM lookups are scoped to `root` (the view <section>).

   - init   : one-time wiring of the input (oninput), clear button, recents
              "clear all", and the recent-search chips.
   - onShow : resets the search box to its empty/default state (recents shown)
              so re-opening never shows a stale query or leftover rows.
   - onHide : nothing persistent to tear down.
   ============================================================ */
(function () {
  'use strict';

  var CHEVRON_SVG  = '<span class="result-chevron"><span class="icon-holder" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/></svg></span></span>';
  var GROUP_SVG    = '<span class="icon-holder" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M176,216a8,8,0,0,1-8,8H24a8,8,0,0,1,0-16H168A8,8,0,0,1,176,216ZM247.86,93.15a8,8,0,0,1-3.76,5.39l-147.41,88a40.18,40.18,0,0,1-20.26,5.52,39.78,39.78,0,0,1-27.28-10.87l-.12-.12L13,145.8a16,16,0,0,1,4.49-26.21l3-1.47a8,8,0,0,1,6.08-.4l28.26,9.54L75,115.06,53.17,93.87A16,16,0,0,1,57.7,67.4l.32-.13,7.15-2.71a8,8,0,0,1,5.59,0L124.7,84.38,176.27,53.6a39.82,39.82,0,0,1,51.28,9.12l.12.15,18.64,23.89A8,8,0,0,1,247.86,93.15Z"/></svg></span>';
  var EXPENSE_SVG  = '<span class="icon-holder" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M216,72H32V48a8,8,0,0,0-16,0V208a8,8,0,0,0,16,0V176H240v32a8,8,0,0,0,16,0V112A40,40,0,0,0,216,72ZM32,88h72v72H32Zm88,72V88h96a24,24,0,0,1,24,24v48Z"/></svg></span>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function sectionHeader(label) {
    return '<div class="section-header"><span class="section-header__label">' + esc(label) + '</span></div>';
  }

  // {amount, direction} → label + coloured amount — the same visual language as
  // the People screen rows (UX-01: no +/- signs). isGroup switches the label to
  // the group wording. Settled still renders the chevron.
  function amountHtml(bal, isGroup) {
    if (!bal || bal.direction === 'settled') return CHEVRON_SVG;
    var dir   = bal.direction;
    var label = isGroup
      ? (dir === 'lent' ? 'Overall lent' : 'Overall owe')
      : (dir === 'lent' ? 'You lent' : 'You owe');
    return '<div class="expense-item__right">' +
      '<span class="expense-item__label expense-item__label--' + dir + '">' + label + '</span>' +
      '<span class="expense-item__amount expense-item__amount--' + dir + '">' + Store.formatINR(bal.amount) + '</span>' +
    '</div>';
  }

  function personRow(c) {
    return '<a href="individual-detail?id=' + encodeURIComponent(c.id) + '" class="result-row">' +
      '<div class="result-avatar">' + esc(c.initials) + '</div>' +
      '<div class="result-text">' +
        '<p class="result-text__name text-title-sm">' + esc(c.name) + '</p>' +
        '<p class="result-text__meta">' + esc(Store.formatPhone(c.phone) || 'Contact') + '</p>' +
      '</div>' +
      '<div class="result-right">' + amountHtml(Store.getContactBalance(c.id)) + '</div>' +
    '</a>';
  }

  function groupRow(g) {
    var members = g.memberCount != null ? g.memberCount : (g.memberIds ? g.memberIds.length : 0);
    var icon = g.emoji ? esc(g.emoji) : GROUP_SVG;
    return '<a href="group-detail?id=' + encodeURIComponent(g.id) + '" class="result-row">' +
      '<div class="result-avatar result-avatar--group">' + icon + '</div>' +
      '<div class="result-text">' +
        '<p class="result-text__name text-title-sm">' + esc(g.name) + '</p>' +
        '<p class="result-text__meta">' + members + ' members</p>' +
      '</div>' +
      '<div class="result-right">' + amountHtml(Store.getGroupBalance(g.id), true) + '</div>' +
    '</a>';
  }

  function expenseRow(e) {
    var icon = e.emoji ? esc(e.emoji) : EXPENSE_SVG;
    return '<a href="expense-detail?id=' + encodeURIComponent(e.id) + '" class="result-row">' +
      '<div class="result-avatar result-avatar--expense">' + icon + '</div>' +
      '<div class="result-text">' +
        '<p class="result-text__name text-title-sm">' + esc(e.title) + '</p>' +
        '<p class="result-text__meta">' + esc(e.contextLabel || '') + '</p>' +
      '</div>' +
      '<div class="result-right">' + amountHtml(e.net) + '</div>' +
    '</a>';
  }

  // ── Core filter routine — queries the Store ──────────────
  function handleSearch(root, query) {
    var clearBtn  = root.querySelector('#js-clear-btn');
    var recents   = root.querySelector('#js-recents');
    var results   = root.querySelector('#js-results');
    var noResults = root.querySelector('#js-no-results');

    if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';

    if (!query.trim()) {
      if (recents)   recents.style.display = '';
      if (results)   results.style.display = 'none';
      if (noResults) noResults.style.display = 'none';
      return;
    }

    if (recents) recents.style.display = 'none';
    var q = query.trim().toLowerCase();

    var people = (Store.getContacts() || []).filter(function (c) {
      return (c.name || '').toLowerCase().indexOf(q) !== -1;
    });
    var groups = (Store.getGroups() || []).filter(function (g) {
      return (g.name || '').toLowerCase().indexOf(q) !== -1;
    });
    var expenses = (Store.getActivityFeed() || []).filter(function (e) {
      return e.totalAmount != null && (e.title || '').toLowerCase().indexOf(q) !== -1;
    });

    var peopleEl  = root.querySelector('#js-people-results');
    var groupEl   = root.querySelector('#js-group-results');
    var expenseEl = root.querySelector('#js-expense-results');
    if (peopleEl)  peopleEl.innerHTML  = people.length   ? sectionHeader('People')   + people.map(personRow).join('')   : '';
    if (groupEl)   groupEl.innerHTML   = groups.length   ? sectionHeader('Groups')   + groups.map(groupRow).join('')    : '';
    if (expenseEl) expenseEl.innerHTML = expenses.length ? sectionHeader('Expenses') + expenses.map(expenseRow).join('') : '';

    // Dividers only between two non-empty sections.
    var dP = root.querySelector('.section-divider[data-divider="people"]');
    var dG = root.querySelector('.section-divider[data-divider="group"]');
    if (dP) dP.style.display = (people.length && (groups.length || expenses.length)) ? '' : 'none';
    if (dG) dG.style.display = (groups.length && expenses.length) ? '' : 'none';

    var total = people.length + groups.length + expenses.length;
    var countEl = root.querySelector('#js-results-count');
    if (countEl) countEl.textContent = total + ' result' + (total !== 1 ? 's' : '');
    if (results)   results.style.display = total ? '' : 'none';
    if (noResults) noResults.style.display = total ? 'none' : '';
  }

  function setSearch(root, text) {
    var input = root.querySelector('#js-search-input');
    if (!input) return;
    input.value = text;
    handleSearch(root, text);
  }

  function clearSearch(root) {
    var input = root.querySelector('#js-search-input');
    if (!input) return;
    input.value = '';
    handleSearch(root, '');
    input.focus();
  }

  function clearRecents(root) {
    root.querySelectorAll('.recents-row .chip').forEach(function (c) { c.remove(); });
  }

  // ── Lifecycle ────────────────────────────────────────────
  function init(root) {
    var input = root.querySelector('#js-search-input');
    if (input) {
      input.addEventListener('input', function () { handleSearch(root, this.value); });
    }

    var clearBtn = root.querySelector('#js-clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', function () { clearSearch(root); });

    var clearRecentsBtn = root.querySelector('#js-clear-recents');
    if (clearRecentsBtn) clearRecentsBtn.addEventListener('click', function () { clearRecents(root); });

    // Recent-search chips — each carries its query in data-query.
    root.querySelectorAll('.recents-row .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        setSearch(root, chip.dataset.query || chip.textContent.trim());
      });
    });
  }

  function onShow(root) {
    // Reset to the empty/default state so a re-open never shows a stale query
    // or leftover result rows.
    var input = root.querySelector('#js-search-input');
    if (input) input.value = '';
    handleSearch(root, '');
  }

  function onHide() {}

  if (window.SettlrViews) {
    window.SettlrViews.register('search', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="search"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
