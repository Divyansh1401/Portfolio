/* ============================================================
   Settlr Render — pure HTML-string helpers
   window.Render — IIFE, no DOM writes, no Store calls
   Callers pre-fetch data and pass it in.
   ============================================================ */

window.Render = (function () {
  'use strict';

  const CHEVRON_SVG =
    '<i class="ph ph-caret-right"></i>';

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
        `<span class="expense-item__title">${expense.title}</span>` +
        `<span class="expense-item__subtitle">${contextLabel}</span>` +
      `</div>` +
      `<div class="expense-item__right">` +
        `<span class="expense-item__label${cls}">${label}</span>` +
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
        `<span class="txn-item__name">${expense.title}</span>` +
        `<span class="txn-item__subtitle">${contextLabel}</span>` +
      `</div>` +
      `<div class="txn-item__right">` +
        `<span class="txn-item__badge">${badge}</span>` +
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

    return `<a href="group-detail?id=${group.id}" class="card-group${mod}" data-id="${group.id}">` +
      `<div class="card-group__image">${group.emoji || ''}</div>` +
      `<div class="card-group__info${infoMod}">` +
        `<span class="card-group__name">${group.name}</span>` +
        `<div class="card-group__balance">` +
          `<span class="card-group__subtitle">${subtitle}</span>` +
          `<span class="card-group__amount${amtMod}">${amtStr}</span>` +
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
      ? `<span class="person-item__subtext">${contact.phone}</span>`
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

    return `<a class="person-item${mod}" href="individual-detail?id=${contact.id}" data-id="${contact.id}">` +
      `<div class="avatar avatar--initials avatar--md">${contact.initials}</div>` +
      `<div class="person-item__text">` +
        `<span class="person-item__name">${contact.name}</span>` +
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

    return `<a class="person-item${mod}" href="group-detail?id=${group.id}" data-id="${group.id}" data-type="group">` +
      `<div class="person-item__group-icon">${group.emoji || '👥'}</div>` +
      `<div class="person-item__text">` +
        `<span class="person-item__name">${group.name}</span>` +
        `<span class="person-item__subtext">${group.memberCount} members</span>` +
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

    return `<div class="balance-row" data-id="${member.contactId}">` +
      `<div class="balance-row__avatar">${member.initials}</div>` +
      `<div class="balance-row__text">${text}</div>` +
      `<span class="balance-row__amount${amtMod}">${amtStr}</span>` +
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

    return `<a class="group-row" href="group-detail?id=${group.id}" data-id="${group.id}">` +
      `<div class="group-row__icon">${group.emoji}</div>` +
      `<div class="group-row__text">` +
        `<span class="group-row__name">${group.name}</span>` +
        avatarStack +
      `</div>` +
      `<span class="group-row__amount${amtMod}">${amtStr}</span>` +
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
    return `<div class="date-heading"><span class="date-heading__label">${label}</span></div>${itemsHtml}`;
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
