/* ============================================================
   Settlr Store — localStorage-backed data layer
   window.Store — IIFE, no framework, no build step
   ============================================================ */

window.Store = (function () {
  'use strict';

  const LS_KEY = 'settlr_data';
  const SEED_VERSION = 8;
  // Becomes the authenticated user's uuid in supabase mode; stays the demo id
  // in local mode. `let` so init() can rebind it after auth.
  let CURRENT_USER_ID = 'divyansh-rastogi';

  // ── Seed Data ────────────────────────────────────────────

  const SEED_DATA = {
    currentUser: {
      id: 'divyansh-rastogi',
      name: 'Divyansh Rastogi',
      initials: 'DR',
      handle: 'divyansh',
      phone: '+91 99887 76655',
      upi: 'divyansh@okaxis',
      bank: 'HDFC Bank •••• 4291',
      bio: ''
    },

    contacts: [
      { id: 'rahul-arora',    name: 'Rahul Arora',    initials: 'RA', phone: '98765-43210', onSettlr: true,  photo: 'assets/people/Ashwin Santiago.webp' },
      { id: 'priya-sharma',   name: 'Priya Sharma',   initials: 'PS', phone: '97654-32109', onSettlr: true,  photo: 'assets/people/Priya Shepard.webp' },
      { id: 'arjun-kumar',    name: 'Arjun Kumar',    initials: 'AK', phone: '96543-21098', onSettlr: true,  photo: 'assets/people/Ali Mahdi.webp' },
      { id: 'johnnie-walker', name: 'Johnnie Walker', initials: 'JW', phone: '82933-80192',  onSettlr: true,  photo: 'assets/people/Frank Whitaker.webp' },
      { id: 'manish-kumar',   name: 'Manish Kumar',   initials: 'MK', phone: '82933-80014',  onSettlr: true,  photo: 'assets/people/Hasan Johns.webp' },
      { id: 'beau-geste',     name: 'Beau Geste',     initials: 'BG', phone: '83729-12034',  onSettlr: true,  photo: 'assets/people/Benedict Doherty.webp' },
      { id: 'kendra-cole',    name: 'Kendra Cole',    initials: 'KC', phone: '84920-53141',  onSettlr: false },
      { id: 'sophie-miller',  name: 'Sophie Miller',  initials: 'SM', phone: '86543-24042',  onSettlr: false },
      { id: 'liam-anderson',  name: 'Liam Anderson',  initials: 'LA', phone: '87245-01503',  onSettlr: true,  photo: 'assets/people/Liam Hood.webp' },
      { id: 'avery-rivers',   name: 'Avery Rivers',   initials: 'AR', phone: '71120-95674',  onSettlr: false, photo: 'assets/people/Ava Wright.webp' },
      { id: 'tessa-moore',    name: 'Tessa Moore',    initials: 'TM', phone: '70391-86785',  onSettlr: false },
      { id: 'gavin-hayes',    name: 'Gavin Hayes',    initials: 'GH', phone: '92156-37786',  onSettlr: true  },
      { id: 'clara-fields',   name: 'Clara Fields',   initials: 'CF', phone: '84920-38872',  onSettlr: true,  photo: 'assets/people/Florence Shaw.webp' },
      { id: 'zoe-martin',     name: 'Zoe Martin',     initials: 'ZM', phone: '89023-19983',  onSettlr: true,  photo: 'assets/people/Zara Bush.webp' },
      { id: 'dylan-reed',     name: 'Dylan Reed',     initials: 'DR', phone: '81105-41194',  onSettlr: true,  photo: 'assets/people/Drew Cano.webp' },
      { id: 'kylie-porter',   name: 'Kylie Porter',   initials: 'KP', phone: '83295-02305',  onSettlr: true  },
      { id: 'henry-nash',     name: 'Henry Nash',     initials: 'HN', phone: '76011-23416',  onSettlr: true  },
      { id: 'ella-brooks',    name: 'Ella Brooks',    initials: 'EB', phone: '81234-54567',  onSettlr: true,  photo: 'assets/people/Elsie Roy.webp' },
      { id: 'neha-mehra',     name: 'Neha Mehra',     initials: 'NM', phone: '89901-25678',  onSettlr: true,  photo: 'assets/people/Nala Goins.webp' },
      { id: 'vikram-kapoor',  name: 'Vikram Kapoor',  initials: 'VK', phone: '87765-46789',  onSettlr: true,  photo: 'assets/people/Marvin Robbins.webp' }
    ],

    groups: [
      {
        id: 'goa-trip',
        name: 'Goa Trip',
        emoji: '🏖️',
        photo: 'assets/groups/balkan-campers-ON2TRrhgOBU-unsplash.jpg',
        type: 'trip',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'johnnie-walker'],
        createdAt: '2025-02-24'
      },
      {
        id: 'toronto-trip',
        name: 'Toronto Trip',
        emoji: '🍁',
        photo: 'assets/groups/will-truettner-wcT778-M1WE-unsplash.jpg',
        type: 'trip',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'johnnie-walker'],
        createdAt: '2026-03-01'
      },
      {
        id: 'roommates',
        name: 'Roommates',
        emoji: '🏠',
        photo: 'assets/groups/zoshua-colah-6sLH0exs2ME-unsplash.jpg',
        type: 'home',
        memberIds: ['divyansh-rastogi', 'johnnie-walker', 'rahul-arora', 'manish-kumar'],
        createdAt: '2025-01-01'
      },
      {
        id: 'diwali-party',
        name: 'Diwali Party',
        emoji: '🪔',
        photo: 'assets/groups/abhimanyu-jhingan-o1Bis9ykTss-unsplash.jpg',
        type: 'event',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'johnnie-walker'],
        createdAt: '2025-10-15'
      },
      {
        id: 'game-night',
        name: 'Game Night',
        emoji: '🎲',
        photo: 'assets/groups/amelie-aronson-Y2kYm4UFiXs-unsplash.jpg',
        type: 'event',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'arjun-kumar', 'beau-geste'],
        createdAt: '2026-03-12'
      },
      {
        id: 'brooklyn-reunion',
        name: 'Brooklyn Reunion',
        emoji: '🌆',
        photo: 'assets/groups/ben-duchac-96DW4Pow3qI-unsplash.jpg',
        type: 'trip',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'ella-brooks', 'neha-mehra', 'vikram-kapoor'],
        createdAt: '2025-04-08'
      },
      {
        id: 'manali-trek',
        name: 'Manali Trek',
        emoji: '🏔️',
        photo: 'assets/groups/felix-rostig-UmV2wr-Vbq8-unsplash.jpg',
        type: 'trip',
        memberIds: ['divyansh-rastogi', 'arjun-kumar', 'beau-geste', 'liam-anderson', 'manish-kumar'],
        createdAt: '2025-06-20'
      },
      {
        id: 'birthday-bash',
        name: "Priya's Birthday Bash",
        emoji: '🎂',
        photo: 'assets/groups/jacob-bentzinger-_HXFz-0g9w8-unsplash.jpg',
        type: 'celebration',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'zoe-martin', 'neha-mehra'],
        createdAt: '2026-01-22'
      },
      {
        id: 'beach-bonfire',
        name: 'Beach Bonfire',
        emoji: '🔥',
        photo: 'assets/groups/kimson-doan-AZMmUy2qL6A-unsplash.jpg',
        type: 'event',
        memberIds: ['divyansh-rastogi', 'arjun-kumar', 'beau-geste', 'johnnie-walker'],
        createdAt: '2025-12-30'
      },
      {
        id: 'sunburn-festival',
        name: 'Sunburn Festival',
        emoji: '🎵',
        photo: 'assets/groups/vishnu-r-nair-m1WZS5ye404-unsplash.jpg',
        type: 'event',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'zoe-martin', 'neha-mehra', 'ella-brooks', 'vikram-kapoor'],
        createdAt: '2026-04-25'
      }
    ],

    settlements: [],

    comments: [],

    expenses: [
      // ── Goa Trip (4-way equal: DR, RA, PS, AK) ──────────
      {
        id: 'goa-beach-dinner',
        groupId: 'goa-trip', contactId: null,
        title: 'Beach dinner at Baga', emoji: '🍽️', category: 'Food',
        totalAmount: 4890, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2025-02-27',
        notes: 'Went to the beach shack at Baga — the prawn curry and kingfish was 🔥. Included drinks, starters, and dessert for the whole group.'
      },
      {
        id: 'goa-bar-tab',
        groupId: 'goa-trip', contactId: null,
        title: "Bar tab at Tito's", emoji: '🍺', category: 'Food',
        totalAmount: 2340, paidById: 'rahul-arora',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2025-02-27', notes: ''
      },
      {
        id: 'goa-cab',
        groupId: 'goa-trip', contactId: null,
        title: 'Cab to Dudhsagar', emoji: '🚕', category: 'Travel',
        totalAmount: 1200, paidById: 'arjun-kumar',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2025-02-27', notes: ''
      },
      {
        id: 'goa-water-sports',
        groupId: 'goa-trip', contactId: null,
        title: 'Water sports at Calangute', emoji: '🏄', category: 'Activity',
        totalAmount: 3600, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2025-02-27', notes: ''
      },
      {
        id: 'goa-hotel',
        groupId: 'goa-trip', contactId: null,
        title: 'Hotel — 3 nights', emoji: '🏨', category: 'Stay',
        totalAmount: 19200, paidById: 'johnnie-walker',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'johnnie-walker'],
        date: '2025-02-26', notes: ''
      },
      {
        id: 'goa-flights',
        groupId: 'goa-trip', contactId: null,
        title: 'Flight tickets', emoji: '✈️', category: 'Travel',
        totalAmount: 14800, paidById: 'rahul-arora',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2025-02-26', notes: ''
      },
      {
        id: 'goa-britto',
        groupId: 'goa-trip', contactId: null,
        title: "Dinner at Britto's", emoji: '🍜', category: 'Food',
        totalAmount: 3920, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2025-02-26', notes: ''
      },
      {
        id: 'goa-beach-shack',
        groupId: 'goa-trip', contactId: null,
        title: 'Beach shack lunch', emoji: '🏖️', category: 'Food',
        totalAmount: 6400, paidById: 'arjun-kumar',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2025-02-25', notes: ''
      },
      {
        id: 'goa-cocktails',
        groupId: 'goa-trip', contactId: null,
        title: 'Cocktails at Curlies', emoji: '🍹', category: 'Food',
        totalAmount: 7200, paidById: 'rahul-arora',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2025-02-25', notes: ''
      },

      // ── Toronto Trip (4-way equal: DR, RA, PS, AK) ──────
      {
        id: 'toronto-cn-tower',
        groupId: 'toronto-trip', contactId: null,
        title: 'CN Tower tickets', emoji: '🍁', category: 'Activity',
        totalAmount: 8400, paidById: 'arjun-kumar',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2026-03-15', notes: ''
      },
      {
        id: 'toronto-kissa-tanto',
        groupId: 'toronto-trip', contactId: null,
        title: 'Dinner at Kissa Tanto', emoji: '🍽️', category: 'Food',
        totalAmount: 6720, paidById: 'rahul-arora',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2026-03-15', notes: ''
      },
      {
        id: 'toronto-airbnb',
        groupId: 'toronto-trip', contactId: null,
        title: 'Airbnb — 3 nights', emoji: '🏨', category: 'Stay',
        totalAmount: 57600, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2026-03-10', notes: ''
      },
      {
        id: 'toronto-return-flights',
        groupId: 'toronto-trip', contactId: null,
        title: 'Return flights', emoji: '✈️', category: 'Travel',
        totalAmount: 36800, paidById: 'rahul-arora',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2026-03-10', notes: ''
      },
      {
        id: 'toronto-niagara',
        groupId: 'toronto-trip', contactId: null,
        title: 'Niagara day trip', emoji: '🌊', category: 'Activity',
        totalAmount: 7200, paidById: 'arjun-kumar',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2026-03-05', notes: ''
      },
      {
        id: 'toronto-flights',
        groupId: 'toronto-trip', contactId: null,
        title: 'Flights to Toronto', emoji: '✈️', category: 'Travel',
        totalAmount: 114000, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar'],
        date: '2026-03-05', notes: ''
      },

      // ── Roommates (4-way equal: DR, JW, RA, MK) ─────────
      {
        id: 'roommates-grocery-mar27',
        groupId: 'roommates', contactId: null,
        title: 'Big Bazaar grocery run', emoji: '🛒', category: 'Groceries',
        totalAmount: 5800, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'johnnie-walker', 'rahul-arora', 'manish-kumar'],
        date: '2026-03-27', notes: ''
      },
      {
        id: 'roommates-electricity',
        groupId: 'roommates', contactId: null,
        title: 'Electricity bill — April', emoji: '⚡', category: 'Bills',
        totalAmount: 3240, paidById: 'johnnie-walker',
        splitAmong: ['divyansh-rastogi', 'johnnie-walker', 'rahul-arora', 'manish-kumar'],
        date: '2026-03-26', notes: ''
      },
      {
        id: 'roommates-groceries-mar1',
        groupId: 'roommates', contactId: null,
        title: 'Monthly groceries', emoji: '🛒', category: 'Groceries',
        totalAmount: 2560, paidById: 'rahul-arora',
        splitAmong: ['divyansh-rastogi', 'johnnie-walker', 'rahul-arora', 'manish-kumar'],
        date: '2026-03-01', notes: ''
      },

      // ── Individual expenses (groupId: null) ───────────────
      {
        id: 'pvr-rahul',
        groupId: null, contactId: 'rahul-arora',
        title: 'PVR — Infinity Mall', emoji: '🎬', category: 'Entertainment',
        totalAmount: 1360, paidById: 'rahul-arora',
        splitAmong: ['divyansh-rastogi', 'rahul-arora'],
        date: '2026-03-27', notes: ''
      },
      {
        id: 'coffee-priya',
        groupId: null, contactId: 'priya-sharma',
        title: 'Coffee at Blue Tokai', emoji: '☕', category: 'Food',
        totalAmount: 840, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'priya-sharma'],
        date: '2026-03-26', notes: ''
      },
      {
        id: 'social-arjun',
        groupId: null, contactId: 'arjun-kumar',
        title: 'Dinner at The Social', emoji: '🍕', category: 'Food',
        totalAmount: 1520, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'arjun-kumar'],
        date: '2026-03-01', notes: ''
      },

      // ── Diwali Party (5-way: DR, RA, PS, AK, JW) — settled ──
      {
        id: 'diwali-catering',
        groupId: 'diwali-party', contactId: null,
        title: 'Catering & dinner', emoji: '🍛', category: 'Food',
        totalAmount: 2500, paidById: 'rahul-arora',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'johnnie-walker'],
        date: '2025-10-20', notes: ''
      },
      {
        id: 'diwali-decor',
        groupId: 'diwali-party', contactId: null,
        title: 'Decor & string lights', emoji: '✨', category: 'Other',
        totalAmount: 1500, paidById: 'johnnie-walker',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'johnnie-walker'],
        date: '2025-10-20', notes: ''
      },
      {
        id: 'diwali-sweets',
        groupId: 'diwali-party', contactId: null,
        title: 'Sweets & gifts', emoji: '🍬', category: 'Other',
        totalAmount: 1000, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'johnnie-walker'],
        date: '2025-10-19', notes: ''
      },

      // ── Game Night (4-way: DR, RA, AK, BG) — settled ──
      {
        id: 'gamenight-pizza',
        groupId: 'game-night', contactId: null,
        title: 'Pizza & wings', emoji: '🍕', category: 'Food',
        totalAmount: 1200, paidById: 'rahul-arora',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'arjun-kumar', 'beau-geste'],
        date: '2026-03-15', notes: ''
      },
      {
        id: 'gamenight-drinks',
        groupId: 'game-night', contactId: null,
        title: 'Drinks run', emoji: '🍻', category: 'Food',
        totalAmount: 600, paidById: 'arjun-kumar',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'arjun-kumar', 'beau-geste'],
        date: '2026-03-15', notes: ''
      },
      {
        id: 'gamenight-snacks',
        groupId: 'game-night', contactId: null,
        title: 'Snacks & dips', emoji: '🥨', category: 'Food',
        totalAmount: 600, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'arjun-kumar', 'beau-geste'],
        date: '2026-03-15', notes: ''
      },

      // ── Brooklyn Reunion (6-way: DR, RA, PS, EB, NM, VK) — settled ──
      {
        id: 'brooklyn-hotel',
        groupId: 'brooklyn-reunion', contactId: null,
        title: 'Hotel — 2 nights', emoji: '🏨', category: 'Stay',
        totalAmount: 9000, paidById: 'vikram-kapoor',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'ella-brooks', 'neha-mehra', 'vikram-kapoor'],
        date: '2025-04-12', notes: ''
      },
      {
        id: 'brooklyn-dinner',
        groupId: 'brooklyn-reunion', contactId: null,
        title: 'Williamsburg dinner', emoji: '🍝', category: 'Food',
        totalAmount: 6000, paidById: 'ella-brooks',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'ella-brooks', 'neha-mehra', 'vikram-kapoor'],
        date: '2025-04-13', notes: ''
      },
      {
        id: 'brooklyn-activities',
        groupId: 'brooklyn-reunion', contactId: null,
        title: 'Subway passes & tour', emoji: '🚇', category: 'Travel',
        totalAmount: 3000, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'ella-brooks', 'neha-mehra', 'vikram-kapoor'],
        date: '2025-04-12', notes: ''
      },

      // ── Manali Trek (5-way: DR, AK, BG, LA, MK) — settled ──
      {
        id: 'manali-package',
        groupId: 'manali-trek', contactId: null,
        title: 'Trek package — Hampta Pass', emoji: '⛰️', category: 'Activity',
        totalAmount: 15000, paidById: 'manish-kumar',
        splitAmong: ['divyansh-rastogi', 'arjun-kumar', 'beau-geste', 'liam-anderson', 'manish-kumar'],
        date: '2025-06-22', notes: ''
      },
      {
        id: 'manali-gear',
        groupId: 'manali-trek', contactId: null,
        title: 'Gear rentals', emoji: '🥾', category: 'Other',
        totalAmount: 5000, paidById: 'arjun-kumar',
        splitAmong: ['divyansh-rastogi', 'arjun-kumar', 'beau-geste', 'liam-anderson', 'manish-kumar'],
        date: '2025-06-21', notes: ''
      },
      {
        id: 'manali-cab-food',
        groupId: 'manali-trek', contactId: null,
        title: 'Cabs + meals', emoji: '🚙', category: 'Travel',
        totalAmount: 5000, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'arjun-kumar', 'beau-geste', 'liam-anderson', 'manish-kumar'],
        date: '2025-06-23', notes: ''
      },

      // ── Priya's Birthday Bash (6-way: DR, RA, PS, AK, ZM, NM) — settled ──
      {
        id: 'birthday-cake-food',
        groupId: 'birthday-bash', contactId: null,
        title: 'Cake & catering', emoji: '🎂', category: 'Food',
        totalAmount: 6000, paidById: 'zoe-martin',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'zoe-martin', 'neha-mehra'],
        date: '2026-01-25', notes: ''
      },
      {
        id: 'birthday-bar',
        groupId: 'birthday-bash', contactId: null,
        title: 'Bar tab at Soho House', emoji: '🍸', category: 'Food',
        totalAmount: 9000, paidById: 'neha-mehra',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'zoe-martin', 'neha-mehra'],
        date: '2026-01-25', notes: ''
      },
      {
        id: 'birthday-decor',
        groupId: 'birthday-bash', contactId: null,
        title: 'Decor & gifts', emoji: '🎁', category: 'Other',
        totalAmount: 3000, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'zoe-martin', 'neha-mehra'],
        date: '2026-01-24', notes: ''
      },

      // ── Beach Bonfire (4-way: DR, AK, BG, JW) — settled ──
      {
        id: 'bonfire-shack',
        groupId: 'beach-bonfire', contactId: null,
        title: 'Beach shack dinner', emoji: '🍤', category: 'Food',
        totalAmount: 2000, paidById: 'beau-geste',
        splitAmong: ['divyansh-rastogi', 'arjun-kumar', 'beau-geste', 'johnnie-walker'],
        date: '2026-01-02', notes: ''
      },
      {
        id: 'bonfire-drinks',
        groupId: 'beach-bonfire', contactId: null,
        title: 'Drinks & snacks', emoji: '🍹', category: 'Food',
        totalAmount: 1000, paidById: 'johnnie-walker',
        splitAmong: ['divyansh-rastogi', 'arjun-kumar', 'beau-geste', 'johnnie-walker'],
        date: '2026-01-02', notes: ''
      },
      {
        id: 'bonfire-firewood',
        groupId: 'beach-bonfire', contactId: null,
        title: 'Firewood & ride', emoji: '🔥', category: 'Travel',
        totalAmount: 1000, paidById: 'divyansh-rastogi',
        splitAmong: ['divyansh-rastogi', 'arjun-kumar', 'beau-geste', 'johnnie-walker'],
        date: '2026-01-02', notes: ''
      }
    ]
  };

  // ── Private State ─────────────────────────────────────────

  let data = null;
  let MODE = 'local';   // 'local' (localStorage) | 'supabase' (hydrated cache)
  let _sb  = null;      // supabase client when MODE === 'supabase'

  // ── Private Helpers ───────────────────────────────────────

  function _persist() {
    // In supabase mode the in-memory cache is the source of truth for reads and
    // each mutation writes its own row(s) to Supabase, so the whole-blob
    // localStorage write is a local-mode-only concern.
    if (MODE !== 'local') return;
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }

  function _init() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      data = JSON.parse(JSON.stringify(SEED_DATA));
      data._version = SEED_VERSION;
      _backfillOccurredAt();
      _persist();
    } else {
      try {
        data = JSON.parse(raw);
        // version bump → reset to fresh seed
        if (data._version !== SEED_VERSION) {
          data = JSON.parse(JSON.stringify(SEED_DATA));
          data._version = SEED_VERSION;
          _backfillOccurredAt();
          _persist();
          return;
        }
        // migrate: add settlements if missing in older stored data
        if (!data.settlements) data.settlements = [];
        // migrate: add comments if missing
        if (!data.comments) data.comments = [];
        // migrate: add onSettlr if missing from stored contacts
        data.contacts.forEach(function(c) {
          if (c.onSettlr === undefined) {
            var seed = SEED_DATA.contacts.find(function(s) { return s.id === c.id; });
            c.onSettlr = seed ? seed.onSettlr : true;
          }
        });
        _backfillOccurredAt();
      } catch (e) {
        data = JSON.parse(JSON.stringify(SEED_DATA));
        data._version = SEED_VERSION;
        _backfillOccurredAt();
        _persist();
      }
    }
  }

  /** Ensure every in-memory expense + settlement carries `occurredAt` (derived
   *  from `date` for seed/legacy rows that only have a calendar date). */
  function _backfillOccurredAt() {
    if (!data) return;
    (data.expenses || []).forEach(function (e) { if (!e.occurredAt) e.occurredAt = _deriveOccurredAt(e); });
    (data.settlements || []).forEach(function (s) { if (!s.occurredAt) s.occurredAt = _deriveOccurredAt(s); });
  }

  function _round2(n) {
    return Math.round(n * 100) / 100;
  }

  // ── Transaction time ──────────────────────────────────────
  // Every expense / settlement carries `occurredAt` — a sortable local
  // `YYYY-MM-DDTHH:MM:SS` string (NOT UTC, so plain string-compare orders it).
  // `date` stays for the calendar-day group label; `createdAt`/`created_at` is
  // the immutable insert stamp. Time is AUTO-stamped: a backdated expense gets
  // the current clock time on its chosen date.
  function _pad2(n) { return String(n).padStart(2, '0'); }
  function _todayISO() {
    var n = new Date();
    return n.getFullYear() + '-' + _pad2(n.getMonth() + 1) + '-' + _pad2(n.getDate());
  }
  function _nowClock() {
    var n = new Date();
    return _pad2(n.getHours()) + ':' + _pad2(n.getMinutes()) + ':' + _pad2(n.getSeconds());
  }
  /** Auto-stamp: chosen date (or today) + the current clock time. */
  function _stampOccurredAt(rec) {
    if (rec && rec.occurredAt) return rec.occurredAt;
    return ((rec && rec.date) || _todayISO()) + 'T' + _nowClock();
  }
  /** Backfill a stable, varied within-day time for legacy/seed rows that have
   *  only a `date`. A deterministic hash of the id spreads same-day rows across
   *  an 8:00–21:59 window so ordering is visible and stable across reloads. */
  function _deriveOccurredAt(rec) {
    if (rec && rec.occurredAt) return rec.occurredAt;
    var date = (rec && rec.date) || _todayISO();
    var s = String((rec && rec.id) || ''), h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    var mins = h % (14 * 60);                 // 0..839 → 14-hour window
    return date + 'T' + _pad2(8 + Math.floor(mins / 60)) + ':' + _pad2(mins % 60) + ':00';
  }
  function _occ(x) { return (x && x.occurredAt) || _deriveOccurredAt(x); }
  /** Newest-first by occurredAt, tiebroken by id (stable). */
  function _byTimeDesc(a, b) {
    return _occ(b).localeCompare(_occ(a)) || String(b.id).localeCompare(String(a.id));
  }
  /** occurredAt → "2:30 PM" (empty string if absent/malformed). */
  function formatTime(occurredAt) {
    var t = String(occurredAt || '').split('T')[1] || '';
    var hm = t.split(':');
    if (hm.length < 2) return '';
    var h = parseInt(hm[0], 10);
    if (isNaN(h)) return '';
    var ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
    return h12 + ':' + hm[1] + ' ' + ap;
  }

  /** What `id` owes of an expense (honors splitAmounts; else equal share). */
  function _shareOf(expense, id) {
    if (!expense.splitAmong.includes(id)) return 0;
    if (expense.splitAmounts && expense.splitAmounts[id] != null) {
      return _round2(expense.splitAmounts[id]);
    }
    // Equal split: split in integer paise so shares sum EXACTLY to the total
    // (no per-read rounding drift, so the books always net to zero). The first
    // `rem` participants — by stable order in splitAmong — absorb +1 paisa each.
    var n = expense.splitAmong.length;
    var totalPaise = Math.round(expense.totalAmount * 100);
    var base = Math.floor(totalPaise / n);
    var rem = totalPaise - base * n;
    var idx = expense.splitAmong.indexOf(id);
    return (base + (idx < rem ? 1 : 0)) / 100;
  }
  /** What `id` paid for an expense (multi-payer map, else the single payer). */
  function _paidBy(expense, id) {
    if (expense.payers) return _round2(expense.payers[id] || 0);
    return expense.paidById === id ? expense.totalAmount : 0;
  }
  /** A person's net for one expense = what they paid − what they owe. */
  function _netOf(expense, id) {
    return _round2(_paidBy(expense, id) - _shareOf(expense, id));
  }
  /** Pairwise transfer between `me` and `other` for one expense.
   *  +ve ⇒ `other` owes `me`. Distributes each debtor's debt across creditors
   *  proportionally — reduces to the single-payer share when there's one payer. */
  function _pairwise(expense, me, other) {
    const nMe = _netOf(expense, me);
    const nOther = _netOf(expense, other);
    if (nMe === 0 || nOther === 0 || (nMe > 0) === (nOther > 0)) return 0;
    let totalDebt = 0;
    expense.splitAmong.forEach(id => { const n = _netOf(expense, id); if (n < 0) totalDebt += -n; });
    if (totalDebt < 0.01) return 0;
    if (nMe > 0) return _round2(nMe * (-nOther) / totalDebt);   // me creditor → other owes me
    return _round2(-((-nMe) * nOther / totalDebt));             // me debtor → I owe other
  }

  /** Compute net balance for current user from a single expense */
  function _computeUserNet(expense) {
    const net = _netOf(expense, CURRENT_USER_ID);
    if (net > 0) return { amount: net, direction: 'lent' };
    if (net < 0) return { amount: -net, direction: 'owe' };
    return { amount: 0, direction: 'settled' };
  }

  /** Who paid an expense → { ids, label }. Handles the multi-payer `payers`
   *  map (ids with a positive amount) and falls back to the single `paidById`.
   *  label: 1 → "You"/name, 2 → "A + B", 3+ → "A + N others". */
  function getPayerSummary(expense) {
    let ids;
    if (expense.payers) {
      ids = Object.keys(expense.payers).filter(id => (parseFloat(expense.payers[id]) || 0) > 0);
      if (!ids.length) ids = expense.paidById ? [expense.paidById] : [];
    } else {
      ids = expense.paidById ? [expense.paidById] : [];
    }
    const nm = id => {
      if (id === CURRENT_USER_ID) return 'You';
      const c = _getContactById(id);
      return c ? c.name.split(' ')[0] : id;
    };
    let label;
    if (ids.length === 0) label = 'Someone';
    else if (ids.length === 1) label = nm(ids[0]);
    else if (ids.length === 2) label = nm(ids[0]) + ' + ' + nm(ids[1]);
    else label = nm(ids[0]) + ' + ' + (ids.length - 1) + ' others';
    return { ids, label };
  }

  /** Format ISO date → display label relative to today */
  function _formatDateLabel(isoDate) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const yest = new Date(now); yest.setDate(yest.getDate() - 1);
    const yestStr = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;
    if (isoDate === todayStr) return 'Today';
    if (isoDate === yestStr) return 'Yesterday';
    const d = new Date(isoDate + 'T00:00:00');
    const day = d.getDate();
    const month = d.toLocaleString('en-IN', { month: 'short' });
    const year = d.getFullYear();
    return year === now.getFullYear() ? `${day} ${month}` : `${day} ${month} ${year}`;
  }

  function _getContactById(id) {
    if (id === CURRENT_USER_ID) return data.currentUser;
    return data.contacts.find(c => c.id === id) || null;
  }

  function _getGroupById(id) {
    return data.groups.find(g => g.id === id) || null;
  }

  // ── Public API ────────────────────────────────────────────

  function getCurrentUser() {
    return Object.assign({}, data.currentUser);
  }

  function getContacts() {
    return data.contacts
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function getContact(id) {
    return _getContactById(id) || null;
  }

  function getGroups() {
    return data.groups.map(g => Object.assign({}, g, {
      memberCount: g.memberIds.length
    }));
  }

  function getGroup(id) {
    const g = _getGroupById(id);
    return g ? Object.assign({}, g, { memberCount: g.memberIds.length }) : null;
  }

  function getExpenses(groupId) {
    return data.expenses
      .filter(e => e.groupId === groupId)
      .sort(_byTimeDesc);
  }

  function getExpensesForContact(contactId) {
    return data.expenses
      .filter(e =>
        e.splitAmong.includes(CURRENT_USER_ID) &&
        e.splitAmong.includes(contactId)
      )
      .sort(_byTimeDesc);
  }

  function getCommonGroups(contactId) {
    return data.groups.filter(g =>
      g.memberIds.includes(CURRENT_USER_ID) &&
      g.memberIds.includes(contactId)
    );
  }

  /** Create a contact the user owns. Defaults onSettlr:false; derives initials
   *  from the name when not supplied. Returns the new id. */
  function addContact(contact) {
    const id = _newId('contact');
    const rec = Object.assign({ onSettlr: false }, contact, { id });
    if (!rec.initials) rec.initials = _initialsFromName(rec.name);
    data.contacts.push(rec);
    _persist();
    if (MODE === 'supabase') _remote(function () { return _sb.from('contacts').insert(_contactToDb(rec, true)); });
    return id;
  }

  /** Merge fields into a contact (preserves id). Returns true if found. */
  function updateContact(id, fields) {
    const idx = data.contacts.findIndex(c => c.id === id);
    if (idx === -1) return false;
    data.contacts[idx] = Object.assign({}, data.contacts[idx], fields, { id });
    _persist();
    if (MODE === 'supabase') _remote(function () { return _sb.from('contacts').update(_contactToDb(fields, false)).eq('id', id); });
    return true;
  }

  /** Remove a contact. Server FKs: expenses.contact_id ON DELETE SET NULL,
   *  group_members.contact_id ON DELETE CASCADE. Returns true if it existed. */
  function deleteContact(id) {
    const existed = data.contacts.some(c => c.id === id);
    data.contacts = data.contacts.filter(c => c.id !== id);
    _persist();
    if (MODE === 'supabase') _remote(function () { return _sb.from('contacts').delete().eq('id', id); });
    return existed;
  }

  /** Look up a real registered user by their exact Settlr ID (handle) via the
   *  anti-enumeration RPC. Resolves to { id, name, handle, photo } or null.
   *  supabase mode only (no real user directory in local mode). */
  function findUserByHandle(handle) {
    if (MODE !== 'supabase' || !_sb) return Promise.resolve(null);
    var h = String(handle || '').trim().replace(/^@/, '');
    if (!h) return Promise.resolve(null);
    return _sb.rpc('find_user_by_handle', { p_handle: h }).then(function (res) {
      if (res && res.error) { console.error('[Store] handle lookup error:', res.error); return null; }
      var row = (res && res.data && res.data[0]) || null;
      return row ? { id: row.id, name: row.name, handle: row.handle, photo: row.photo || undefined } : null;
    }).catch(function (e) { console.error('[Store] handle lookup error:', e); return null; });
  }

  /** Look up a real registered user by their exact (confirmed) email via the
   *  anti-enumeration RPC. Resolves to { id, name, handle, photo } or null.
   *  Only confirmed emails match; the caller is excluded; rate-limited server-side.
   *  supabase mode only. */
  function findUserByEmail(email) {
    if (MODE !== 'supabase' || !_sb) return Promise.resolve(null);
    var e = String(email || '').trim().toLowerCase();
    if (!e || e.indexOf('@') === -1) return Promise.resolve(null);
    return _sb.rpc('find_user_by_email', { p_email: e }).then(function (res) {
      if (res && res.error) { console.error('[Store] email lookup error:', res.error); return null; }
      var row = (res && res.data && res.data[0]) || null;
      return row ? { id: row.id, name: row.name, handle: row.handle, photo: row.photo || undefined } : null;
    }).catch(function (err) { console.error('[Store] email lookup error:', err); return null; });
  }

  /* Handle normalization + local-mode validation, mirroring public.check_handle
     in supabase/schema.sql: lower/trim/strip a leading '@', then require
     3-20 [a-z0-9_] and reject the reserved list. The server additionally
     checks uniqueness against profiles; local mode has no user directory, so
     it can only enforce the first two rules. Keep this list in sync with the
     SQL — a handle accepted locally but rejected on the server is exactly the
     mismatch this pair exists to prevent. */
  var RESERVED_HANDLES = ['admin', 'settlr', 'support', 'help', 'about', 'root',
                          'system', 'user', 'me', 'api', 'www', 'mail', 'settle'];

  function _normHandle(handle) {
    return String(handle || '').trim().replace(/^@/, '').toLowerCase();
  }

  function _handleValidLocally(norm) {
    if (!/^[a-z0-9_]{3,20}$/.test(norm)) return false;
    return RESERVED_HANDLES.indexOf(norm) === -1;
  }

  /** Check whether a handle is available + valid (format 3-20 [a-z0-9_], not
   *  reserved, not taken by someone else). Resolves to true/false. Own handle
   *  reads as available.
   *  In local mode there is no user directory, so this answers the half of the
   *  question that IS knowable — format + reserved words — rather than a blanket
   *  true. A blanket true made the editor promise availability for handles that
   *  setHandle would then refuse. */
  function checkHandle(handle) {
    var h = _normHandle(handle);
    if (MODE !== 'supabase' || !_sb) return Promise.resolve(_handleValidLocally(h));
    return _sb.rpc('check_handle', { p_handle: h }).then(function (res) {
      if (res && res.error) { console.error('[Store] check_handle error:', res.error); return false; }
      return res && res.data === true;
    }).catch(function (e) { console.error('[Store] check_handle error:', e); return false; });
  }

  /** Claim a new handle for the current user (validated + unique server-side).
   *  Resolves to true on success, false if invalid/taken. Updates the local
   *  cache on success.
   *  In local mode (demo / offline seed data — the embedded portfolio prototype)
   *  this applies the same validation checkHandle just applied and writes to the
   *  local store, so the editor completes instead of dead-ending on a "that ID
   *  just got taken" that no server ever said. */
  function setHandle(handle) {
    var h = _normHandle(handle);
    if (MODE !== 'supabase' || !_sb) {
      if (!_handleValidLocally(h)) return Promise.resolve(false);
      data.currentUser.handle = h;
      _persist();
      return Promise.resolve(true);
    }
    return _sb.rpc('set_handle', { p_handle: h }).then(function (res) {
      if (res && res.error) { console.error('[Store] set_handle error:', res.error); return false; }
      if (res && res.data === true) { data.currentUser.handle = h; _persist(); return true; }
      return false;
    }).catch(function (e) { console.error('[Store] set_handle error:', e); return false; });
  }

  /** Connect to a real user (open consent — instant shared balance). Creates a
   *  linked contact whose id IS the friend's profile id (so the balance engine
   *  resolves them), plus a symmetric `connections` row. Idempotent. Resolves
   *  to true on success. supabase mode only. */
  function connect(profile) {
    if (MODE !== 'supabase' || !_sb || !profile || !profile.id) return Promise.resolve(false);
    var me = CURRENT_USER_ID, them = profile.id;
    if (them === me) return Promise.resolve(false);
    var a = me < them ? me : them, b = me < them ? them : me;

    if (!data.contacts.some(function (c) { return c.id === them; })) {
      var rec = {
        id: them, userId: them, name: profile.name || profile.handle || '',
        initials: _initialsFromName(profile.name || profile.handle), handle: profile.handle || '',
        phone: '', onSettlr: true, photo: profile.photo
      };
      data.contacts.push(rec);
      _persist();
      // Idempotent insert: contacts.id is a GLOBAL PK, so another owner may already
      // hold a row for this person. on-conflict-do-nothing turns the duplicate into
      // an explicit no-op instead of a swallowed PK violation. (Plan §2.0 Tier 1.)
      _remote(function () { return _sb.from('contacts').upsert(_contactToDb(rec, true), { onConflict: 'id', ignoreDuplicates: true }); });
    }
    // Insert the symmetric connection (idempotent — a duplicate is caught below).
    return _remote(function () { return _sb.from('connections').insert({ user_a: a, user_b: b, created_by: me }); })
      .then(function () { return true; })
      .catch(function (e) { console.error('[Store] connect error:', e); return true; });
  }

  /** Canonicalize a phone to its last 10 digits (strip everything non-numeric),
   *  matching the server-side normalization in find_users_by_phones. '' if none. */
  function _normalizePhone(raw) {
    return String(raw == null ? '' : raw).replace(/\D/g, '').slice(-10);
  }

  /** UX-02 — Canonical phone DISPLAY format (the display twin of _normalizePhone).
   *  Any value that reduces to a 10-digit Indian mobile (optionally prefixed with
   *  a domestic 0 or country code 91) renders as "+91 98765 43210". Anything we
   *  can't confidently parse is returned exactly as stored — never corrupted. */
  function formatPhone(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return '';
    var digits = s.replace(/\D/g, '');
    if (digits.length === 11 && digits.charAt(0) === '0') digits = digits.slice(1);
    if (digits.length === 12 && digits.slice(0, 2) === '91') digits = digits.slice(2);
    if (digits.length !== 10) return s;
    return '+91 ' + digits.slice(0, 5) + ' ' + digits.slice(5);
  }

  /** Batch-match a list of phone numbers against registered Settlr users via the
   *  capped + rate-limited RPC. Resolves to an array of { id, name, handle, photo,
   *  phone } where `phone` is the normalized last-10 that matched (so the caller
   *  can map a result back to the picked contact). supabase mode only; degrades
   *  to [] on any error so an over-cap / rate-limit just yields no matches. */
  function findUsersByPhones(phones) {
    if (MODE !== 'supabase' || !_sb) return Promise.resolve([]);
    var seen = {}, norm = [];
    (phones || []).forEach(function (p) {
      var n = _normalizePhone(p);
      if (n && !seen[n]) { seen[n] = 1; norm.push(n); }
    });
    if (!norm.length) return Promise.resolve([]);
    return _sb.rpc('find_users_by_phones', { p_phones: norm }).then(function (res) {
      if (res && res.error) { console.error('[Store] phone match error:', res.error); return []; }
      return ((res && res.data) || []).map(function (r) {
        return { id: r.id, name: r.name, handle: r.handle, photo: r.photo || undefined, phone: r.match_phone || '' };
      });
    }).catch(function (e) { console.error('[Store] phone match error:', e); return []; });
  }

  /** Redeem a pending invite captured at boot (localStorage `settlr_pending_invite`
   *  = an inviter handle). One-shot: the key is cleared immediately so a bad/old
   *  handle can't loop. If it resolves to a real user other than self that we're
   *  not already linked to, open a connection (idempotent). Resolves to the
   *  connected profile (or null). supabase mode only. */
  function redeemPendingInvite() {
    if (MODE !== 'supabase' || !_sb) return Promise.resolve(null);
    var handle;
    try { handle = localStorage.getItem('settlr_pending_invite'); localStorage.removeItem('settlr_pending_invite'); }
    catch (e) { handle = null; }
    handle = String(handle || '').trim().replace(/^@/, '');
    if (!handle) return Promise.resolve(null);
    var mine = String((data.currentUser && data.currentUser.handle) || '').replace(/^@/, '');
    if (handle.toLowerCase() === mine.toLowerCase()) return Promise.resolve(null);
    // Already linked to someone with this handle? Skip (no duplicate connect).
    if (data.contacts.some(function (c) { return c.userId && c.handle && c.handle.replace(/^@/, '').toLowerCase() === handle.toLowerCase(); })) {
      return Promise.resolve(null);
    }
    return findUserByHandle(handle).then(function (profile) {
      if (!profile || !profile.id || profile.id === CURRENT_USER_ID) return null;
      return connect(profile).then(function () { return profile; });
    });
  }

  /** Mint an invite token bundling an intent — optionally a ghost to fold
   *  (opts.ghost = ghost contact id) and/or a group to join (opts.group = group id),
   *  optional single-use + ttl. Resolves to { token, url } (the shareable /i/<token>
   *  link) or null. supabase mode only. */
  function createInvite(opts) {
    if (MODE !== 'supabase' || !_sb) return Promise.resolve(null);
    opts = opts || {};
    var params = {
      p_ghost: opts.ghost || null,
      p_group: opts.group || null,
      p_email: opts.email || null,
      p_single_use: opts.singleUse === true,
      p_ttl_days: (opts.ttlDays != null ? opts.ttlDays : null)
    };
    return _sb.rpc('create_invite', params).then(function (res) {
      if (res && res.error) { console.error('[Store] create_invite error:', res.error); return null; }
      var token = res && res.data;
      return token ? { token: token, url: location.origin + '/i/' + token } : null;
    }).catch(function (e) { console.error('[Store] create_invite error:', e); return null; });
  }

  /** Redeem a pending invite TOKEN captured at boot (localStorage
   *  `settlr_pending_token`). One-shot: the key is cleared immediately. Connects to
   *  the inviter and folds/joins per the token bundle, then re-hydrates the cache if
   *  anything changed so home paints the inherited data. Resolves to a result
   *  { reason, folded, joinedGroup, connectedTo } or null. supabase mode only. */
  function redeemPendingToken() {
    if (MODE !== 'supabase' || !_sb) return Promise.resolve(null);
    var token;
    try { token = localStorage.getItem('settlr_pending_token'); localStorage.removeItem('settlr_pending_token'); }
    catch (e) { token = null; }
    token = String(token || '').trim();
    if (!token) return Promise.resolve(null);
    return _sb.rpc('redeem_invite', { p_token: token }).then(function (res) {
      if (res && res.error) { console.error('[Store] redeem_invite error:', res.error); return null; }
      var row = (res && res.data && res.data[0]) || null; // table return → array
      if (!row || row.reason === 'invalid' || row.reason === 'self') return row;
      // A connection/fold/join happened → re-hydrate so home reflects it.
      return _loadFromSupabase().then(function () {
        return { reason: row.reason, folded: row.folded, joinedGroup: row.joined_group, connectedTo: row.connected_to };
      });
    }).catch(function (e) { console.error('[Store] redeem_invite error:', e); return null; });
  }

  /** Claim every other owner's GHOST contact whose phone matches my own verified
   *  phone, rekeying it to my real id (server-side, self-scoped). Inherits the full
   *  shared back-history + forms a connection. Re-hydrates the cache when anything
   *  merged. Resolves to the merge count. supabase mode only; safe no-op otherwise. */
  function mergeGhostsForMe() {
    if (MODE !== 'supabase' || !_sb) return Promise.resolve(0);
    return _sb.rpc('claim_ghosts_by_phone').then(function (res) {
      if (res && res.error) { console.error('[Store] ghost merge error:', res.error); return 0; }
      var n = (res && typeof res.data === 'number') ? res.data : (res && res.data) || 0;
      if (n > 0) return _loadFromSupabase().then(function () { return n; });
      return n;
    }).catch(function (e) { console.error('[Store] ghost merge error:', e); return 0; });
  }

  /** Unlink a linked contact: severs the connection and re-ghosts each side's history
   *  (server-side, both directions) so both keep a private copy but stop sharing.
   *  Re-hydrates on success. supabase mode → RPC; local mode → just drop the contact. */
  function unlinkContact(contactId) {
    if (!contactId) return Promise.resolve(false);
    if (MODE !== 'supabase' || !_sb) { deleteContact(contactId); return Promise.resolve(true); }
    return _sb.rpc('unlink_contact', { p_other: contactId }).then(function (res) {
      if (res && res.error) { console.error('[Store] unlink error:', res.error); return false; }
      return _loadFromSupabase().then(function () { return !!(res && res.data); });
    }).catch(function (e) { console.error('[Store] unlink error:', e); return false; });
  }

  function addExpense(expense) {
    const id = _newId('exp');
    const rec = Object.assign({}, expense, { id });
    rec.occurredAt = _stampOccurredAt(rec);
    data.expenses.push(rec);
    _persist();
    if (MODE === 'supabase') _remote(function () { return _sb.from('expenses').insert(_expenseToDb(rec, true)); });
    return id;
  }

  /** Merge `fields` into the expense with `id` (preserves id + untouched
   *  fields). Returns true if found. Used by the edit-expense Save. */
  function updateExpense(id, fields) {
    const idx = data.expenses.findIndex(e => e.id === id);
    if (idx === -1) return false;
    const prev = data.expenses[idx];
    const patch = Object.assign({}, fields);
    // Keep occurredAt consistent if the calendar date changed: move it to the
    // new day but preserve the original clock time (so it stays correctly ordered).
    if (fields.date && fields.date !== prev.date && !fields.occurredAt) {
      const t = (prev.occurredAt && prev.occurredAt.split('T')[1]) || _nowClock();
      patch.occurredAt = fields.date + 'T' + t;
    }
    data.expenses[idx] = Object.assign({}, prev, patch, { id });
    _persist();
    if (MODE === 'supabase') _remote(function () { return _sb.from('expenses').update(_expenseToDb(patch, false)).eq('id', id); });
    return true;
  }

  function deleteExpense(id) {
    data.expenses = data.expenses.filter(function(e) { return e.id !== id; });
    _persist();
    if (MODE === 'supabase') _remote(function () { return _sb.from('expenses').delete().eq('id', id); });
  }

  function addGroup(group) {
    // Supabase columns are uuid; local mode keeps the readable slug id.
    const id = MODE === 'supabase'
      ? _newId('grp')
      : group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const newGroup = Object.assign({}, group, { id: id, createdAt: new Date().toISOString().slice(0, 10) });
    data.groups.push(newGroup);
    _persist();
    if (MODE === 'supabase') _remote(function () {
      return _sb.from('groups').insert(_groupToDb(newGroup, true)).then(function (r) {
        if (r && r.error) return r;
        var members = (newGroup.memberIds || [])
          .filter(function (m) { return m !== CURRENT_USER_ID; })
          .map(function (cid) { return { group_id: id, contact_id: cid }; });
        return members.length ? _sb.from('group_members').insert(members) : r;
      });
    });
    return id;
  }

  /** Merge `fields` (name / emoji / memberIds) into the group with `id`
   *  (preserves id + untouched fields). Returns true if found. Used by the
   *  edit-group Save. */
  function updateGroup(id, fields) {
    const idx = data.groups.findIndex(g => g.id === id);
    if (idx === -1) return false;
    data.groups[idx] = Object.assign({}, data.groups[idx], fields, { id });
    _persist();
    if (MODE === 'supabase') _remote(function () {
      var p = _sb.from('groups').update(_groupToDb(fields, false)).eq('id', id);
      if (!fields.memberIds) return p;
      // Member list changed → replace the join rows for this group (only if the
      // group update itself succeeded, so the two tables can't diverge).
      return p.then(function (r) { if (r && r.error) return r; return _sb.from('group_members').delete().eq('group_id', id); })
        .then(function () {
          var m = fields.memberIds
            .filter(function (x) { return x !== CURRENT_USER_ID; })
            .map(function (cid) { return { group_id: id, contact_id: cid }; });
          return m.length ? _sb.from('group_members').insert(m) : null;
        });
    });
    return true;
  }

  /** Remove the group with `id` and CASCADE-delete its expenses (so no
   *  orphaned expenses keep affecting balances via a dead groupId). Returns
   *  true if the group existed. */
  function deleteGroup(id) {
    const existed = data.groups.some(g => g.id === id);
    data.groups = data.groups.filter(g => g.id !== id);
    data.expenses = data.expenses.filter(e => e.groupId !== id);
    _persist();
    // Server-side FKs (group_members, expenses.group_id) are ON DELETE CASCADE,
    // so removing the group row also clears its members + expenses.
    if (MODE === 'supabase') _remote(function () { return _sb.from('groups').delete().eq('id', id); });
    return existed;
  }

  /** Merge `fields` (name / upi / bank / bio / photo …) into the current
   *  user (preserves the id). Returns the updated user copy. Used by
   *  edit-profile Save. */
  function updateProfile(fields) {
    data.currentUser = Object.assign({}, data.currentUser, fields, { id: data.currentUser.id });
    _persist();
    if (MODE === 'supabase') _remote(function () { return _sb.from('profiles').update(_profileToDb(fields)).eq('id', CURRENT_USER_ID); });
    return Object.assign({}, data.currentUser);
  }

  /** Permanently delete the account (Delete Account). In supabase mode this
   *  invokes the `delete-account` Edge Function, which uses the service-role
   *  admin API to delete the auth.users row — every owned table row then
   *  cascade-deletes (FK `on delete cascade`). Returns a Promise the caller
   *  MUST await before signing out + navigating, so the request isn't aborted
   *  by page unload. The localStorage cache is cleared ONLY once the server
   *  delete is confirmed — otherwise a failed delete would wipe the device
   *  while the account still lives on the server. */
  function deleteAllData() {
    if (MODE !== 'supabase' || !_sb) {
      localStorage.removeItem(LS_KEY);
      return Promise.resolve({ ok: true });
    }
    // supabase-js injects the caller's access token as the Authorization
    // header; the function derives the uid from that verified JWT.
    return _sb.functions.invoke('delete-account', { body: {} })
      .then(function (res) {
        if (res && res.error) {
          console.error('[Store] delete-account failed:', res.error.message || res.error);
          return { ok: false, error: res.error };
        }
        localStorage.removeItem(LS_KEY);
        return { ok: true };
      })
      .catch(function (e) {
        console.error('[Store] delete-account threw:', e);
        return { ok: false, error: e };
      });
  }

  function hasContactTransactions(contactId) {
    var hasExpense = data.expenses.some(function(e) {
      return e.splitAmong.includes(CURRENT_USER_ID) && e.splitAmong.includes(contactId);
    });
    if (hasExpense) return true;
    return data.settlements.some(function(s) {
      return (s.fromId === CURRENT_USER_ID && s.toId === contactId) ||
             (s.fromId === contactId && s.toId === CURRENT_USER_ID);
    });
  }

  /** Returns the most recent ISO date string from expenses + settlements
   *  involving this contact, or null if none exist. */
  function getLastTransactionDate(contactId) {
    var dates = [];
    data.expenses.forEach(function(e) {
      if (e.splitAmong.includes(CURRENT_USER_ID) && e.splitAmong.includes(contactId)) {
        dates.push(e.date);
      }
    });
    data.settlements.forEach(function(s) {
      if ((s.fromId === CURRENT_USER_ID && s.toId === contactId) ||
          (s.fromId === contactId && s.toId === CURRENT_USER_ID)) {
        dates.push(s.date);
      }
    });
    if (!dates.length) return null;
    return dates.sort().pop(); // most recent ISO date
  }

  function getNetBalance() {
    let net = 0;
    data.expenses.forEach(e => {
      const r = _computeUserNet(e);
      if (r.direction === 'lent') net += r.amount;
      else if (r.direction === 'owe') net -= r.amount;
    });
    // factor in settlements: paying someone reduces debt (increases net), receiving reduces credit
    data.settlements.forEach(s => {
      if (s.fromId === CURRENT_USER_ID) net += s.amount;
      else if (s.toId === CURRENT_USER_ID) net -= s.amount;
    });
    net = _round2(net);
    if (net > 0)  return { amount: net,  direction: 'lent'    };
    if (net < 0)  return { amount: -net, direction: 'owe'     };
    return { amount: 0, direction: 'settled' };
  }

  function getGroupBalance(groupId) {
    let net = 0;
    data.expenses
      .filter(e => e.groupId === groupId)
      .forEach(e => {
        const r = _computeUserNet(e);
        if (r.direction === 'lent') net += r.amount;
        else if (r.direction === 'owe') net -= r.amount;
      });
    // factor in group-scoped settlements involving the current user (paying
    // reduces my debt → net +; receiving reduces my credit → net -).
    data.settlements
      .filter(s => s.groupId === groupId &&
        (s.fromId === CURRENT_USER_ID || s.toId === CURRENT_USER_ID))
      .forEach(s => {
        if (s.fromId === CURRENT_USER_ID) net += s.amount;
        else net -= s.amount;
      });
    net = _round2(net);
    if (net > 0)  return { amount: net,  direction: 'lent'    };
    if (net < 0)  return { amount: -net, direction: 'owe'     };
    return { amount: 0, direction: 'settled' };
  }

  function getContactBalance(contactId) {
    let net = 0;
    data.expenses
      .filter(e =>
        e.splitAmong.includes(CURRENT_USER_ID) &&
        e.splitAmong.includes(contactId)
      )
      .forEach(e => {
        net += _pairwise(e, CURRENT_USER_ID, contactId);
      });
    // factor in settlements between currentUser and this contact
    data.settlements
      .filter(s =>
        (s.fromId === CURRENT_USER_ID && s.toId === contactId) ||
        (s.fromId === contactId && s.toId === CURRENT_USER_ID)
      )
      .forEach(s => {
        if (s.fromId === CURRENT_USER_ID) net += s.amount;
        else net -= s.amount;
      });
    net = _round2(net);
    if (net > 0)  return { amount: net,  direction: 'lent'    };
    if (net < 0)  return { amount: -net, direction: 'owe'     };
    return { amount: 0, direction: 'settled' };
  }

  function getComments(expenseId) {
    if (!data.comments) return [];
    return data.comments
      .filter(function(c) { return c.expenseId === expenseId; })
      .sort(function(a, b) { return a.createdAt.localeCompare(b.createdAt); });
  }

  function addComment(expenseId, text) {
    if (!data.comments) data.comments = [];
    var id = _newId('comment');
    var comment = {
      id: id,
      expenseId: expenseId,
      authorId: CURRENT_USER_ID,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    data.comments.push(comment);
    _persist();
    if (MODE === 'supabase') _remote(function () { return _sb.from('comments').insert(_commentToDb(comment, true)); });
    return id;
  }

  function recordSettlement(settlement) {
    const id = _newId('sett');
    const rec = Object.assign({}, settlement, { id });
    rec.occurredAt = _stampOccurredAt(rec);
    data.settlements.push(rec);
    _persist();
    if (MODE === 'supabase') _remote(function () { return _sb.from('settlements').insert(_settlementToDb(rec, true)); });
    return id;
  }

  function getSettlements(contactId) {
    return data.settlements
      .filter(s =>
        (s.fromId === CURRENT_USER_ID && s.toId === contactId) ||
        (s.fromId === contactId && s.toId === CURRENT_USER_ID)
      )
      .sort(_byTimeDesc);
  }

  /** Settlements tagged with `groupId` that involve the current user
   *  (for the group transaction history). Newest first. */
  function getGroupSettlements(groupId) {
    return data.settlements
      .filter(s => s.groupId === groupId &&
        (s.fromId === CURRENT_USER_ID || s.toId === CURRENT_USER_ID))
      .sort(_byTimeDesc);
  }

  /** All settlements involving the current user (for the Activity feed). Newest first. */
  function getAllSettlements() {
    return data.settlements
      .filter(s => s.fromId === CURRENT_USER_ID || s.toId === CURRENT_USER_ID)
      .sort(_byTimeDesc);
  }

  /** A single settlement by id (for settlement-detail). Returns a copy or null. */
  function getSettlement(id) {
    const s = data.settlements.find(x => x.id === id);
    return s ? Object.assign({}, s) : null;
  }

  /** Remove a settlement (Undo). Balances recompute from data.settlements, so
   *  deleting one restores the prior balances. Returns true if it existed. */
  function deleteSettlement(id) {
    const existed = data.settlements.some(s => s.id === id);
    data.settlements = data.settlements.filter(s => s.id !== id);
    _persist();
    if (MODE === 'supabase') _remote(function () { return _sb.from('settlements').delete().eq('id', id); });
    return existed;
  }

  function getMemberBalancesForGroup(groupId) {
    const group = _getGroupById(groupId);
    if (!group) return [];
    const expenses = data.expenses.filter(e => e.groupId === groupId);
    return group.memberIds
      .filter(mid => mid !== CURRENT_USER_ID)
      .map(mid => {
        const contact = _getContactById(mid);
        let net = 0;
        expenses.forEach(e => {
          if (!e.splitAmong.includes(CURRENT_USER_ID) || !e.splitAmong.includes(mid)) return;
          net += _pairwise(e, CURRENT_USER_ID, mid);
        });
        // factor in group-scoped settlements between me and this member.
        data.settlements
          .filter(s => s.groupId === groupId &&
            ((s.fromId === CURRENT_USER_ID && s.toId === mid) ||
             (s.fromId === mid && s.toId === CURRENT_USER_ID)))
          .forEach(s => {
            if (s.fromId === CURRENT_USER_ID) net += s.amount;
            else net -= s.amount;
          });
        net = _round2(net);
        return {
          contactId: mid,
          name: contact ? contact.name : mid,
          initials: contact ? contact.initials : mid.slice(0, 2).toUpperCase(),
          photo: contact ? contact.photo : null,
          amount: Math.abs(net),
          direction: net > 0 ? 'lent' : net < 0 ? 'owe' : 'settled'
        };
      });
  }

  function getActivityFeed(limit) {
    const all = data.expenses
      .filter(e => e.splitAmong.includes(CURRENT_USER_ID))
      .sort(_byTimeDesc);

    const items = (limit ? all.slice(0, limit) : all).map(e => {
      const net = _computeUserNet(e);
      let contextLabel = '';
      if (e.groupId) {
        const g = _getGroupById(e.groupId);
        contextLabel = g ? g.name : e.groupId;
      } else if (e.splitAmong && e.splitAmong.length) {
        // Non-group expense → first names of other participants
        const others = e.splitAmong.filter(id => id !== CURRENT_USER_ID);
        const firstNames = others.map(id => {
          const c = _getContactById(id);
          return c ? c.name.split(' ')[0] : id;
        });
        if (firstNames.length === 0) {
          contextLabel = '';
        } else if (firstNames.length <= 2) {
          contextLabel = firstNames.join(', ');
        } else {
          contextLabel = firstNames.slice(0, 2).join(', ') + ' +' + (firstNames.length - 2) + ' more';
        }
      } else if (e.contactId) {
        const c = _getContactById(e.contactId);
        contextLabel = c ? c.name : e.contactId;
      }
      return Object.assign({}, e, { net, contextLabel });
    });

    return items;
  }

  /** Groups an array of expenses (or activity items) by display date label.
   *  Returns an ordered array of [label, items[]] pairs (newest date first). */
  function groupExpensesByDate(expenses) {
    const map = new Map();
    expenses.forEach(e => {
      const label = _formatDateLabel(e.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(e);
    });
    return Array.from(map.entries());
  }

  // Currency follows the settings preference. All data is stored in INR (the
  // base); we convert at two boundaries only — DISPLAY (formatINR / fromBase)
  // and amount INPUT (toBase). Static rates (no FX network).
  const CURRENCY_SYMBOLS = { INR: '\u20B9', USD: '$', EUR: '\u20AC', GBP: '\u00A3' };
  const CURRENCY_NAMES = { INR: 'Indian Rupee', USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound' };
  const RATES_FROM_INR = { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095 };
  /** The supported currencies as [{code, symbol, name}] — single source of
   *  truth for currency pickers (add-amount, create-group, edit-group). */
  function currencyOptions() {
    return ['INR', 'USD', 'EUR', 'GBP'].map(function (c) {
      return { code: c, symbol: CURRENCY_SYMBOLS[c], name: CURRENCY_NAMES[c] };
    });
  }
  function _currencyCode() {
    try {
      const p = JSON.parse(localStorage.getItem('settlr_prefs') || '{}') || {};
      return RATES_FROM_INR[p.currency] != null ? p.currency : 'INR';
    } catch (e) { return 'INR'; }
  }
  function _currencySymbol() { return CURRENCY_SYMBOLS[_currencyCode()] || '\u20B9'; }
  // Live (manually-refreshed) rates override the static table when present.
  function _liveRates() {
    try { var r = JSON.parse(localStorage.getItem('settlr_rates') || 'null');
      return (r && r.rates) ? r.rates : null; } catch (e) { return null; }
  }
  function _rate() {
    var code = _currencyCode();
    var live = _liveRates();
    if (live && live[code] != null) return live[code];
    return RATES_FROM_INR[code] || 1;
  }

  /** Fetch live INR-base rates once (manual refresh). Caches to localStorage
   *  `settlr_rates`; on any failure resolves { ok:false } and we keep the
   *  cached/static rates. Read-only public data, no credentials sent. */
  function refreshRates() {
    return fetch('https://open.er-api.com/v6/latest/INR')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.result !== 'success' || !d.rates) throw new Error('bad response');
        var keep = { INR: 1, USD: d.rates.USD, EUR: d.rates.EUR, GBP: d.rates.GBP };
        localStorage.setItem('settlr_rates', JSON.stringify({ base: 'INR', rates: keep, fetchedAt: Date.now() }));
        return { ok: true, fetchedAt: Date.now() };
      })
      .catch(function () { return { ok: false }; });
  }
  /** Timestamp (ms) of the last successful rates refresh, or null if static. */
  function ratesUpdatedAt() {
    try { var r = JSON.parse(localStorage.getItem('settlr_rates') || 'null');
      return (r && r.fetchedAt) || null; } catch (e) { return null; }
  }

  /** INR → display-currency amount (for prefilling inputs in the chosen currency). */
  function fromBase(inr) { return _round2((inr || 0) * _rate()); }
  /** display-currency amount → INR (for storing what the user typed). */
  function toBase(disp) { return _round2((disp || 0) / _rate()); }

  /** Format an INR amount as a currency string in the chosen currency:
   *  ₹1,450 / $17.4 / €15.95. Magnitude is converted via the static rate;
   *  grouping stays en-IN. */
  function formatINR(amount) {
    const shown = fromBase(amount);
    // Show paise/cents only when there's a fractional part, so whole amounts
    // read "₹900" while fractional ones read "₹900.50" (never a lone "₹900.5").
    const hasFraction = Math.abs(shown - Math.round(shown)) > 0.005;
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2
    }).format(shown);
    return _currencySymbol() + formatted;
  }

  // ── Per-expense currency ──────────────────────────────────
  // An expense may carry its own `currency` ISO code; when present its OWN
  // amount is shown in that currency (balances, which aggregate many expenses,
  // stay in the global currency). Amounts are still STORED in INR — these
  // helpers convert/format for an explicit code. A falsy code falls back to the
  // global behaviour, so currency-less expenses render exactly as before.
  function _rateFor(code) {
    if (!code) return _rate();
    var live = _liveRates();
    if (live && live[code] != null) return live[code];
    return RATES_FROM_INR[code] || 1;
  }
  function currencySymbolOf(code) {
    if (!code) return _currencySymbol();
    return CURRENCY_SYMBOLS[code] || _currencySymbol();
  }
  /** INR → an explicit currency's amount (prefilling inputs in that currency). */
  function fromBaseIn(inr, code) {
    if (!code) return fromBase(inr);
    return _round2((inr || 0) * _rateFor(code));
  }
  /** An explicit currency's amount → INR (storing what the user typed). */
  function toBaseIn(disp, code) {
    if (!code) return toBase(disp);
    return _round2((disp || 0) / _rateFor(code));
  }
  /** Format an INR amount in an explicit currency: falsy code ⇒ global formatINR. */
  function formatIn(amount, code) {
    if (!code) return formatINR(amount);
    var shown = fromBaseIn(amount, code);
    var hasFraction = Math.abs(shown - Math.round(shown)) > 0.005;
    var formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2
    }).format(shown);
    return currencySymbolOf(code) + formatted;
  }

  // ── Supabase layer (active only when MODE === 'supabase') ─

  // New-record id: a real uuid for Supabase's uuid columns; the readable
  // legacy scheme in local mode (localStorage doesn't care about the format).
  function _newId(prefix) {
    if (MODE === 'supabase' && typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
  }

  function _initialsFromName(name) {
    if (!name) return '';
    var parts = String(name).trim().split(/\s+/);
    var a = parts[0] ? parts[0][0] : '';
    var b = parts[1] ? parts[1][0] : '';
    return (a + b).toUpperCase();
  }

  // Queue remote writes so they run in submission order. This prevents a
  // dependent write from outrunning its parent — e.g. addGroup() then
  // addExpense() in that group: the expense insert (FK group_id) must not hit
  // the server before the group row commits. Failures are logged, never thrown,
  // so a flaky network can't break the optimistic in-memory update; and one
  // failed write doesn't abort the queue (the chain always resolves).
  var _writeChain = Promise.resolve();
  function _remote(fn) {
    _writeChain = _writeChain.then(function () {
      return Promise.resolve(fn())
        .then(function (r) { if (r && r.error) console.error('[Store] remote write error:', r.error); })
        .catch(function (e) { console.error('[Store] remote write failed:', e); });
    });
    return _writeChain;
  }

  // Copy only the camelCase keys present in `obj` into snake_case per `map`.
  function _mapKeys(obj, map) {
    var out = {};
    Object.keys(map).forEach(function (camel) {
      if (obj[camel] !== undefined) out[map[camel]] = obj[camel];
    });
    return out;
  }

  var _EXPENSE_MAP = { groupId: 'group_id', contactId: 'contact_id', title: 'title', emoji: 'emoji', category: 'category', totalAmount: 'total_amount', paidById: 'paid_by_id', payers: 'payers', splitAmong: 'split_among', splitMethod: 'split_method', splitAmounts: 'split_amounts', date: 'date', occurredAt: 'occurred_at', notes: 'notes', currency: 'currency' };
  var _GROUP_MAP   = { name: 'name', emoji: 'emoji', photo: 'photo', type: 'type', currency: 'currency', memberIds: 'members', createdAt: 'created_at' };
  var _SETTLE_MAP  = { fromId: 'from_id', toId: 'to_id', amount: 'amount', method: 'method', groupId: 'group_id', date: 'date', occurredAt: 'occurred_at' };
  var _COMMENT_MAP = { expenseId: 'expense_id', authorId: 'author_id', text: 'text', createdAt: 'created_at' };
  var _PROFILE_MAP = { name: 'name', initials: 'initials', handle: 'handle', phone: 'phone', upi: 'upi', bank: 'bank', bio: 'bio', photo: 'photo' };
  var _CONTACT_MAP = { name: 'name', initials: 'initials', phone: 'phone', onSettlr: 'on_settlr', photo: 'photo', userId: 'user_id' };

  function _contactToDb(c, forInsert) {
    var out = _mapKeys(c, _CONTACT_MAP);
    if (forInsert) { out.id = c.id; out.owner_id = CURRENT_USER_ID; }
    return out;
  }

  function _expenseToDb(e, forInsert) {
    var out = _mapKeys(e, _EXPENSE_MAP);
    if (forInsert) { out.id = e.id; out.owner_id = CURRENT_USER_ID; }
    return out;
  }
  function _groupToDb(g, forInsert) {
    var out = _mapKeys(g, _GROUP_MAP);
    if (forInsert) { out.id = g.id; out.owner_id = CURRENT_USER_ID; }
    return out;
  }
  function _settlementToDb(s, forInsert) {
    var out = _mapKeys(s, _SETTLE_MAP);
    if (forInsert) { out.id = s.id; out.owner_id = CURRENT_USER_ID; }
    return out;
  }
  function _commentToDb(c, forInsert) {
    var out = _mapKeys(c, _COMMENT_MAP);
    if (forInsert) { out.id = c.id; out.owner_id = CURRENT_USER_ID; }
    return out;
  }
  function _profileToDb(p) { return _mapKeys(p, _PROFILE_MAP); }

  // ── DB row → app shape ──
  function _expenseFromDb(r) {
    return {
      id: r.id, groupId: r.group_id || null, contactId: r.contact_id || null,
      title: r.title, emoji: r.emoji, category: r.category,
      totalAmount: r.total_amount != null ? Number(r.total_amount) : 0,
      paidById: r.paid_by_id || null, payers: r.payers || null,
      splitAmong: r.split_among || [], splitMethod: r.split_method || null,
      splitAmounts: r.split_amounts || null, date: r.date,
      occurredAt: r.occurred_at || _deriveOccurredAt({ id: r.id, date: r.date }),
      notes: r.notes || ''
    };
  }
  function _contactFromDb(r) {
    return { id: r.id, name: r.name, initials: r.initials || _initialsFromName(r.name), phone: r.phone || '', onSettlr: !!r.on_settlr, photo: r.photo || undefined, userId: r.user_id || null };
  }
  function _groupFromDb(r, memberIds) {
    return { id: r.id, name: r.name, emoji: r.emoji, photo: r.photo || undefined, type: r.type, createdAt: r.created_at ? String(r.created_at).slice(0, 10) : '', memberIds: memberIds };
  }
  function _settlementFromDb(r) {
    return { id: r.id, fromId: r.from_id, toId: r.to_id, amount: r.amount != null ? Number(r.amount) : 0, method: r.method || '', groupId: r.group_id || null, date: r.date, occurredAt: r.occurred_at || _deriveOccurredAt({ id: r.id, date: r.date }) };
  }
  function _commentFromDb(r) {
    return { id: r.id, expenseId: r.expense_id, authorId: r.author_id, text: r.text, createdAt: r.created_at };
  }
  function _profileFromDb(r, uid) {
    return { id: uid, name: r.name || '', initials: r.initials || _initialsFromName(r.name) || '', handle: r.handle || '', phone: r.phone || '', upi: r.upi || '', bank: r.bank || '', bio: r.bio || '', photo: r.photo || undefined };
  }

  // Handle auto-claim now lives in the `handle_new_user` DB trigger (Phase 1):
  // every profile has a unique handle from row-creation, so the old client-side
  // _ensureHandle / _sanitizeHandle path was removed. Customization goes through
  // the check_handle / set_handle RPCs.

  // Hydrate the whole in-memory cache from Supabase for the current user.
  function _loadFromSupabase() {
    var uid = CURRENT_USER_ID;
    return Promise.all([
      _sb.from('profiles').select('*').eq('id', uid).maybeSingle(),
      _sb.from('contacts').select('*').eq('owner_id', uid),
      _sb.from('groups').select('*').eq('owner_id', uid),
      _sb.from('group_members').select('*'),     // RLS limits these to the user's groups
      _sb.from('expenses').select('*').eq('owner_id', uid),
      _sb.from('settlements').select('*').eq('owner_id', uid),
      // Comments: no owner filter — participant RLS returns every comment on an
      // expense I own OR participate in (mine + co-participants' on shared expenses).
      _sb.from('comments').select('*'),
      // Shared canonical expenses where I'm a participant but not the owner.
      _sb.from('expenses').select('*').contains('split_among', [uid]),
      // Public fields of everyone I'm connected to (bypasses owner-only profiles RLS).
      _sb.rpc('get_connection_profiles'),
      // Shared groups where I'm a member but not the owner.
      _sb.from('groups').select('*').contains('members', [uid]),
      // Shared settlements where I'm the from/to party but not the owner.
      _sb.from('settlements').select('*').or('from_id.eq.' + uid + ',to_id.eq.' + uid)
    ]).then(function (res) {
      var profile = res[0].data || {};
      var contacts = res[1].data || [];
      var ownGroups = res[2].data || [];
      var members = res[3].data || [];
      var ownExpenses = res[4].data || [];
      var ownSettlements = res[5].data || [];
      var comments = res[6].data || [];
      var sharedExpenses = (res[7] && res[7].data) || [];
      var connProfiles = (res[8] && res[8].data) || [];
      var sharedGroups = (res[9] && res[9].data) || [];
      var sharedSettlements = (res[10] && res[10].data) || [];

      var byGroup = {};
      members.forEach(function (m) { (byGroup[m.group_id] = byGroup[m.group_id] || []).push(m.contact_id); });

      // Merge owner + participant expenses, dedup by id.
      var seen = {}, mergedExpenses = [];
      ownExpenses.concat(sharedExpenses).forEach(function (r) {
        if (seen[r.id]) return; seen[r.id] = 1; mergedExpenses.push(_expenseFromDb(r));
      });

      // Merge owner + shared groups, dedup by id. For owned groups the
      // group_members join rows are authoritative; for shared groups (no join
      // rows visible — that RLS stays owner-only) reconstruct the member list
      // from the `members` array column. memberIds is kept owner-inclusive.
      var gSeen = {}, mergedGroups = [];
      ownGroups.concat(sharedGroups).forEach(function (g) {
        if (gSeen[g.id]) return; gSeen[g.id] = 1;
        var others = byGroup[g.id];
        if (!others) others = (g.members || []).filter(function (m) { return m !== uid; });
        mergedGroups.push(_groupFromDb(g, [uid].concat(others)));
      });

      // Merge owner + shared settlements, dedup by id.
      var sSeen = {}, mergedSettlements = [];
      ownSettlements.concat(sharedSettlements).forEach(function (r) {
        if (sSeen[r.id]) return; sSeen[r.id] = 1; mergedSettlements.push(_settlementFromDb(r));
      });

      // Synthesize linked contact rows for connected users I don't already
      // have a contact for, so their name/photo resolve on shared expenses.
      var contactRows = contacts.map(_contactFromDb);
      var haveId = {};
      contactRows.forEach(function (c) { haveId[c.id] = 1; });
      connProfiles.forEach(function (p) {
        if (!p || !p.id || p.id === uid || haveId[p.id]) return;
        haveId[p.id] = 1;
        contactRows.push({
          id: p.id, userId: p.id, name: p.name || p.handle || '',
          initials: _initialsFromName(p.name || p.handle), handle: p.handle || '',
          phone: '', onSettlr: true, photo: p.photo || undefined
        });
      });

      data = {
        currentUser: _profileFromDb(profile, uid),
        contacts: contactRows,
        groups: mergedGroups,
        expenses: mergedExpenses,
        settlements: mergedSettlements,
        comments: comments.map(_commentFromDb),
        _version: SEED_VERSION
      };
    });
  }

  /** Called once at boot. Resolves to { mode }. In supabase mode it rebinds
   *  CURRENT_USER_ID to the session uuid and hydrates the cache from Supabase;
   *  otherwise it leaves the local seed (already loaded synchronously) in place. */
  function init() {
    if (!(window.SettlrAuth && window.SettlrAuth.configured)) {
      return Promise.resolve({ mode: 'local' });
    }
    return window.SettlrAuth.ready.then(function (ok) {
      if (!ok) return { mode: 'local' };
      return window.SettlrAuth.getUser().then(function (user) {
        if (!user) return { mode: 'local' };
        MODE = 'supabase';
        _sb = window.SettlrAuth.client();
        CURRENT_USER_ID = user.id;
        return _loadFromSupabase()
          .then(function () { return { mode: 'supabase' }; });
      });
    }).catch(function (e) {
      console.error('[Store] supabase init failed; falling back to local:', e);
      MODE = 'local';
      _sb = null;
      CURRENT_USER_ID = 'divyansh-rastogi';
      if (!data) _init();
      return { mode: 'local' };
    });
  }

  /** True once a profile + at least one row exist (used to decide first-run). */
  function isEmpty() {
    return !data || (!data.contacts.length && !data.groups.length && !data.expenses.length);
  }

  /** One-time demo seed for the signed-in Supabase user. Remaps the legacy
   *  string ids in SEED_DATA to fresh uuids (self → auth uid) and inserts
   *  contacts → groups → members → expenses, then re-hydrates. No-op outside
   *  supabase mode. */
  function seedDemoData() {
    if (MODE !== 'supabase') return Promise.resolve({ ok: false, reason: 'not in supabase mode' });
    var uid = CURRENT_USER_ID;
    var idMap = {};
    idMap[SEED_DATA.currentUser.id] = uid;

    var contactRows = SEED_DATA.contacts.map(function (c) {
      var nid = crypto.randomUUID(); idMap[c.id] = nid;
      return { id: nid, owner_id: uid, name: c.name, initials: c.initials, phone: c.phone, on_settlr: !!c.onSettlr, photo: c.photo || null };
    });

    var groupRows = [], memberRows = [];
    SEED_DATA.groups.forEach(function (g) {
      var nid = crypto.randomUUID(); idMap[g.id] = nid;
      groupRows.push({ id: nid, owner_id: uid, name: g.name, emoji: g.emoji, photo: g.photo || null, type: g.type, created_at: g.createdAt });
      (g.memberIds || []).forEach(function (m) {
        if (m !== SEED_DATA.currentUser.id && idMap[m]) memberRows.push({ group_id: nid, contact_id: idMap[m] });
      });
    });

    var remap = function (x) { return idMap[x] || x; };
    var expenseRows = SEED_DATA.expenses.map(function (e) {
      var payers = null;
      if (e.payers) { payers = {}; Object.keys(e.payers).forEach(function (k) { payers[remap(k)] = e.payers[k]; }); }
      var splitAmounts = null;
      if (e.splitAmounts) { splitAmounts = {}; Object.keys(e.splitAmounts).forEach(function (k) { splitAmounts[remap(k)] = e.splitAmounts[k]; }); }
      return {
        id: crypto.randomUUID(), owner_id: uid,
        group_id: e.groupId ? remap(e.groupId) : null,
        contact_id: e.contactId ? remap(e.contactId) : null,
        title: e.title, emoji: e.emoji, category: e.category,
        total_amount: e.totalAmount, paid_by_id: e.paidById ? remap(e.paidById) : null,
        payers: payers, split_among: (e.splitAmong || []).map(remap),
        split_method: e.splitMethod || null, split_amounts: splitAmounts,
        date: e.date, occurred_at: _deriveOccurredAt({ id: e.id, date: e.date }),
        notes: e.notes || null
      };
    });

    // Ensure the profile row exists first (the auth trigger usually creates it,
    // but seeding must not depend on that). `handle` is omitted — it's UNIQUE and
    // would collide across multiple demo users.
    return _sb.from('profiles').upsert({
      id: uid,
      name: SEED_DATA.currentUser.name,
      initials: SEED_DATA.currentUser.initials,
      phone: SEED_DATA.currentUser.phone,
      upi: SEED_DATA.currentUser.upi,
      bank: SEED_DATA.currentUser.bank,
      bio: SEED_DATA.currentUser.bio
    }, { onConflict: 'id' })
      .then(function () { return _sb.from('contacts').insert(contactRows); })
      .then(function () { return _sb.from('groups').insert(groupRows); })
      .then(function () { return memberRows.length ? _sb.from('group_members').insert(memberRows) : null; })
      .then(function () { return expenseRows.length ? _sb.from('expenses').insert(expenseRows) : null; })
      .then(function () { return _loadFromSupabase(); })
      .then(function () { return { ok: true }; })
      .catch(function (e) { console.error('[Store] seedDemoData failed:', e); return { ok: false, error: e }; });
  }

  // ── Boot ─────────────────────────────────────────────────

  // Synchronous local seed so the app works immediately in local mode (and as a
  // safe default before init() runs). init() replaces `data` in supabase mode.
  _init();

  // ── Expose ────────────────────────────────────────────────

  return {
    init,
    seedDemoData,
    isEmpty,
    getCurrentUser,
    getContacts,
    getContact,
    addContact,
    updateContact,
    deleteContact,
    findUserByHandle,
    findUserByEmail,
    findUsersByPhones,
    checkHandle,
    setHandle,
    connect,
    redeemPendingInvite,
    createInvite,
    redeemPendingToken,
    mergeGhostsForMe,
    unlinkContact,
    getGroups,
    getGroup,
    getExpenses,
    getExpensesForContact,
    getCommonGroups,
    addExpense,
    updateExpense,
    deleteExpense,
    addGroup,
    updateGroup,
    deleteGroup,
    updateProfile,
    deleteAllData,
    hasContactTransactions,
    getLastTransactionDate,
    getNetBalance,
    shareOf: _shareOf,
    getGroupBalance,
    getContactBalance,
    getMemberBalancesForGroup,
    getPayerSummary,
    getActivityFeed,
    groupExpensesByDate,
    formatINR,
    formatTime,
    formatPhone,
    fromBase,
    toBase,
    fromBaseIn,
    toBaseIn,
    formatIn,
    currencySymbol: _currencySymbol,
    currencySymbolOf,
    currencyCode: _currencyCode,
    currencyOptions,
    refreshRates,
    ratesUpdatedAt,
    recordSettlement,
    getSettlements,
    getGroupSettlements,
    getAllSettlements,
    getSettlement,
    deleteSettlement,
    getComments,
    addComment,
    // expose for debugging
    _computeUserNet
  };
})();
