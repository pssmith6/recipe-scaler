import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertUnit, convertUnitByDensity, lookupIngredientDensity, unitCategory } from '../src/units';

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

test('lookupIngredientDensity finds known ingredients case-insensitively', () => {
  assert.equal(lookupIngredientDensity('Flour'), 0.53);
  assert.equal(lookupIngredientDensity('  water '), 1);
  assert.equal(lookupIngredientDensity('BUTTER'), 0.96);
});

test('lookupIngredientDensity returns undefined for unknown ingredients', () => {
  assert.equal(lookupIngredientDensity('unobtainium'), undefined);
});

test('convertUnitByDensity converts a cup of water to grams at density 1', () => {
  const result = convertUnitByDensity({ amount: 1, unit: 'cup' }, 'g', 1);
  assert.ok(Math.abs(result.amount - 236.588) < 1e-6);
  assert.equal(result.unit, 'g');
});

test('convertUnitByDensity converts flour by weight using its known density', () => {
  const density = lookupIngredientDensity('flour')!;
  const result = convertUnitByDensity({ amount: 1, unit: 'cup' }, 'g', density);
  assert.ok(Math.abs(result.amount - 236.588 * 0.53) < 1e-6);
});

test('convertUnitByDensity converts weight back to volume', () => {
  const density = lookupIngredientDensity('honey')!;
  const grams = convertUnitByDensity({ amount: 1, unit: 'cup' }, 'g', density);
  const backToCups = convertUnitByDensity(grams, 'cup', density);
  assert.ok(Math.abs(backToCups.amount - 1) < 1e-9);
});

test('convertUnitByDensity delegates to convertUnit within the same category', () => {
  const result = convertUnitByDensity({ amount: 2, unit: 'cup' }, 'ml', 0.53);
  assert.ok(Math.abs(result.amount - 2 * 236.588) < 1e-6);
});

test('convertUnitByDensity throws for count units regardless of density', () => {
  assert.throws(() => convertUnitByDensity({ amount: 2, unit: 'unit' }, 'g', 1));
  assert.throws(() => convertUnitByDensity({ amount: 100, unit: 'g' }, 'unit', 1));
});

test('convertUnitByDensity rejects a non-positive density', () => {
  assert.throws(() => convertUnitByDensity({ amount: 1, unit: 'cup' }, 'g', 0));
  assert.throws(() => convertUnitByDensity({ amount: 1, unit: 'cup' }, 'g', -1));
});
