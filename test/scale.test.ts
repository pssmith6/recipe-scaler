import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nonlinearScaleFactor,
  scaleQuantity,
  scaleIngredient,
  scaleRecipe,
  scaleRecipeToServings,
  convertIngredientUnit,
  Recipe,
} from '../src/scale';

test('nonlinearScaleFactor passes linear ingredients through unchanged', () => {
  assert.equal(nonlinearScaleFactor(4, 'linear'), 4);
});

test('nonlinearScaleFactor dampens spice scaling toward 1x', () => {
  assert.ok(Math.abs(nonlinearScaleFactor(4, 'spice') - 3.25) < 1e-9);
});

test('nonlinearScaleFactor dampens leavening scaling more than spice', () => {
  const spice = nonlinearScaleFactor(4, 'spice');
  const leavening = nonlinearScaleFactor(4, 'leavening');
  assert.ok(leavening < spice);
});

test('nonlinearScaleFactor keeps more than half the amount on a half batch', () => {
  const half = nonlinearScaleFactor(0.5, 'spice');
  assert.ok(half > 0.5 && half < 1);
});

test('nonlinearScaleFactor throws on a non-positive factor', () => {
  assert.throws(() => nonlinearScaleFactor(0, 'linear'));
  assert.throws(() => nonlinearScaleFactor(-1, 'spice'));
});

test('scaleQuantity multiplies the amount and keeps the unit', () => {
  assert.deepEqual(scaleQuantity({ amount: 2, unit: 'cup' }, 1.5), { amount: 3, unit: 'cup' });
});

test('scaleQuantity throws on a non-positive factor', () => {
  assert.throws(() => scaleQuantity({ amount: 1, unit: 'g' }, 0));
});

test('scaleIngredient applies the dampened factor for a spice', () => {
  const result = scaleIngredient({ name: 'ginger', quantity: { amount: 1, unit: 'tbsp' }, category: 'spice' }, 4);
  assert.ok(Math.abs(result.quantity.amount - 3.25) < 1e-9);
});

test('scaleIngredient defaults to linear when category is unset', () => {
  const result = scaleIngredient({ name: 'flour', quantity: { amount: 2, unit: 'cup' } }, 3);
  assert.deepEqual(result.quantity, { amount: 6, unit: 'cup' });
});

const cookies: Recipe = {
  name: 'Chocolate chip cookies',
  servings: 12,
  ingredients: [
    { name: 'flour', quantity: { amount: 2, unit: 'cup' } },
    { name: 'baking soda', quantity: { amount: 1, unit: 'tsp' }, category: 'leavening' },
  ],
};

test('scaleRecipe scales servings and every ingredient', () => {
  const result = scaleRecipe(cookies, 2);
  assert.equal(result.servings, 24);
  assert.equal(result.ingredients[0].quantity.amount, 4);
});

test('scaleRecipe does not mutate the input recipe', () => {
  scaleRecipe(cookies, 2);
  assert.equal(cookies.servings, 12);
  assert.equal(cookies.ingredients[0].quantity.amount, 2);
});

test('scaleRecipe throws on a non-positive factor', () => {
  assert.throws(() => scaleRecipe(cookies, 0));
});

test('scaleRecipeToServings derives the factor from current servings', () => {
  const result = scaleRecipeToServings(cookies, 30);
  assert.equal(result.servings, 30);
  assert.equal(result.ingredients[0].quantity.amount, 5);
});

test('scaleRecipeToServings throws when the recipe has no positive servings', () => {
  assert.throws(() => scaleRecipeToServings({ ...cookies, servings: 0 }, 10));
});

test('scaleRecipeToServings throws on a non-positive target', () => {
  assert.throws(() => scaleRecipeToServings(cookies, -4));
});

test('convertIngredientUnit converts within the same category without needing a density', () => {
  const result = convertIngredientUnit({ name: 'unobtainium', quantity: { amount: 2, unit: 'cup' } }, 'ml');
  assert.ok(Math.abs(result.quantity.amount - 2 * 236.588) < 1e-6);
  assert.equal(result.name, 'unobtainium');
});

test('convertIngredientUnit resolves density from the ingredient name', () => {
  const result = convertIngredientUnit({ name: 'flour', quantity: { amount: 1, unit: 'cup' } }, 'g');
  assert.ok(Math.abs(result.quantity.amount - 236.588 * 0.53) < 1e-6);
});

test('convertIngredientUnit is case-insensitive to the ingredient name', () => {
  const result = convertIngredientUnit({ name: 'Honey', quantity: { amount: 1, unit: 'cup' } }, 'g');
  assert.ok(Math.abs(result.quantity.amount - 236.588 * 1.42) < 1e-6);
});

test('convertIngredientUnit uses an explicit density over the name lookup', () => {
  const result = convertIngredientUnit({ name: 'flour', quantity: { amount: 1, unit: 'cup' } }, 'g', 0.6);
  assert.ok(Math.abs(result.quantity.amount - 236.588 * 0.6) < 1e-6);
});

test('convertIngredientUnit throws for an unknown ingredient crossing categories with no override', () => {
  assert.throws(() => convertIngredientUnit({ name: 'unobtainium', quantity: { amount: 1, unit: 'cup' } }, 'g'));
});

test('convertIngredientUnit does not mutate the input ingredient', () => {
  const input = { name: 'flour', quantity: { amount: 1, unit: 'cup' } };
  convertIngredientUnit(input, 'g');
  assert.deepEqual(input.quantity, { amount: 1, unit: 'cup' });
});
