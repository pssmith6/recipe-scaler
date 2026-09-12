import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertUnit, unitCategory } from '../src/units';

test('unitCategory classifies each unit', () => {
  assert.equal(unitCategory('cup'), 'volume');
  assert.equal(unitCategory('ml'), 'volume');
  assert.equal(unitCategory('g'), 'weight');
  assert.equal(unitCategory('lb'), 'weight');
  assert.equal(unitCategory('unit'), 'count');
});

test('convertUnit converts within volume', () => {
  const result = convertUnit({ amount: 1, unit: 'cup' }, 'ml');
  assert.ok(Math.abs(result.amount - 236.588) < 1e-6);
  assert.equal(result.unit, 'ml');
});

test('convertUnit converts within weight', () => {
  const result = convertUnit({ amount: 1, unit: 'lb' }, 'g');
  assert.ok(Math.abs(result.amount - 453.592) < 1e-6);
});

test('convertUnit round-trips through a base unit without drift', () => {
  const original = { amount: 3.5, unit: 'tbsp' } as const;
  const roundTripped = convertUnit(convertUnit(original, 'ml'), 'tbsp');
  assert.ok(Math.abs(roundTripped.amount - original.amount) < 1e-9);
});

test('convertUnit converting to the same unit is a no-op', () => {
  const result = convertUnit({ amount: 2, unit: 'cup' }, 'cup');
  assert.equal(result.amount, 2);
});

test('convertUnit throws crossing volume to weight', () => {
  assert.throws(() => convertUnit({ amount: 1, unit: 'cup' }, 'g'));
});

test('convertUnit throws crossing weight to volume', () => {
  assert.throws(() => convertUnit({ amount: 1, unit: 'g' }, 'cup'));
});

test('convertUnit throws crossing count to volume', () => {
  assert.throws(() => convertUnit({ amount: 2, unit: 'unit' }, 'cup'));
});

test('convertUnit allows count converted to itself', () => {
  const result = convertUnit({ amount: 2, unit: 'unit' }, 'unit');
  assert.deepEqual(result, { amount: 2, unit: 'unit' });
});

test('convertUnit does not mutate the input quantity', () => {
  const input = { amount: 1, unit: 'cup' } as const;
  convertUnit(input, 'ml');
  assert.deepEqual(input, { amount: 1, unit: 'cup' });
});
