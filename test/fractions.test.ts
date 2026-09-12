import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundToNearestFraction, roundQuantityToCookingFraction, formatQuantity } from '../src/fractions';

test('roundToNearestFraction snaps to the closest available fraction', () => {
  assert.equal(roundToNearestFraction(2.2, [1, 2, 4]), 2.25);
  assert.equal(roundToNearestFraction(2.05, [1, 2, 4]), 2);
});

test('roundToNearestFraction returns the whole number when already exact', () => {
  assert.equal(roundToNearestFraction(3, [1, 2, 4, 8]), 3);
});

test('roundToNearestFraction throws with no denominators', () => {
  assert.throws(() => roundToNearestFraction(1.5, []));
});

test('roundQuantityToCookingFraction rounds cup amounts to eighths or thirds', () => {
  const result = roundQuantityToCookingFraction({ amount: 2.2, unit: 'cup' });
  assert.deepEqual(result, { amount: 2.25, unit: 'cup' });
});

test('roundQuantityToCookingFraction rounds gram amounts to whole numbers', () => {
  const result = roundQuantityToCookingFraction({ amount: 145.6, unit: 'g' });
  assert.deepEqual(result, { amount: 146, unit: 'g' });
});

test('roundQuantityToCookingFraction rounds liter amounts to two decimal places', () => {
  const result = roundQuantityToCookingFraction({ amount: 1.2345, unit: 'l' });
  assert.deepEqual(result, { amount: 1.23, unit: 'l' });
});

test('roundQuantityToCookingFraction leaves already-exact amounts unchanged', () => {
  const result = roundQuantityToCookingFraction({ amount: 0.5, unit: 'tsp' });
  assert.deepEqual(result, { amount: 0.5, unit: 'tsp' });
});

test('formatQuantity renders a mixed number', () => {
  assert.equal(formatQuantity({ amount: 2.2, unit: 'cup' }), '2 1/4 cup');
});

test('formatQuantity renders a bare fraction with no whole part', () => {
  assert.equal(formatQuantity({ amount: 0.75, unit: 'tsp' }), '3/4 tsp');
});

test('formatQuantity renders a whole number with no remainder', () => {
  assert.equal(formatQuantity({ amount: 3, unit: 'lb' }), '3 lb');
});

test('formatQuantity renders scale-and-container units as decimals', () => {
  assert.equal(formatQuantity({ amount: 145.6, unit: 'g' }), '146 g');
  assert.equal(formatQuantity({ amount: 1.2345, unit: 'l' }), '1.23 l');
});
