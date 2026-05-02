/* ============================================================
   Settlr Store — localStorage-backed data layer
   window.Store — IIFE, no framework, no build step
   ============================================================ */

window.Store = (function () {
  'use strict';

  const LS_KEY = 'settlr_data';
  const SEED_VERSION = 5;
  const CURRENT_USER_ID = 'divyansh-rastogi';

  // ── Seed Data ────────────────────────────────────────────

  const SEED_DATA = {
    currentUser: {
      id: 'divyansh-rastogi',
      name: 'Divyansh Rastogi',
      initials: 'DR'
    },

    contacts: [
      { id: 'rahul-arora',    name: 'Rahul Arora',    initials: 'RA', phone: '98765-43210', onSettlr: true,  photo: '/assets/people/Ashwin Santiago.webp' },
      { id: 'priya-sharma',   name: 'Priya Sharma',   initials: 'PS', phone: '97654-32109', onSettlr: true,  photo: '/assets/people/Priya Shepard.webp' },
      { id: 'arjun-kumar',    name: 'Arjun Kumar',    initials: 'AK', phone: '96543-21098', onSettlr: true,  photo: '/assets/people/Ali Mahdi.webp' },
      { id: 'johnnie-walker', name: 'Johnnie Walker', initials: 'JW', phone: '829338-192',  onSettlr: true,  photo: '/assets/people/Frank Whitaker.webp' },
      { id: 'manish-kumar',   name: 'Manish Kumar',   initials: 'MK', phone: '829338-001',  onSettlr: true,  photo: '/assets/people/Hasan Johns.webp' },
      { id: 'beau-geste',     name: 'Beau Geste',     initials: 'BG', phone: '837291-203',  onSettlr: true,  photo: '/assets/people/Benedict Doherty.webp' },
      { id: 'kendra-cole',    name: 'Kendra Cole',    initials: 'KC', phone: '849205-314',  onSettlr: false },
      { id: 'sophie-miller',  name: 'Sophie Miller',  initials: 'SM', phone: '865432-404',  onSettlr: false },
      { id: 'liam-anderson',  name: 'Liam Anderson',  initials: 'LA', phone: '872450-150',  onSettlr: true,  photo: '/assets/people/Liam Hood.webp' },
      { id: 'avery-rivers',   name: 'Avery Rivers',   initials: 'AR', phone: '711209-567',  onSettlr: false, photo: '/assets/people/Ava Wright.webp' },
      { id: 'tessa-moore',    name: 'Tessa Moore',    initials: 'TM', phone: '703918-678',  onSettlr: false },
      { id: 'gavin-hayes',    name: 'Gavin Hayes',    initials: 'GH', phone: '921563-778',  onSettlr: true  },
      { id: 'clara-fields',   name: 'Clara Fields',   initials: 'CF', phone: '849203-887',  onSettlr: true,  photo: '/assets/people/Florence Shaw.webp' },
      { id: 'zoe-martin',     name: 'Zoe Martin',     initials: 'ZM', phone: '890231-998',  onSettlr: true,  photo: '/assets/people/Zara Bush.webp' },
      { id: 'dylan-reed',     name: 'Dylan Reed',     initials: 'DR', phone: '811054-119',  onSettlr: true,  photo: '/assets/people/Drew Cano.webp' },
      { id: 'kylie-porter',   name: 'Kylie Porter',   initials: 'KP', phone: '832950-230',  onSettlr: true  },
      { id: 'henry-nash',     name: 'Henry Nash',     initials: 'HN', phone: '760112-341',  onSettlr: true  },
      { id: 'ella-brooks',    name: 'Ella Brooks',    initials: 'EB', phone: '812345-456',  onSettlr: true,  photo: '/assets/people/Elsie Roy.webp' },
      { id: 'neha-mehra',     name: 'Neha Mehra',     initials: 'NM', phone: '899012-567',  onSettlr: true,  photo: '/assets/people/Nala Goins.webp' },
      { id: 'vikram-kapoor',  name: 'Vikram Kapoor',  initials: 'VK', phone: '877654-678',  onSettlr: true,  photo: '/assets/people/Marvin Robbins.webp' }
    ],

    groups: [
      {
        id: 'goa-trip',
        name: 'Goa Trip',
        emoji: '🏖️',
        photo: '/assets/groups/balkan-campers-ON2TRrhgOBU-unsplash.webp',
        type: 'trip',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'johnnie-walker'],
        createdAt: '2025-02-24'
      },
      {
        id: 'toronto-trip',
        name: 'Toronto Trip',
        emoji: '🍁',
        photo: '/assets/groups/will-truettner-wcT778-M1WE-unsplash.webp',
        type: 'trip',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'johnnie-walker'],
        createdAt: '2026-03-01'
      },
      {
        id: 'roommates',
        name: 'Roommates',
        emoji: '🏠',
        photo: '/assets/groups/zoshua-colah-6sLH0exs2ME-unsplash.webp',
        type: 'home',
        memberIds: ['divyansh-rastogi', 'johnnie-walker', 'rahul-arora', 'manish-kumar'],
        createdAt: '2025-01-01'
      },
      {
        id: 'diwali-party',
        name: 'Diwali Party',
        emoji: '🪔',
        photo: '/assets/groups/abhimanyu-jhingan-o1Bis9ykTss-unsplash.webp',
        type: 'event',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'johnnie-walker'],
        createdAt: '2025-10-15'
      },
      {
        id: 'game-night',
        name: 'Game Night',
        emoji: '🎲',
        photo: '/assets/groups/amelie-aronson-Y2kYm4UFiXs-unsplash.webp',
        type: 'event',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'arjun-kumar', 'beau-geste'],
        createdAt: '2026-03-12'
      },
      {
        id: 'brooklyn-reunion',
        name: 'Brooklyn Reunion',
        emoji: '🌆',
        photo: '/assets/groups/ben-duchac-96DW4Pow3qI-unsplash.webp',
        type: 'trip',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'ella-brooks', 'neha-mehra', 'vikram-kapoor'],
        createdAt: '2025-04-08'
      },
      {
        id: 'manali-trek',
        name: 'Manali Trek',
        emoji: '🏔️',
        photo: '/assets/groups/felix-rostig-UmV2wr-Vbq8-unsplash.webp',
        type: 'trip',
        memberIds: ['divyansh-rastogi', 'arjun-kumar', 'beau-geste', 'liam-anderson', 'manish-kumar'],
        createdAt: '2025-06-20'
      },
      {
        id: 'birthday-bash',
        name: "Priya's Birthday Bash",
        emoji: '🎂',
        photo: '/assets/groups/jacob-bentzinger-_HXFz-0g9w8-unsplash.webp',
        type: 'celebration',
        memberIds: ['divyansh-rastogi', 'rahul-arora', 'priya-sharma', 'arjun-kumar', 'zoe-martin', 'neha-mehra'],
        createdAt: '2026-01-22'
      },
      {
        id: 'beach-bonfire',
        name: 'Beach Bonfire',
        emoji: '🔥',
        photo: '/assets/groups/kimson-doan-AZMmUy2qL6A-unsplash.webp',
        type: 'event',
        memberIds: ['divyansh-rastogi', 'arjun-kumar', 'beau-geste', 'johnnie-walker'],
        createdAt: '2025-12-30'
      },
      {
        id: 'sunburn-festival',
        name: 'Sunburn Festival',
        emoji: '🎵',
        photo: '/assets/groups/vishnu-r-nair-m1WZS5ye404-unsplash.webp',
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

  // ── Private Helpers ───────────────────────────────────────

  function _persist() {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }

  function _init() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      data = JSON.parse(JSON.stringify(SEED_DATA));
      data._version = SEED_VERSION;
      _persist();
    } else {
      try {
        data = JSON.parse(raw);
        // version bump → reset to fresh seed
        if (data._version !== SEED_VERSION) {
          data = JSON.parse(JSON.stringify(SEED_DATA));
          data._version = SEED_VERSION;
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
      } catch (e) {
        data = JSON.parse(JSON.stringify(SEED_DATA));
        data._version = SEED_VERSION;
        _persist();
      }
    }
  }

  function _round2(n) {
    return Math.round(n * 100) / 100;
  }

  /** Compute net balance for current user from a single expense */
  function _computeUserNet(expense) {
    const inSplit = expense.splitAmong.includes(CURRENT_USER_ID);
    const share = _round2(expense.totalAmount / expense.splitAmong.length);

    if (expense.paidById === CURRENT_USER_ID) {
      const lent = _round2(expense.totalAmount - share);
      return { amount: lent, direction: lent > 0 ? 'lent' : 'settled' };
    } else if (inSplit) {
      return { amount: share, direction: 'owe' };
    }
    return { amount: 0, direction: 'settled' };
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
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function getExpensesForContact(contactId) {
    return data.expenses
      .filter(e =>
        e.splitAmong.includes(CURRENT_USER_ID) &&
        e.splitAmong.includes(contactId)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function getCommonGroups(contactId) {
    return data.groups.filter(g =>
      g.memberIds.includes(CURRENT_USER_ID) &&
      g.memberIds.includes(contactId)
    );
  }

  function addExpense(expense) {
    const id = 'exp-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    data.expenses.push(Object.assign({}, expense, { id }));
    _persist();
    return id;
  }

  function deleteExpense(id) {
    data.expenses = data.expenses.filter(function(e) { return e.id !== id; });
    _persist();
  }

  function addGroup(group) {
    const slug = group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = slug + '-' + Date.now();
    const newGroup = Object.assign({}, group, { id: id, createdAt: new Date().toISOString().slice(0, 10) });
    data.groups.push(newGroup);
    _persist();
    return id;
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
        const share = _round2(e.totalAmount / e.splitAmong.length);
        if (e.paidById === CURRENT_USER_ID) net += share;
        else if (e.paidById === contactId) net -= share;
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
    var id = 'comment-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    var comment = {
      id: id,
      expenseId: expenseId,
      authorId: CURRENT_USER_ID,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    data.comments.push(comment);
    _persist();
    return id;
  }

  function recordSettlement(settlement) {
    const id = 'sett-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    data.settlements.push(Object.assign({}, settlement, { id }));
    _persist();
    return id;
  }

  function getSettlements(contactId) {
    return data.settlements
      .filter(s =>
        (s.fromId === CURRENT_USER_ID && s.toId === contactId) ||
        (s.fromId === contactId && s.toId === CURRENT_USER_ID)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
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
          const share = _round2(e.totalAmount / e.splitAmong.length);
          if (e.paidById === CURRENT_USER_ID) net += share;
          else if (e.paidById === mid) net -= share;
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
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    const items = (limit ? all.slice(0, limit) : all).map(e => {
      const net = _computeUserNet(e);
      let contextLabel = '';
      if (e.groupId) {
        const g = _getGroupById(e.groupId);
        contextLabel = g ? g.name : e.groupId;
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

  /** Format a number as Indian rupee string: ₹1,450 or ₹1,222.50 */
  function formatINR(amount) {
    const rounded = _round2(amount);
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(rounded);
    return '₹' + formatted;
  }

  // ── Boot ─────────────────────────────────────────────────

  _init();

  // ── Expose ────────────────────────────────────────────────

  return {
    getCurrentUser,
    getContacts,
    getContact,
    getGroups,
    getGroup,
    getExpenses,
    getExpensesForContact,
    getCommonGroups,
    addExpense,
    deleteExpense,
    addGroup,
    hasContactTransactions,
    getLastTransactionDate,
    getNetBalance,
    getGroupBalance,
    getContactBalance,
    getMemberBalancesForGroup,
    getActivityFeed,
    groupExpensesByDate,
    formatINR,
    recordSettlement,
    getSettlements,
    getComments,
    addComment,
    // expose for debugging
    _computeUserNet
  };
})();
