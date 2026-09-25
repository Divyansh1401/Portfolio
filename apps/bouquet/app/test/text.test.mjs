import { test } from 'node:test';
import assert from 'node:assert/strict';
import { graphemes, normalise } from '../server/text.js';

test('graphemes: flag emoji counts as one grapheme', () => {
  assert.equal(graphemes('🇮🇳'), 1);
});

test('graphemes: ZWJ family emoji counts as one grapheme', () => {
  assert.equal(graphemes('👨‍👩‍👧‍👦'), 1);
});

test('graphemes: Devanagari conjunct counts as one grapheme', () => {
  // क् + ष -> क्ष is a single rendered cluster with virama + ZWJ-less conjunct
  const conjunct = 'क्ष'; // क् + ष
  assert.equal(graphemes(conjunct), 1);
});

test('graphemes: plain ascii counts one per char', () => {
  assert.equal(graphemes('hello'), 5);
});

test('graphemes: empty/undefined is 0', () => {
  assert.equal(graphemes(''), 0);
});

test('normalise: CRLF becomes LF', () => {
  assert.equal(normalise('a\r\nb'), 'a\nb');
});

test('normalise: lone CR becomes LF', () => {
  assert.equal(normalise('a\rb'), 'a\nb');
});

test('normalise: strips control chars but keeps newline', () => {
  assert.equal(normalise('a\x00\x07b\nc'), 'ab\nc');
});

test('normalise: strips format chars but keeps ZWJ', () => {
  const withZwnj = 'a‌b'; // ZWNJ, a format char, should be stripped
  assert.equal(normalise(withZwnj), 'ab');
  const withZwj = 'a‍b'; // ZWJ, must be preserved
  assert.equal(normalise(withZwj), 'a‍b');
});

test('normalise: collapses 3+ newlines to 2', () => {
  assert.equal(normalise('a\n\n\n\nb'), 'a\n\nb');
});

test('normalise: caps total line breaks at 6', () => {
  const many = Array.from({ length: 10 }, (_, i) => `l${i}`).join('\n');
  const out = normalise(many);
  const breaks = out.split('\n').length - 1;
  assert.equal(breaks, 6);
  assert.equal(out, 'l0\nl1\nl2\nl3\nl4\nl5\nl6');
});

test('normalise: trims leading/trailing whitespace', () => {
  assert.equal(normalise('  hi  '), 'hi');
});

test('normalise: non-string input returns empty string', () => {
  assert.equal(normalise(undefined), '');
  assert.equal(normalise(null), '');
});
