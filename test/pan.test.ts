import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panArea, panScaleFactor, scaleRecipeForPan, Pan } from '../src/pan';
import { Recipe } from '../src/scale';

test('panArea computes a round pan by radius', () => {
  const area = panArea({ shape: 'round', diameter: 9 });
  assert.ok(Math.abs(area - Math.PI * 4.5 ** 2) < 1e-9);
});

test('panArea computes a square pan', () => {
  assert.equal(panArea({ shape: 'square', side: 8 }), 64);
});

test('panArea computes a rectangular pan', () => {
  assert.equal(panArea({ shape: 'rectangular', length: 13, width: 9 }), 117);
});

test('panArea throws on a non-positive round diameter', () => {
  assert.throws(() => panArea({ shape: 'round', diameter: 0 }));
});

test('panArea throws on a non-positive square side', () => {
  assert.throws(() => panArea({ shape: 'square', side: -1 }));
});

test('panArea throws on a non-positive rectangular dimension', () => {
  assert.throws(() => panArea({ shape: 'rectangular', length: 9, width: 0 }));
});

test('panScaleFactor is the ratio of destination area to source area', () => {
  const round: Pan = { shape: 'round', diameter: 9 };
  const sheet: Pan = { shape: 'rectangular', length: 13, width: 9 };
  const factor = panScaleFactor(round, sheet);
  assert.ok(Math.abs(factor - 117 / (Math.PI * 4.5 ** 2)) < 1e-9);
});

test('panScaleFactor is 1 for identical pans', () => {
  const pan: Pan = { shape: 'square', side: 8 };
  assert.equal(panScaleFactor(pan, pan), 1);
});

const cookies: Recipe = {
  name: 'Cookie bars',
  servings: 12,
  ingredients: [{ name: 'flour', quantity: { amount: 2, unit: 'cup' } }],
};

test('scaleRecipeForPan scales by the area ratio', () => {
  const fromPan: Pan = { shape: 'square', side: 8 };
  const toPan: Pan = { shape: 'square', side: 16 };
  const result = scaleRecipeForPan(cookies, fromPan, toPan);
  assert.equal(result.ingredients[0].quantity.amount, 8);
  assert.equal(result.servings, 48);
});
