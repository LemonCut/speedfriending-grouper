import test from 'node:test';
import assert from 'node:assert/strict';
import { formatGroupTitle, chunkGroups, fontFor } from '../src/formatGroupTitle.js';

test('formatGroupTitle formats single group', () => {
  assert.equal(formatGroupTitle([1]), 'Group 1');
  assert.equal(formatGroupTitle([{ number: 5 }]), 'Group 5');
});

test('formatGroupTitle formats two groups with "and"', () => {
  assert.equal(formatGroupTitle([1, 2]), 'Groups 1 and 2');
  assert.equal(formatGroupTitle([{ number: 3 }, { number: 4 }]), 'Groups 3 and 4');
});

test('formatGroupTitle formats three or more groups with Oxford comma', () => {
  assert.equal(formatGroupTitle([1, 2, 3]), 'Groups 1, 2, and 3');
  assert.equal(formatGroupTitle([1, 2, 3, 4]), 'Groups 1, 2, 3, and 4');
  assert.equal(
    formatGroupTitle([{ number: 2 }, { number: 3 }, { number: 4 }]),
    'Groups 2, 3, and 4'
  );
});

test('formatGroupTitle handles empty or invalid inputs', () => {
  assert.equal(formatGroupTitle([]), '');
  assert.equal(formatGroupTitle(null), '');
});

test('chunkGroups splits groups into batches of specified size', () => {
  const groups = [{ number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }, { number: 5 }, { number: 6 }, { number: 7 }];
  
  const chunked1 = chunkGroups(groups, 1);
  assert.equal(chunked1.length, 7);
  assert.deepEqual(chunked1[0], [{ number: 1 }]);

  const chunked3 = chunkGroups(groups, 3);
  assert.equal(chunked3.length, 3);
  assert.deepEqual(chunked3[0].map(g => g.number), [1, 2, 3]);
  assert.deepEqual(chunked3[1].map(g => g.number), [4, 5, 6]);
  assert.deepEqual(chunked3[2].map(g => g.number), [7]);

  const chunked4 = chunkGroups(groups, 4);
  assert.equal(chunked4.length, 2);
  assert.deepEqual(chunked4[0].map(g => g.number), [1, 2, 3, 4]);
  assert.deepEqual(chunked4[1].map(g => g.number), [5, 6, 7]);
});

test('fontFor scales font based on member count and multiCount', () => {
  // Single card mode matches original baseline
  assert.equal(fontFor(4, 1), 'clamp(2.7rem, 7.2vh, 5.1rem)');
  assert.equal(fontFor(8, 1), 'clamp(2.1rem, 5.4vh, 3.9rem)');

  // Multi-card modes scale down progressively
  assert.equal(fontFor(4, 2), 'clamp(1.8rem, 4.2vh, 3.0rem)');
  assert.equal(fontFor(4, 3), 'clamp(1.35rem, 3.0vh, 2.1rem)');
  assert.equal(fontFor(4, 4), 'clamp(1.2rem, 2.5vh, 1.8rem)');
});

