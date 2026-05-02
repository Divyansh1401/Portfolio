/* ============================================================
   Settlr Render — pure HTML-string helpers
   window.Render — IIFE, no DOM writes, no Store calls
   Callers pre-fetch data and pass it in.
   ============================================================ */

// Global avatar/photo fallback handler. Invoked from <img onerror="...">
// when a contact/group photo fails to load — swaps to initials/emoji
// in-place without breaking layout.
window.handleAvatarError = function (img, fallback, mode) {
  var p = img.parentNode;
  if (!p) return;
  // Strip --photo modifier classes
  p.className = p.className.split(/\s+/).filter(function (c) {
    return c && !/--photo$/.test(c);
  }).join(' ');
  // For initials avatars, ensure --initials class
  if (mode === 'initials' && !/(^|\s)avatar--initials(\s|$)/.test(p.className)) {
    p.className += ' avatar--initials';
  }
  while (p.firstChild) p.removeChild(p.firstChild);
  p.textContent = fallback || '';
};

window.Render = (function () {
  'use strict';

  const CHEVRON_SVG =
    '<i class="ph ph-caret-right"></i>';

  // Build an onerror attribute that swaps a broken <img> with fallback text.
  // mode: 'initials' for avatars | 'tile' for emoji/group tiles.
  function _imgErr(fallback, mode) {
    var safe = String(fallback || '').replace(/'/g, "\\'");
    return ' onerror="window.handleAvatarError(this, \'' + safe + '\', \'' + mode + '\')"';
  }

  // ── Label helpers ─────────────────────────────────────────

  function _dirLabel(direction) {
    if (direction === 'lent')    return 'You lent';
    if (direction === 'owe')     return 'You owe';
    return 'Settled';
  }

  // ── Expense Item (activity.html, home-dashboard.html) ────

  /**
   * @param {object} expense  - { id, emoji, title }
   * @param {object} net      - { amount, direction: 'lent'|'owe'|'settled' }
   * @param {string} contextLabel - e.g. "Roommates · Mar 27"
   */
  function expenseItem(expense, net, contextLabel) {
    const dir   = net.direction;
    const label = _dirLabel(dir);
    const mod   = dir === 'settled' ? '' : ` expense-item--${dir}`;
    const cls   = dir === 'settled' ? '' : ` expense-item__label--${dir}`;
    const amtCls = dir === 'settled' ? '' : ` expense-item__amount--${dir}`;
    const amtStr = dir === 'settled'
      ? 'Settled'
      : Store.formatINR(net.amount);

    return `<a href="expense-detail?id=${expense.id}" class="expense-item${mod}" data-id="${expense.id}">` +
      `<div class="expense-item__illustration">${expense.emoji}</div>` +
      `<div class="expense-item__text">` +
        `<span class="expense-item__title text-title-sm">${expense.title}</span>` +
        `<span class="expense-item__subtitle text-body-xs">${contextLabel}</span>` +
      `</div>` +
      `<div class="expense-item__right">` +
        `<span class="expense-item__label${cls} text-label-xs">${label}</span>` +
        `<span class="expense-item__amount${amtCls}">${amtStr}</span>` +
      `</div>` +
    `</a>`;
  }

  // ── Transaction Item (group-detail.html, individual-detail.html) ──

  /**
   * @param {object} expense  - { id, emoji, title }
   * @param {object} net      - { amount, direction }
   * @param {string} contextLabel - e.g. "You paid · ₹4,890 total" or "Roommates · 27 Mar"
   */
  function txnItem(expense, net, contextLabel) {
    const dir    = net.direction;
    const badge  = _dirLabel(dir);
    const mod    = dir === 'settled' ? ' txn-item--settled' : ` txn-item--${dir}`;
    const amtStr = dir === 'settled'
      ? 'Settled'
      : Store.formatINR(net.amount);

    return `<a href="expense-detail?id=${expense.id}" class="txn-item${mod}" data-id="${expense.id}">` +
      `<div class="txn-item__illus">${expense.emoji}</div>` +
      `<div class="txn-item__text">` +
        `<span class="txn-item__name text-title-sm">${expense.title}</span>` +
        `<span class="txn-item__subtitle text-body-xs">${contextLabel}</span>` +
      `</div>` +
      `<div class="txn-item__right">` +
        `<span class="txn-item__badge text-label-xs">${badge}</span>` +
        `<span class="txn-item__amount">${amtStr}</span>` +
      `</div>` +
    `</a>`;
  }

  // ── Group Card (home-dashboard.html cards row) ────────────

  /**
   * @param {object} group   - { id, name, emoji }
   * @param {object} balance - { amount, direction }
   */
  function groupCard(group, balance) {
    const dir    = balance.direction;
    const mod    = dir === 'settled' ? '' : ` card-group--${dir}`;
    const infoMod = dir === 'settled' ? '' : ` card-group__info--${dir}`;
    const subtitle = dir === 'lent'
      ? 'Overall you lent'
      : dir === 'owe'
        ? 'Overall you owe'
        : 'All settled';
    const amtMod = dir === 'settled' ? '' : ` card-group__amount--${dir}`;
    const amtStr = dir === 'settled'
      ? 'Settled'
      : Store.formatINR(balance.amount);

    const imageInner = group.photo
      ? `<img src="${group.photo}" alt="${group.name}"${_imgErr(group.emoji || '', 'tile')}>`
      : (group.emoji || '');
    const imageMod = group.photo ? ' card-group__image--photo' : '';

    return `<a href="group-detail?id=${group.id}" class="card-group${mod}" data-id="${group.id}">` +
      `<div class="card-group__image${imageMod}">${imageInner}</div>` +
      `<div class="card-group__info${infoMod}">` +
        `<span class="card-group__name text-title-sm">${group.name}</span>` +
        `<div class="card-group__balance">` +
          `<span class="card-group__subtitle text-caption-sm">${subtitle}</span>` +
          `<span class="card-group__amount${amtMod} text-amount-xs">${amtStr}</span>` +
        `</div>` +
      `</div>` +
    `</a>`;
  }

  // ── Person Item (people.html) ─────────────────────────────

  /**
   * @param {object} contact  - { id, name, initials, phone, onSettlr }
   * @param {object} balance  - { amount, direction }
   * @param {boolean} hasTxns - true if contact has any shared expense/settlement
   */
  function personItem(contact, balance, hasTxns) {
    const dir    = balance.direction;
    const onApp  = contact.onSettlr !== false;

    // State modifier
    let mod = '';
    if (onApp && hasTxns) {
      if (dir === 'lent')       mod = ' person-item--lent';
      else if (dir === 'owe')   mod = ' person-item--owe';
      else                      mod = ' person-item--settled';
    }

    // Subtext: always show phone number
    const subtext = contact.phone
      ? `<span class="person-item__subtext text-body-xs">${contact.phone}</span>`
      : '';

    // Right side
    let right = '';
    if (!onApp) {
      right = '<button class="btn btn--sm btn--secondary">Invite</button>';
    } else if (hasTxns && dir !== 'settled') {
      const label = dir === 'lent' ? 'You lent' : 'You owe';
      right =
        `<div class="expense-item__right">` +
          `<span class="expense-item__label expense-item__label--${dir}">${label}</span>` +
          `<span class="expense-item__amount expense-item__amount--${dir}">${Store.formatINR(balance.amount)}</span>` +
        `</div>`;
    } else if (hasTxns && dir === 'settled') {
      right =
        `<div class="person-item__balance">` +
          `<span class="person-item__balance-label">Settled up</span>` +
        `</div>`;
    }

    const avatarHtml = contact.photo
      ? `<div class="avatar avatar--photo avatar--md"><img src="${contact.photo}" alt="${contact.name}"${_imgErr(contact.initials, 'initials')}></div>`
      : `<div class="avatar avatar--initials avatar--md text-title-md">${contact.initials}</div>`;

    return `<a class="person-item${mod}" href="individual-detail?id=${contact.id}" data-id="${contact.id}">` +
      avatarHtml +
      `<div class="person-item__text">` +
        `<span class="person-item__name text-title-sm">${contact.name}</span>` +
        subtext +
      `</div>` +
      right +
    `</a>`;
  }

  // ── Group Item (people.html — Group chip) ─────────────────

  /**
   * @param {object}  group   - { id, name, emoji, memberCount }
   * @param {object}  balance - { amount, direction }
   * @param {boolean} hasTxns - true if group has any expenses
   */
  function groupItem(group, balance, hasTxns) {
    const dir = balance.direction;

    let mod = '';
    if (hasTxns) {
      if (dir === 'lent')       mod = ' person-item--lent';
      else if (dir === 'owe')   mod = ' person-item--owe';
      else                      mod = ' person-item--settled';
    }

    let right = '';
    if (hasTxns && dir !== 'settled') {
      const label = dir === 'lent' ? 'Overall lent' : 'Overall owe';
      right =
        `<div class="expense-item__right">` +
          `<span class="expense-item__label expense-item__label--${dir}">${label}</span>` +
          `<span class="expense-item__amount expense-item__amount--${dir}">${Store.formatINR(balance.amount)}</span>` +
        `</div>`;
    } else if (hasTxns && dir === 'settled') {
      right =
        `<div class="person-item__balance">` +
          `<span class="person-item__balance-label">Settled</span>` +
        `</div>`;
    }

    const groupIconInner = group.photo
      ? `<img src="${group.photo}" alt="${group.name}"${_imgErr(group.emoji || '👥', 'tile')}>`
      : (group.emoji || '👥');
    const groupIconMod = group.photo ? ' person-item__group-icon--photo' : '';

    return `<a class="person-item${mod}" href="group-detail?id=${group.id}" data-id="${group.id}" data-type="group">` +
      `<div class="person-item__group-icon${groupIconMod}">${groupIconInner}</div>` +
      `<div class="person-item__text">` +
        `<span class="person-item__name text-title-sm">${group.name}</span>` +
        `<span class="person-item__subtext text-body-xs">${group.memberCount} members</span>` +
      `</div>` +
      right +
    `</a>`;
  }

  // ── Balance Row (group-detail.html Balances tab) ──────────

  /**
   * @param {object} member - { contactId, name, initials, amount, direction }
   *   (from Store.getMemberBalancesForGroup)
   */
  function balanceRow(member) {
    const dir     = member.direction;
    const amtMod  = dir === 'settled' ? '' : ` balance-row__amount--${dir}`;
    const amtStr  = dir === 'settled' ? 'Settled' : Store.formatINR(member.amount);

    let text;
    if (dir === 'lent')     text = `<strong>${member.name}</strong> owes you`;
    else if (dir === 'owe') text = `You owe <strong>${member.name}</strong>`;
    else                    text = `<strong>${member.name}</strong> — settled`;

    const avatarHtml = member.photo
      ? `<div class="balance-row__avatar avatar avatar--photo avatar--sm"><img src="${member.photo}" alt="${member.name}"${_imgErr(member.initials, 'initials')}></div>`
      : `<div class="balance-row__avatar avatar avatar--sm text-label-xs">${member.initials}</div>`;

    return `<div class="balance-row" data-id="${member.contactId}">` +
      avatarHtml +
      `<div class="balance-row__text text-body-md">${text}</div>` +
      `<span class="balance-row__amount${amtMod} text-amount-xs">${amtStr}</span>` +
    `</div>`;
  }

  // ── Group Row (individual-detail.html Common Groups tab) ──

  /**
   * @param {object} group   - { id, name, emoji, memberIds }
   * @param {object} balance - { amount, direction }
   * @param {Array}  members - [{initials}] — OTHER members (not current user, not the contact)
   *   Pass up to 3; overflow shown as "+N"
   */
  function groupRow(group, balance, members) {
    const dir    = balance.direction;
    const amtMod = dir === 'settled' ? '' : ` group-row__amount--${dir}`;
    const amtStr = dir === 'settled' ? 'Settled' : Store.formatINR(balance.amount);

    // Build avatar stack (max 3 visible + overflow)
    const shown    = members.slice(0, 3);
    const overflow = members.length - shown.length;
    const avatarItems = shown
      .map(m => `<div class="avatar-stack__item">${m.initials}</div>`)
      .join('');
    const overflowHtml = overflow > 0
      ? `<div class="avatar-stack__overflow">+${overflow}</div>`
      : '';
    const avatarStack =
      `<div class="avatar-stack avatar-stack--xs">${avatarItems}${overflowHtml}</div>`;

    const rowIconInner = group.photo
      ? `<img src="${group.photo}" alt="${group.name}"${_imgErr(group.emoji || '', 'tile')}>`
      : (group.emoji || '');
    const rowIconMod = group.photo ? ' group-row__icon--photo' : '';

    return `<a class="group-row" href="group-detail?id=${group.id}" data-id="${group.id}">` +
      `<div class="group-row__icon${rowIconMod}">${rowIconInner}</div>` +
      `<div class="group-row__text">` +
        `<span class="group-row__name text-title-sm">${group.name}</span>` +
        avatarStack +
      `</div>` +
      `<span class="group-row__amount${amtMod} text-amount-xs">${amtStr}</span>` +
      `<svg class="group-row__chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>` +
    `</a>`;
  }

  // ── Date Section (date heading + items as siblings) ───────

  /**
   * Returns the date-heading div concatenated with itemsHtml.
   * Used in activity, group-detail, individual-detail.
   *
   * @param {string} label     - "Today", "Yesterday", "27 Feb 2025"
   * @param {string} itemsHtml - pre-rendered items HTML string
   */
  function dateSection(label, itemsHtml) {
    return `<div class="date-heading"><span class="date-heading__label text-overline-md">${label}</span></div>${itemsHtml}`;
  }

  // ── Public API ────────────────────────────────────────────

  return {
    expenseItem,
    txnItem,
    groupCard,
    personItem,
    groupItem,
    balanceRow,
    groupRow,
    dateSection
  };

}());
