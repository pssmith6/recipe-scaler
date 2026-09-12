import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIngredientLine } from '../src/parse';

test('parses a mixed number with a plural unit', () => {
  const result = parseIngredientLine('2 1/4 cups flour');
  assert.deepEqual(result, { name: 'flour', quantity: { amount: 2.25, unit: 'cup' } });
});

test('parses a plain fraction', () => {
  const result = parseIngredientLine('1/2 tsp salt');
  assert.deepEqual(result, { name: 'salt', quantity: { amount: 0.5, unit: 'tsp' } });
});

test('parses a decimal amount', () => {
  const result = parseIngredientLine('1.5 lb potatoes');
  assert.deepEqual(result, { name: 'potatoes', quantity: { amount: 1.5, unit: 'lb' } });
});

test('parses a whole number plus a unicode fraction glyph', () => {
  const result = parseIngredientLine('2¼ cups sugar');
  assert.deepEqual(result, { name: 'sugar', quantity: { amount: 2.25, unit: 'cup' } });
});

test('parses a bare unicode fraction glyph', () => {
  const result = parseIngredientLine('¾ cup milk');
  assert.deepEqual(result, { name: 'milk', quantity: { amount: 0.75, unit: 'cup' } });
});

test('parses a whole number with no unit as a count', () => {
  const result = parseIngredientLine('2 eggs');
  assert.deepEqual(result, { name: 'eggs', quantity: { amount: 2, unit: 'unit' } });
});

test('treats an unrecognized leading word as part of the name, not a unit', () => {
  const result = parseIngredientLine('3 ripe bananas');
  assert.deepEqual(result, { name: 'ripe bananas', quantity: { amount: 3, unit: 'unit' } });
});

test('parses the two-word unit "fl oz"', () => {
  const result = parseIngredientLine('8 fl oz heavy cream');
  assert.deepEqual(result, { name: 'heavy cream', quantity: { amount: 8, unit: 'flOz' } });
});

test('matches unit abbreviations and full words the same way', () => {
  assert.deepEqual(parseIngredientLine('1 tbsp butter').quantity.unit, 'tbsp');
  assert.deepEqual(parseIngredientLine('1 tablespoon butter').quantity.unit, 'tbsp');
  assert.deepEqual(parseIngredientLine('1 tablespoons butter').quantity.unit, 'tbsp');
});

test('unit matching is case-insensitive', () => {
  const result = parseIngredientLine('2 CUPS flour');
  assert.equal(result.quantity.unit, 'cup');
});

test('keeps trailing notes as part of the name', () => {
  const result = parseIngredientLine('2 cups flour, sifted');
  assert.equal(result.name, 'flour, sifted');
});

test('handles extra whitespace between amount and unit', () => {
  const result = parseIngredientLine('  2   cups   flour  ');
  assert.deepEqual(result, { name: 'flour', quantity: { amount: 2, unit: 'cup' } });
});

test('throws on an empty line', () => {
  assert.throws(() => parseIngredientLine(''), /must not be empty/);
});

test('throws on a line with no quantity', () => {
  assert.throws(() => parseIngredientLine('flour'), /could not find a quantity/);
});

test('throws on a quantity with no name', () => {
  assert.throws(() => parseIngredientLine('2 cups'), /could not find an ingredient name/);
});
