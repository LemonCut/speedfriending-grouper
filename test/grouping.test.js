import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGroups } from '../server/grouping.js';

const makeBits = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: String(i), firstName: `F${i}`, lastName: `L${i}` }));

test('creates exactly groupCount groups numbered 1..N', () => {
  const { groups } = createGroups(makeBits(10), 4);
  assert.deepEqual(groups.map((g) => g.number), [1, 2, 3, 4]);
});

test('every bit is assigned exactly once', () => {
  const bits = makeBits(23);
  const { groups } = createGroups(bits, 5);
  const ids = groups.flatMap((g) => g.members.map((m) => m.id)).sort();
  assert.deepEqual(ids, bits.map((b) => b.id).sort());
});

test('group sizes differ by at most one and maxSize is ceil(M/N)', () => {
  const { groups, maxSize } = createGroups(makeBits(23), 5);
  const sizes = groups.map((g) => g.size);
  assert.equal(maxSize, 5);
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
  assert.equal(sizes.reduce((a, b) => a + b, 0), 23);
});

test('flags groups below the max size', () => {
  const { groups } = createGroups(makeBits(10), 4); // sizes 3,3,2,2
  assert.deepEqual(groups.map((g) => g.belowMax), [false, false, true, true]);
});

test('no group is flagged when split is even', () => {
  const { groups } = createGroups(makeBits(12), 4);
  assert.ok(groups.every((g) => !g.belowMax));
});

test('supports more groups than bits (some empty)', () => {
  const { groups, maxSize } = createGroups(makeBits(2), 4);
  assert.equal(maxSize, 1);
  assert.deepEqual(groups.map((g) => g.size), [1, 1, 0, 0]);
});

test('shuffles using the provided rng (not input order)', () => {
  const bits = makeBits(8);
  let seed = 42;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const { groups } = createGroups(bits, 1, rng);
  assert.notDeepEqual(groups[0].members.map((m) => m.id), bits.map((b) => b.id));
});

test('throws when there are no bytes', () => {
  assert.throws(() => createGroups(makeBits(3), 0), /at least one Byte/i);
});
