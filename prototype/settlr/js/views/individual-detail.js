/* ============================================================
   Settlr — Individual (contact) Detail view module
   Former inline IIFEs from screens/individual-detail.html (header/balance
   build, transactions + common-groups render, footer scroll detection,
   favourite toggle/restore, tab switching), adapted to the compiled-shell
   lifecycle. All DOM lookups are scoped to `root` (the view <section>) so they
   never collide with other in-DOM views. The contact id comes from `params.id`
   (router) with a fallback to the URL query string for standalone use of
   screens/individual-detail.html.
   ============================================================ */
(function () {
  'use strict';

  function resolveId(root, params) {
    if (params && params.id) return params.id;
    return new URLSearchParams(location.search).get('id') || 'johnnie-walker';
  }

  function navigateAway() {
    if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('home-dashboard');
    else location.replace('home-dashboard');
  }

  function _shortDate(iso) {
    var d = new Date(iso + 'T00:00:00');
    var day = d.getDate();
    var mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    return day + ' ' + mon;
  }

  // Star SVGs inlined verbatim from js/icons.js (regular) and js/icons-fill.js
  // (fill), since the icon-upgrade pipeline is removed in the compiled shell.
  var STAR_REGULAR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Zm-15.34,5.47-48.7,42a8,8,0,0,0-2.56,7.91l14.88,62.8a.37.37,0,0,1-.17.48c-.18.14-.23.11-.38,0l-54.72-33.65a8,8,0,0,0-8.38,0L69.09,215.94c-.15.09-.19.12-.38,0a.37.37,0,0,1-.17-.48l14.88-62.8a8,8,0,0,0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16A8,8,0,0,0,103,91.86l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153,91.86a8,8,0,0,0,6.75,4.92l63.92,5.16c.15,0,.24,0,.33.29S224,102.63,223.84,102.73Z"/></svg>';
  var STAR_FILL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"/></svg>';

  // Favourite toggle (per-contact, persisted in localStorage). Scoped to the
  // button element; safe to call to set state from restore too. Returns the
  // resulting favourite boolean. Swaps the inline star SVG between regular and
  // fill weight (mirrors the original ph / ph-fill class swap).
  function applyFavourite(btn, nextFav) {
    var icon = btn.querySelector('.icon-holder');
    btn.setAttribute('aria-pressed', String(nextFav));
    btn.setAttribute('aria-label', nextFav ? 'Remove from favourites' : 'Add to favourites');
    if (icon) {
      icon.innerHTML = nextFav ? STAR_FILL : STAR_REGULAR;
    }
    btn.classList.toggle('is-favourite', nextFav);
    return nextFav;
  }

  function toggleFavourite(btn, contactId) {
    var isFav = btn.getAttribute('aria-pressed') === 'true';
    var nextFav = !isFav;
    applyFavourite(btn, nextFav);
    try {
      if (contactId) {
        var key = 'settlr_favourites';
        var favs = JSON.parse(localStorage.getItem(key) || '[]');
        if (nextFav && favs.indexOf(contactId) === -1) favs.push(contactId);
        if (!nextFav) favs = favs.filter(function (x) { return x !== contactId; });
        localStorage.setItem(key, JSON.stringify(favs));
      }
    } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // Dynamic confirm bottom-sheet (mirrors settings.js confirmSheet) — built on the
  // fly so no static markup is needed. onConfirm runs only on the confirm action.
  // opts.title/body/confirmLabel are ESCAPED: the unlink title carries a cross-user
  // contact name (from get_connection_profiles) — a stored-XSS sink otherwise.
  function confirmSheet(opts, onConfirm) {
    var overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    overlay.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="js-idv-confirm-title">' +
        '<div class="sheet__handle"><div class="sheet__handle-bar"></div></div>' +
        '<div class="sheet__header"><span class="sheet__title" id="js-idv-confirm-title">' + esc(opts.title) + '</span></div>' +
        '<div class="sheet__content" style="display:flex; flex-direction:column; gap:var(--spacing-12); padding-bottom:var(--spacing-24)">' +
          (opts.body ? '<p class="text-body-sm" style="color:var(--text-secondary); margin:0">' + esc(opts.body) + '</p>' : '') +
          '<button type="button" class="btn btn--lg btn--full btn--destructive" data-act="confirm"><span class="btn__content">' + esc(opts.confirmLabel || 'Confirm') + '</span></button>' +
          '<button type="button" class="btn btn--lg btn--full btn--ghost" data-act="cancel"><span class="btn__content">Cancel</span></button>' +
        '</div>' +
      '</div>';
    function close() { overlay.remove(); }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-act="cancel"]')) { close(); return; }
      if (e.target.closest('[data-act="confirm"]')) { close(); onConfirm(); }
    });
    document.body.appendChild(overlay);
    var cancelBtn = overlay.querySelector('[data-act="cancel"]');
    if (cancelBtn) cancelBtn.focus();
  }

  // Invite bottom-sheet for a ghost contact: shows the freshly-minted /i/<token>
  // link with Share (native → clipboard fallback) + Done. `url` and `name` are
  // ESCAPED (name is user-entered). Reuses .sheet + .invite-link-box components.
  function inviteSheet(url, name) {
    var overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    overlay.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="js-idv-invite-title">' +
        '<div class="sheet__handle"><div class="sheet__handle-bar"></div></div>' +
        '<div class="sheet__header"><span class="sheet__title" id="js-idv-invite-title">Invite ' + esc(name) + '</span></div>' +
        '<div class="sheet__content" style="display:flex; flex-direction:column; gap:var(--spacing-12); padding-bottom:var(--spacing-24)">' +
          '<p class="text-body-sm" style="color:var(--text-secondary); margin:0">Share this link. When they join through it they’ll connect with you and inherit what you’ve already split.</p>' +
          '<div class="invite-link-box"><span class="invite-link-box__url text-body-xs">' + esc(url) + '</span></div>' +
          '<button type="button" class="btn btn--lg btn--full btn--primary" data-act="share"><span class="btn__content"><span class="btn__label">Share link</span></span></button>' +
          '<button type="button" class="btn btn--lg btn--full btn--ghost" data-act="done"><span class="btn__content">Done</span></button>' +
        '</div>' +
      '</div>';
    function close() { overlay.remove(); }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-act="done"]')) { close(); return; }
      if (e.target.closest('[data-act="share"]')) {
        var data = { title: 'Settlr', text: 'Split expenses with me on Settlr', url: url };
        if (navigator.share) navigator.share(data).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {});
        close();
      }
    });
    document.body.appendChild(overlay);
    var shareBtn = overlay.querySelector('[data-act="share"]');
    if (shareBtn) shareBtn.focus();
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
  }

  function onShow(root, params) {
    var contactId = resolveId(root, params);
    var contact = Store.getContact(contactId);
    // Missing contact → bounce home, matching group-detail / expense-detail.
    // (Must NOT overwrite .view__content here: in the persistent shell that
    // permanently destroys this view's markup, breaking every later visit.)
    if (!contact) { navigateAway(); return; }

    // ── Header ──
    var initialsEl = root.querySelector('#js-person-initials');
    var nameEl = root.querySelector('#js-person-name');
    if (initialsEl) initialsEl.textContent = contact.initials;
    if (nameEl) nameEl.textContent = contact.name;
    document.title = 'Settlr — ' + contact.name;

    // ── Balance label + amount ──
    var bal = Store.getContactBalance(contactId);
    var labelEl = root.querySelector('#js-person-balance-label');
    var amountEl = root.querySelector('#js-person-balance-amount');
    if (bal.direction === 'lent') {
      labelEl.textContent = contact.name.split(' ')[0] + ' owes you';
      labelEl.className = 'info-section__label info-section__label--lent';
      amountEl.className = 'info-section__amount text-amount-md info-section__amount--lent';
      amountEl.textContent = Store.formatINR(bal.amount);
    } else if (bal.direction === 'owe') {
      labelEl.textContent = 'You owe ' + contact.name.split(' ')[0];
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
    var txnPanel = root.querySelector('#tab-transactions-indiv');
    var txnEmpty = txnPanel ? txnPanel.querySelector('.tab-empty') : null;
    if (txnPanel) {
      txnPanel.classList.remove('is-empty');
      txnPanel.innerHTML = '';
      if (txnEmpty) txnPanel.appendChild(txnEmpty);
    }

    var currentUser = Store.getCurrentUser();
    var meId = currentUser.id;
    var expenses = Store.getExpensesForContact(contactId);
    // Merge in settlements with this contact so the history shows them.
    var settlements = Store.getSettlements(contactId).map(function (s) {
      return Object.assign({}, s, { _settlement: true });
    });
    // Interleave expenses + settlements by transaction time (newest first) so
    // same-day rows stay chronological — concat alone would group all expenses
    // before all settlements regardless of time.
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
          var other = Store.getContact(contactId);
          return Render.settlementRow(it, other ? other.name.split(' ')[0] : contactId, it.fromId === meId);
        }
        var net = Store._computeUserNet(it);
        var contextLabel;
        if (it.groupId) {
          var grp = Store.getGroup(it.groupId);
          contextLabel = (grp ? grp.name : it.groupId) + ' \u00b7 ' + _shortDate(it.date);
        } else {
          contextLabel = Store.getPayerSummary(it).label + ' paid \u00b7 ' + _shortDate(it.date);
        }
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

    // ── Common Groups tab ── (reset to its empty-state shell before rebuild) ──
    var grpPanel = root.querySelector('#tab-groups');
    var grpEmpty = grpPanel ? grpPanel.querySelector('.tab-empty') : null;
    if (grpPanel) {
      grpPanel.classList.remove('is-empty');
      grpPanel.innerHTML = '';
      if (grpEmpty) grpPanel.appendChild(grpEmpty);
    }

    var groups = Store.getCommonGroups(contactId);
    var grpHtml = groups.map(function (g) {
      var gBal = Store.getGroupBalance(g.id);
      // members = other members in group excluding currentUser and this contact
      var members = g.memberIds
        .filter(function (mid) { return mid !== currentUser.id && mid !== contactId; })
        .map(function (mid) {
          var c = Store.getContact(mid);
          return c ? { initials: c.initials } : { initials: mid.slice(0, 2).toUpperCase() };
        });
      return Render.groupRow(g, gBal, members);
    }).join('');
    if (grpPanel) {
      if (grpHtml) {
        grpPanel.innerHTML = grpHtml;
      } else {
        grpPanel.classList.add('is-empty');
      }
    }

    // ── Favourite button ── (wire click once; restore persisted state each show)
    var favBtn = root.querySelector('#js-fav-btn');
    if (favBtn) {
      favBtn._contactId = contactId;
      if (!favBtn._wiredFav) {
        favBtn._wiredFav = true;
        favBtn.addEventListener('click', function () {
          toggleFavourite(favBtn, favBtn._contactId);
        });
      }
      // Restore: reflect stored favourite state for this contact.
      var isFav = false;
      try {
        var favs = JSON.parse(localStorage.getItem('settlr_favourites') || '[]');
        isFav = favs.indexOf(contactId) !== -1;
      } catch (e) {}
      applyFavourite(favBtn, isFav);
    }

    // ── Unlink button ── (only for LINKED real-user contacts; wire once)
    var unlinkBtn = root.querySelector('#js-unlink-btn');
    if (unlinkBtn) {
      unlinkBtn._contactId = contactId;
      // `.icon-btn { display:flex }` overrides the [hidden] attribute, so toggle
      // inline display too (inline beats the class rule). Linked users only.
      unlinkBtn.hidden = !contact.userId;  // ghosts have no userId → nothing to unlink
      unlinkBtn.style.display = contact.userId ? '' : 'none';
      if (!unlinkBtn._wiredUnlink) {
        unlinkBtn._wiredUnlink = true;
        unlinkBtn.addEventListener('click', function () {
          var c = Store.getContact(unlinkBtn._contactId);
          var nm = (c && c.name) ? c.name.split(' ')[0] : 'this contact';
          confirmSheet({
            title: 'Unlink ' + nm + '?',
            body: 'This removes the connection. You each keep your own copy of the shared history, but you\u2019ll stop sharing new activity.',
            confirmLabel: 'Unlink'
          }, function () {
            if (!(window.Store && Store.unlinkContact)) return;
            Promise.resolve(Store.unlinkContact(unlinkBtn._contactId)).then(function () {
              if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('people');
              else location.replace('people');
            });
          });
        });
      }
    }

    // ── Invite button ── (only for GHOSTS — no userId; wire once). Mints a
    // single-use 30-day ghost-bound token, then shows the share sheet. When the
    // ghost joins through the link they connect + inherit this shared history.
    var inviteBtn = root.querySelector('#js-invite-btn');
    if (inviteBtn) {
      inviteBtn._contactId = contactId;
      // Ghosts only (linked users use Unlink). Inline display overrides the
      // `.icon-btn { display:flex }` rule that ignores the [hidden] attribute.
      inviteBtn.hidden = !!contact.userId;  // linked real users use Unlink instead
      inviteBtn.style.display = contact.userId ? 'none' : '';
      if (!inviteBtn._wiredInvite) {
        inviteBtn._wiredInvite = true;
        inviteBtn.addEventListener('click', function () {
          if (!(window.Store && Store.createInvite)) return;
          var cid = inviteBtn._contactId;
          var c = Store.getContact(cid);
          inviteBtn.disabled = true;
          Promise.resolve(Store.createInvite({ ghost: cid, singleUse: true, ttlDays: 30 })).then(function (res) {
            inviteBtn.disabled = false;
            if (res && res.url) inviteSheet(res.url, c ? c.name : 'them');
          });
        });
      }
    }

    // ── Cross-screen navigation targets (re-point each show to this contact) ──
    // The href MUST carry the param: the router intercepts clicks in the CAPTURE
    // phase and parses the href, which fires before any bubble-phase onclick — so
    // a bare href would navigate with empty params and the target view would lose
    // this contact's id. settle-amount + add-amount both read `contactId`.
    var settleBtn = root.querySelector('.screen-footer a.btn--secondary');
    if (settleBtn) settleBtn.setAttribute('href', 'settle-amount?contactId=' + contactId);

    // "Add expense" carries this contact as context so the flow pre-fills the
    // two participants and skips the people-picker step (handled in add-amount).
    var addBtn = root.querySelector('.screen-footer a.btn--primary');
    if (addBtn) addBtn.setAttribute('href', 'add-amount?contactId=' + contactId);

    // Back button → replay the inverse of the entry transition (router-aware).
    // Falls back to people for deep-link entries.
    var backEl = root.querySelector('.hero-section__actions a[aria-label="Back"]');
    if (backEl) {
      backEl.onclick = function (ev) {
        if (window.SettlrRouterSPA) {
          ev.preventDefault();
          window.SettlrRouterSPA.back('people');
        }
      };
    }
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers). Tab,
    // scroll, and favourite listeners are attached idempotently in init/onShow
    // and live with the in-DOM view.
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('individual-detail', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="individual-detail"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
