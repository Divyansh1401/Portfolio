/* ============================================================
   Settlr — Group Detail view module
   Former inline IIFEs from screens/group-detail.html (header/balance build,
   transactions + balances render, footer scroll detection, tab switching),
   adapted to the compiled-shell lifecycle. All DOM lookups are scoped to
   `root` (the view <section>) so they never collide with other in-DOM views.
   The group id comes from `params.id` (router) with a fallback to the URL
   query string for standalone use of screens/group-detail.html.
   ============================================================ */
(function () {
  'use strict';

  function resolveId(root, params) {
    if (params && params.id) return params.id;
    return new URLSearchParams(location.search).get('id') || 'goa-trip';
  }

  function navigateAway() {
    if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('home-dashboard');
    else location.replace('home-dashboard');
  }

  function init(root, params) {
    // One-time wiring: tab switching + footer scroll detection are attached
    // once here (guarded by flags) so they survive re-shows. Data build runs
    // in onShow so navigating back re-derives the latest Store state.

    // ── Tab Switching ──
    var tabs = root.querySelectorAll('.segment-item');
    var panels = root.querySelectorAll('.tab-panel');
    tabs.forEach(function (tab) {
      if (tab._wiredTab) return;
      tab._wiredTab = true;
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        panels.forEach(function (p) { p.classList.remove('is-active'); });
        tab.classList.add('is-active');
        var target = tab.getAttribute('data-tab');
        var panel = root.querySelector('#tab-' + target);
        if (panel) panel.classList.add('is-active');
      });
    });

    // ── Footer Scroll Detection ──
    var footer = root.querySelector('.screen-footer');
    var scrollEl = root.querySelector('.view__content');
    if (footer && scrollEl && !scrollEl._wiredScroll) {
      scrollEl._wiredScroll = true;
      scrollEl.addEventListener('scroll', function () {
        footer.classList.toggle('is-scrolled', scrollEl.scrollTop > 0);
      }, { passive: true });
    }

    // ── Settle a member from the Balances tab (delegated; survives rebuilds) ──
    // Tapping a member balance row opens the settle flow tagged to THIS group.
    var balPanel = root.querySelector('#tab-balances');
    if (balPanel && !balPanel._wiredSettle) {
      balPanel._wiredSettle = true;
      balPanel.addEventListener('click', function (e) {
        var row = e.target.closest('.balance-row');
        if (!row || !balPanel.contains(row) || !row.dataset.id) return;
        var nav = { contactId: row.dataset.id, groupId: root._groupId };
        if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('settle-amount', nav);
        else location.href = 'settle-amount?contactId=' + nav.contactId + '&groupId=' + nav.groupId;
      });
    }
  }

  function onShow(root, params) {
    var groupId = resolveId(root, params);
    var group = Store.getGroup(groupId);
    if (!group) { navigateAway(); return; }
    root._groupId = groupId; // used by the delegated balance-row → settle handler

    // ── Header ──
    var avatarEmojiEl = root.querySelector('#js-group-avatar-emoji');
    var nameEl = root.querySelector('#js-group-name-detail');
    if (avatarEmojiEl) avatarEmojiEl.textContent = group.emoji;
    if (nameEl) nameEl.textContent = group.name;
    document.title = 'Settlr — ' + group.name;

    // ── Balance label + amount ──
    var bal = Store.getGroupBalance(groupId);
    var labelEl = root.querySelector('#js-group-balance-label');
    var amountEl = root.querySelector('#js-group-balance-amount');
    if (bal.direction === 'lent') {
      labelEl.textContent = 'Overall you lent';
      labelEl.className = 'info-section__label info-section__label--lent';
      amountEl.className = 'info-section__amount text-amount-md info-section__amount--lent';
      amountEl.textContent = Store.formatINR(bal.amount);
    } else if (bal.direction === 'owe') {
      labelEl.textContent = 'Overall you owe';
      labelEl.className = 'info-section__label info-section__label--owe';
      amountEl.className = 'info-section__amount text-amount-md info-section__amount--owe';
      amountEl.textContent = Store.formatINR(bal.amount);
    } else {
      labelEl.textContent = 'All settled up';
      labelEl.className = 'info-section__label';
      amountEl.className = 'info-section__amount text-amount-md';
      amountEl.textContent = '₹0';
    }

    // ── Transactions tab ── (reset to its empty-state shell before rebuild) ──
    var txnPanel = root.querySelector('#tab-transactions');
    var txnEmpty = txnPanel ? txnPanel.querySelector('.tab-empty') : null;
    if (txnPanel) {
      txnPanel.classList.remove('is-empty');
      txnPanel.innerHTML = '';
      if (txnEmpty) txnPanel.appendChild(txnEmpty);
    }

    var currentUser = Store.getCurrentUser();
    var meId = currentUser.id;
    var expenses = Store.getExpenses(groupId);
    // Merge in group-scoped settlements so the history shows a record of them.
    var settlements = Store.getGroupSettlements(groupId).map(function (s) {
      return Object.assign({}, s, { _settlement: true });
    });
    // Interleave by transaction time (newest first) so same-day expenses and
    // settlements stay chronological rather than all-expenses-then-settlements.
    var merged = expenses.concat(settlements).sort(function (a, b) {
      return (b.occurredAt || b.date || '').localeCompare(a.occurredAt || a.date || '');
    });
    var grouped = Store.groupExpensesByDate(merged);
    var txnHtml = '';
    grouped.forEach(function (pair) {
      var label = pair[0];
      var items = pair[1];
      var itemsHtml = items.map(function (it) {
        if (it._settlement) {
          var otherId = it.fromId === meId ? it.toId : it.fromId;
          var other = Store.getContact(otherId);
          return Render.settlementRow(it, other ? other.name.split(' ')[0] : otherId, it.fromId === meId);
        }
        var net = Store._computeUserNet(it);
        var contextLabel = Store.getPayerSummary(it).label + ' paid \u00b7 ' + Store.formatINR(it.totalAmount) + ' total';
        return Render.txnItem(it, net, contextLabel);
      }).join('');
      txnHtml += Render.dateSection(label, itemsHtml);
    });
    if (txnPanel) {
      if (txnHtml) {
        txnPanel.innerHTML = txnHtml;
      } else {
        txnPanel.classList.add('is-empty');
      }
    }

    // ── Balances tab ── (reset to its empty-state shell before rebuild) ──
    var balPanel = root.querySelector('#tab-balances');
    var balEmpty = balPanel ? balPanel.querySelector('.tab-empty') : null;
    if (balPanel) {
      balPanel.classList.remove('is-empty');
      balPanel.innerHTML = '';
      if (balEmpty) balPanel.appendChild(balEmpty);
    }

    var members = Store.getMemberBalancesForGroup(groupId);
    var balHtml = members.map(function (m) { return Render.balanceRow(m); }).join('');
    if (balPanel) {
      if (balHtml) {
        balPanel.innerHTML = balHtml;
      } else {
        balPanel.classList.add('is-empty');
      }
    }

    // ── Cross-screen navigation targets (re-point each show to this group) ──
    function setNav(sel, slug) {
      var el = root.querySelector(sel);
      if (!el) return;
      el.onclick = function (ev) {
        if (window.SettlrRouterSPA) {
          ev.preventDefault();
          window.SettlrRouterSPA.navigate(slug, { id: groupId });
        } else {
          el.setAttribute('href', slug + '?id=' + groupId);
        }
      };
      if (!window.SettlrRouterSPA) el.setAttribute('href', slug + '?id=' + groupId);
    }
    setNav('.hero-section__actions a[aria-label="Edit group"]', 'edit-group');

    // "Add expense" carries this group as context so the flow pre-fills the
    // members and skips the people-picker step (handled in add-amount).
    var addBtn = root.querySelector('.screen-footer a.btn--primary');
    if (addBtn) {
      addBtn.onclick = function (ev) {
        if (window.SettlrRouterSPA) {
          ev.preventDefault();
          window.SettlrRouterSPA.navigate('add-amount', { groupId: groupId });
        } else {
          addBtn.setAttribute('href', 'add-amount?groupId=' + groupId);
        }
      };
      if (!window.SettlrRouterSPA) addBtn.setAttribute('href', 'add-amount?groupId=' + groupId);
    }

    // "Settle up" → settle-select SCOPED to this group (groupId, not id) so the
    // whole settle flow stays tagged to the group.
    var settleBtn = root.querySelector('.screen-footer a.btn--secondary');
    if (settleBtn) {
      settleBtn.onclick = function (ev) {
        if (window.SettlrRouterSPA) {
          ev.preventDefault();
          window.SettlrRouterSPA.navigate('settle-select', { groupId: groupId });
        } else {
          settleBtn.setAttribute('href', 'settle-select?groupId=' + groupId);
        }
      };
      if (!window.SettlrRouterSPA) settleBtn.setAttribute('href', 'settle-select?groupId=' + groupId);
    }

    // Back button → replay the inverse of the transition that brought us here
    // (router-aware). Falls back to home-dashboard for deep-link entries.
    var backEl = root.querySelector('.hero-section__actions a[aria-label="Back"]');
    if (backEl) {
      backEl.onclick = function (ev) {
        if (window.SettlrRouterSPA) {
          ev.preventDefault();
          window.SettlrRouterSPA.back('home-dashboard');
        }
      };
    }
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers). Tab and
    // scroll listeners are attached idempotently in init and live with the
    // in-DOM view.
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('group-detail', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="group-detail"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
