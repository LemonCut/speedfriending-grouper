import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../server/store.js';

let dir;
let store;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfg-'));
  store = new Store(dir);
});

test('creates bits.csv and bytes.csv with headers', () => {
  assert.equal(fs.readFileSync(path.join(dir, 'bits.csv'), 'utf8').trim(), 'id,firstName,lastName,timestamp');
  assert.equal(fs.readFileSync(path.join(dir, 'bytes.csv'), 'utf8').trim(), 'id,firstName,lastName,timestamp');
});

test('adds attendees to the right csv, handling commas and quotes', () => {
  store.add({ firstName: 'Ada', lastName: 'Love, "Jr"', role: 'bit' });
  store.add({ firstName: 'Bob', lastName: 'Byte', role: 'byte' });
  assert.equal(store.list('bit')[0].lastName, 'Love, "Jr"');
  assert.equal(store.list('byte')[0].firstName, 'Bob');
  assert.equal(store.list('bit').length, 1);
});

test('trims names and rejects blanks / bad roles', () => {
  const rec = store.add({ firstName: '  Ada ', lastName: ' L ', role: 'bit' });
  assert.equal(rec.firstName, 'Ada');
  assert.throws(() => store.add({ firstName: ' ', lastName: 'X', role: 'bit' }), /first and last name/i);
  assert.throws(() => store.add({ firstName: 'A', lastName: 'X', role: 'nibble' }), /Bit or Byte/i);
});

test('rejects duplicate names across both lists (case-insensitive)', () => {
  store.add({ firstName: 'Ada', lastName: 'Lovelace', role: 'bit' });
  assert.throws(() => store.add({ firstName: 'ada', lastName: 'LOVELACE', role: 'byte' }), (e) => e.code === 'DUPLICATE');
});

test('locking saves groups and blocks further intake', () => {
  assert.equal(store.isLocked(), false);
  store.saveGroups({ maxSize: 1, groups: [] });
  assert.equal(store.isLocked(), true);
  assert.deepEqual(store.getGroups().groups, []);
  assert.throws(() => store.add({ firstName: 'A', lastName: 'B', role: 'bit' }), (e) => e.code === 'LOCKED');
});

test('unlock clears groups but keeps registrations', () => {
  store.add({ firstName: 'A', lastName: 'B', role: 'bit' });
  store.saveGroups({ maxSize: 1, groups: [] });
  store.unlock();
  assert.equal(store.isLocked(), false);
  assert.equal(store.getGroups(), null);
  assert.equal(store.list('bit').length, 1);
});
