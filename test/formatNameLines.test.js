import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNameLines } from '../src/formatName.js';

test('splits Bartholomew Whitfield into two center-aligned lines', () => {
  const lines = formatNameLines('Bartholomew Whitfield');
  assert.deepEqual(lines, ['Bartholomew', 'Whitfield']);
});

test('splits long compound names into two balanced lines', () => {
  const lines = formatNameLines('Alejandro Montenegro-Ruiz');
  assert.deepEqual(lines, ['Alejandro', 'Montenegro-Ruiz']);
});

test('keeps short names on a single line', () => {
  assert.deepEqual(formatNameLines('Ava Smith'), ['Ava Smith']);
  assert.deepEqual(formatNameLines('Ben Okafor'), ['Ben Okafor']);
  assert.deepEqual(formatNameLines('Dmitri Petrov'), ['Dmitri Petrov']);
  assert.deepEqual(formatNameLines('Mateo Alvarez'), ['Mateo Alvarez']);
});

test('handles single-word names and empty strings safely', () => {
  assert.deepEqual(formatNameLines('Cher'), ['Cher']);
  assert.deepEqual(formatNameLines(''), ['']);
  assert.deepEqual(formatNameLines(null), ['']);
});
