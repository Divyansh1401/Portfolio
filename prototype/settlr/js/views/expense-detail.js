/* ============================================================
   Settlr — Expense Detail view module
   Former inline IIFE from screens/expense-detail.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views. The expense id
   comes from `params.id` (router) with a fallback to the URL query string for
   standalone use of screens/expense-detail.html.
   ============================================================ */
(function () {
  'use strict';

  function resolveId(root, params) {
    if (params && params.id) return params.id;
    return new URLSearchParams(location.search).get('id');
  }

  function init(root, params) {
    // One-time wiring: cache nothing heavy here; the build runs in onShow so
    // navigating back re-derives the latest Store state. Listeners that must
    // survive re-show are attached once in onShow guarded by a flag.
  }

  function onShow(root, params) {
    var id = resolveId(root, params);
    if (!id) { navigateAway(); return; }

    var allExpenses = Store.getActivityFeed();
    var exp = allExpenses.find(function (e) { return e.id === id; });
    if (!exp) { navigateAway(); return; }

    var user  = Store.getCurrentUser();
    var share = Math.round(exp.totalAmount / exp.splitAmong.length * 100) / 100;
    var net   = Store._computeUserNet(exp);

    function navigateAway() {
      if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('home-dashboard');
      else location.replace('home-dashboard');
    }

    // Helper: contact name
    function nameOf(cid) {
      if (cid === user.id) return 'You';
      var c = Store.getContact(cid);
      return c ? c.name : cid;
    }
    function initialsOf(cid) {
      if (cid === user.id) return user.initials;
      var c = Store.getContact(cid);
      return c ? c.initials : cid.slice(0, 2).toUpperCase();
    }

    // Hero
    root.querySelector('.expense-hero__category').textContent = exp.emoji + ' ' + (exp.category || '');
    root.querySelector('.expense-hero__amount').textContent = Store.formatIn(exp.totalAmount, exp.currency);
    root.querySelector('.expense-hero__desc').textContent = exp.title;
    var d = new Date(exp.date + 'T00:00:00');
    var dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    var timeStr = Store.formatTime(exp.occurredAt);
    root.querySelector('.expense-hero__date').textContent =
      timeStr ? dateStr + ' \u00b7 ' + timeStr : dateStr;

    var balEl = root.querySelector('.balance-pill');
    var balLabel = balEl.querySelector('.balance-pill__label');
    var balAmount = balEl.querySelector('.balance-pill__amount');
    if (net.direction === 'settled') {
      balEl.className = 'balance-pill balance-pill--settled text-title-sm';
      balLabel.textContent = 'Settled';
      balAmount.textContent = '';
    } else if (net.direction === 'lent') {
      balEl.className = 'balance-pill balance-pill--lent text-title-sm';
      balLabel.textContent = 'You get back';
      balAmount.textContent = Store.formatIn(net.amount, exp.currency);
      balAmount.className = 'balance-pill__amount text-amount-sm';
    } else {
      balEl.className = 'balance-pill balance-pill--owe text-title-sm';
      balLabel.textContent = 'You owe';
      balAmount.textContent = Store.formatIn(net.amount, exp.currency);
      balAmount.className = 'balance-pill__amount text-amount-sm';
    }

    // Detail rows
    var rows = root.querySelectorAll('.detail-row');
    // Row 0: Group or Contact
    if (exp.groupId) {
      var g = Store.getGroup(exp.groupId);
      rows[0].querySelector('.detail-row__icon').textContent = g ? g.emoji : '👥';
      rows[0].querySelector('.detail-row__label').textContent = 'Group';
      rows[0].querySelector('.detail-row__value').textContent = g ? g.name : exp.groupId;
      rows[0].style.cursor = 'pointer';
      rows[0].onclick = function () {
        if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('group-detail', { id: exp.groupId });
        else location.href = 'group-detail?id=' + exp.groupId;
      };
    } else {
      var co = Store.getContact(exp.contactId);
      rows[0].querySelector('.detail-row__icon').textContent = '👤';
      rows[0].querySelector('.detail-row__label').textContent = 'With';
      rows[0].querySelector('.detail-row__value').textContent = co ? co.name : exp.contactId;
      var chev = rows[0].querySelector('.detail-row__chevron');
      if (chev) chev.remove();
    }
    // Row 1: Paid by (multi-payer aware)
    rows[1].querySelector('.detail-row__value').textContent =
      Store.getPayerSummary(exp).label + ' paid ' + Store.formatIn(exp.totalAmount, exp.currency);
    // Row 2: Date
    rows[2].querySelector('.detail-row__value').textContent =
      d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    // Row 3: Split
    rows[3].querySelector('.detail-row__value').textContent =
      'Equal — ' + exp.splitAmong.length + ' people';

    // Split breakdown
    root.querySelector('.split-section__method').textContent =
      exp.splitAmong.length + ' people · Equal';
    var container = root.querySelector('.split-section');
    // Remove existing person rows (reset before re-appending)
    container.querySelectorAll('.split-person').forEach(function (el) { el.remove(); });
    exp.splitAmong.forEach(function (cid) {
      // Net = what they paid − their share. >0 gets back, <0 owes, 0 settled.
      var paid = exp.payers ? (parseFloat(exp.payers[cid]) || 0) : (exp.paidById === cid ? exp.totalAmount : 0);
      var net = Math.round((paid - share) * 100) / 100;
      var div = document.createElement('div');
      div.className = 'split-person';
      var amtClass, amtText;
      if (net > 0.005) {
        amtClass = 'split-person__amount--lent';
        amtText = 'gets back ' + Store.formatIn(net, exp.currency);
      } else if (net < -0.005) {
        amtClass = 'split-person__amount--owe';
        amtText = 'owes ' + Store.formatIn(-net, exp.currency);
      } else {
        amtClass = 'split-person__amount--self';
        amtText = 'settled';
      }
      div.innerHTML =
        '<div class="split-person__avatar avatar avatar--sm text-label-xs">' + initialsOf(cid) + '</div>' +
        '<span class="split-person__name text-title-sm">' + nameOf(cid) + '</span>' +
        '<span class="split-person__amount ' + amtClass + ' text-title-sm">' + amtText + '</span>';
      container.appendChild(div);
    });

    // Notes
    var notesCard = root.querySelector('.notes-card__text');
    var notesSection = root.querySelector('.notes-section');
    if (exp.notes) {
      notesCard.textContent = exp.notes;
      if (notesSection) notesSection.style.display = '';
    } else if (notesSection) {
      notesSection.style.display = 'none';
    }

    // Edit button
    root.querySelector('.btn-edit').href = 'edit-expense?id=' + id;

    // ── Comments ──────────────────────────────────────────

    function _relativeTime(isoString) {
      var diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
      if (diff < 60)    return 'just now';
      if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      if (diff < 172800) return 'Yesterday';
      var dd = new Date(isoString);
      return dd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    // Escape user-authored strings — comments are now CROSS-USER (a co-participant's
    // text/name renders in my DOM), so unescaped innerHTML would be stored XSS.
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function renderComments() {
      var comments = Store.getComments(id);
      var list = root.querySelector('#comments-list');
      var countEl = root.querySelector('#comments-count');
      countEl.textContent = comments.length ? comments.length : '';
      list.innerHTML = '';
      if (!comments.length) {
        list.innerHTML = '<div class="comments-empty">No comments yet. Be the first!</div>';
        return;
      }
      comments.forEach(function (c) {
        var author = c.authorId === user.id
          ? { name: 'You', initials: user.initials }
          : (function () {
              var ct = Store.getContact(c.authorId);
              return ct ? { name: ct.name, initials: ct.initials } : { name: 'Someone', initials: '?' };
            })();
        var item = document.createElement('div');
        item.className = 'comment-item';
        item.innerHTML =
          '<div class="comment-item__avatar">' + esc(author.initials) + '</div>' +
          '<div class="comment-item__body">' +
            '<div class="comment-item__meta">' +
              '<span class="comment-item__name">' + esc(author.name) + '</span>' +
              '<span class="comment-item__time">' + esc(_relativeTime(c.createdAt)) + '</span>' +
            '</div>' +
            '<p class="comment-item__text">' + esc(c.text) + '</p>' +
          '</div>';
        list.appendChild(item);
      });
    }

    // Grow the textarea to fit its content; CSS max-height caps it (~5 lines)
    // and enables internal scroll beyond that. Collapses back when cleared.
    function autosize(ta) {
      if (!ta) return;
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }

    function submitComment() {
      var input = root.querySelector('#comment-text');
      var text = input.value.trim();
      if (!text) return;
      Store.addComment(id, text);
      input.value = '';
      autosize(input); // collapse back to one row
      renderComments();
    }

    // Attach comment listeners once per view (idempotent across re-shows).
    var sendBtn = root.querySelector('#comment-send');
    var textInput = root.querySelector('#comment-text');
    if (sendBtn && !sendBtn._wired) {
      sendBtn._wired = true;
      sendBtn.addEventListener('click', submitComment);
    }
    if (textInput && !textInput._wired) {
      textInput._wired = true;
      textInput.addEventListener('input', function () { autosize(textInput); });
      textInput.addEventListener('keydown', function (e) {
        // Multiline textarea: Enter submits, Shift+Enter inserts a newline.
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
      });
    }
    autosize(textInput); // set initial one-row height (handles re-show)

    renderComments();

    // Delete — keep a global confirmDelete for the footer button's inline
    // onclick. Re-pointed each show to the current expense id.
    window.confirmDelete = function () {
      if (confirm('Delete this expense? This cannot be undone.')) {
        Store.deleteExpense(id);
        if (window.SettlrRouterSPA) {
          window.SettlrRouterSPA.navigate('home-dashboard');
        } else {
          history.length > 1 ? history.back() : location.replace('home-dashboard');
        }
      }
    };
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers). Comment
    // listeners are attached idempotently and live with the in-DOM view.
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('expense-detail', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="expense-detail"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
