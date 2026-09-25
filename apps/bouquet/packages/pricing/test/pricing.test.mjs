import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  FREE_FLOWER,
  PAID_FLOWERS,
  DEFAULT_FREE_LIMIT,
  AMOUNTS,
  CURRENCY_SYMBOL,
  needsPayment,
  isValidAmount,
  guessCurrency,
  formatAmount,
} from '../pricing.js';

describe('constants', () => {
  test('FREE_FLOWER is rose', () => {
    assert.equal(FREE_FLOWER, 'rose');
  });

  test('PAID_FLOWERS is the other four modes', () => {
    assert.deepEqual(PAID_FLOWERS, ['sunflower', 'lavender', 'marigold', 'hydrangea']);
  });

  test('DEFAULT_FREE_LIMIT is 100', () => {
    assert.equal(DEFAULT_FREE_LIMIT, 100);
  });

  test('AMOUNTS ladders', () => {
    assert.deepEqual(AMOUNTS.INR, [30, 50, 100, 150]);
    assert.deepEqual(AMOUNTS.USD, [2, 5, 10, 15]);
  });

  test('CURRENCY_SYMBOL', () => {
    assert.equal(CURRENCY_SYMBOL.INR, '₹');
    assert.equal(CURRENCY_SYMBOL.USD, '$');
  });
});

describe('needsPayment matrix', () => {
  test('rose under the free limit is free', () => {
    assert.equal(needsPayment({ mode: 'rose', liveCount: 0, freeLimit: 100 }), false);
    assert.equal(needsPayment({ mode: 'rose', liveCount: 99, freeLimit: 100 }), false);
  });

  test('rose AT the free limit needs payment', () => {
    assert.equal(needsPayment({ mode: 'rose', liveCount: 100, freeLimit: 100 }), true);
  });

  test('rose OVER the free limit needs payment', () => {
    assert.equal(needsPayment({ mode: 'rose', liveCount: 250, freeLimit: 100 }), true);
  });

  test('every paid flower always needs payment, regardless of liveCount', () => {
    for (const mode of PAID_FLOWERS) {
      assert.equal(needsPayment({ mode, liveCount: 0, freeLimit: 100 }), true);
      assert.equal(needsPayment({ mode, liveCount: 99999, freeLimit: 100 }), true);
    }
  });

  test('freeLimit of 0 makes rose paid immediately', () => {
    assert.equal(needsPayment({ mode: 'rose', liveCount: 0, freeLimit: 0 }), true);
  });

  test('freeLimit defaults to DEFAULT_FREE_LIMIT when omitted', () => {
    assert.equal(needsPayment({ mode: 'rose', liveCount: 0 }), false);
    assert.equal(needsPayment({ mode: 'rose', liveCount: 100 }), true);
  });
});

describe('isValidAmount', () => {
  test('accepts amounts on the ladder', () => {
    for (const amount of AMOUNTS.INR) assert.equal(isValidAmount('INR', amount), true);
    for (const amount of AMOUNTS.USD) assert.equal(isValidAmount('USD', amount), true);
  });

  test('rejects amounts off the ladder', () => {
    assert.equal(isValidAmount('INR', 40), false);
    assert.equal(isValidAmount('USD', 3), false);
    assert.equal(isValidAmount('INR', -30), false);
  });

  test('rejects unknown currencies', () => {
    assert.equal(isValidAmount('EUR', 30), false);
    assert.equal(isValidAmount('', 30), false);
    assert.equal(isValidAmount(undefined, 30), false);
  });
});

describe('guessCurrency', () => {
  test('Asia/Kolkata timezone -> INR', () => {
    assert.equal(guessCurrency({ timeZone: 'Asia/Kolkata', languages: ['en-US'] }), 'INR');
  });

  test('Asia/Calcutta legacy alias -> INR', () => {
    assert.equal(guessCurrency({ timeZone: 'Asia/Calcutta' }), 'INR');
  });

  test('en-IN language -> INR even with another timezone', () => {
    assert.equal(guessCurrency({ timeZone: 'America/New_York', languages: ['en-IN'] }), 'INR');
  });

  test('America/New_York with en-US -> USD', () => {
    assert.equal(guessCurrency({ timeZone: 'America/New_York', languages: ['en-US'] }), 'USD');
  });

  test('no hints at all -> USD', () => {
    assert.equal(guessCurrency(), 'USD');
    assert.equal(guessCurrency({}), 'USD');
  });

  test('hi-IN also matches the -IN suffix check', () => {
    assert.equal(guessCurrency({ timeZone: 'America/New_York', languages: ['hi-IN'] }), 'INR');
  });
});

describe('formatAmount', () => {
  test('INR uses the rupee symbol with no space', () => {
    assert.equal(formatAmount('INR', 30), '₹30');
  });

  test('USD uses the dollar sign with no space', () => {
    assert.equal(formatAmount('USD', 2), '$2');
  });
});
