import { Ingredient } from './scale';
import { Unit } from './units';

// Fraction glyphs that show up in recipes copied from sites and cookbooks
// that render "1/4" as a single character instead of three.
const UNICODE_FRACTIONS: Record<string, number> = {
  '¼': 1 / 4,
  '½': 1 / 2,
  '¾': 3 / 4,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅕': 1 / 5,
  '⅖': 2 / 5,
  '⅗': 3 / 5,
  '⅘': 4 / 5,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
};

const UNICODE_FRACTION_CHARS = Object.keys(UNICODE_FRACTIONS).join('');

// Alternatives are ordered most-specific first, since regex alternation
// takes the first branch that matches at the current position rather than
// the longest one - a mixed number like "2 1/4" would otherwise be cut
// short at the plain whole-number branch.
const AMOUNT_REGEX = new RegExp(
  '^(?:' +
    '(\\d+)\\s+(\\d+)\\/(\\d+)' + // mixed number: "2 1/4"
    '|(\\d+)\\/(\\d+)' + // plain fraction: "1/4"
    '|(\\d+\\.\\d+)' + // decimal: "1.5"
    `|(\\d+)\\s*([${UNICODE_FRACTION_CHARS}])` + // whole + glyph: "2¼"
    '|(\\d+)' + // whole number: "2"
    `|([${UNICODE_FRACTION_CHARS}])` + // bare glyph: "¼"
    ')',
);

// Matches a quantity at the start of `text` and returns its value along
// with how many characters it consumed, or null if none is found.
function parseLeadingAmount(text: string): { amount: number; length: number } | null {
  const match = text.match(AMOUNT_REGEX);
  if (!match) {
    return null;
  }
  const [full, mixedWhole, mixedNum, mixedDen, fracNum, fracDen, decimal, unicodeWhole, unicodeFrac, whole, unicodeOnly] = match;

  if (mixedWhole !== undefined) {
    return { amount: Number(mixedWhole) + Number(mixedNum) / Number(mixedDen), length: full.length };
  }
  if (fracNum !== undefined) {
    return { amount: Number(fracNum) / Number(fracDen), length: full.length };
  }
  if (decimal !== undefined) {
    return { amount: Number(decimal), length: full.length };
  }
  if (unicodeWhole !== undefined) {
    return { amount: Number(unicodeWhole) + UNICODE_FRACTIONS[unicodeFrac], length: full.length };
  }
  if (whole !== undefined) {
    return { amount: Number(whole), length: full.length };
  }
  if (unicodeOnly !== undefined) {
    return { amount: UNICODE_FRACTIONS[unicodeOnly], length: full.length };
  }
  return null;
}

// Recognized unit words, keyed by the word (or two words squashed together,
// for "fl oz") lowercased with punctuation stripped.
const UNIT_ALIASES: Record<string, Unit> = {
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cup: 'cup',
  cups: 'cup',
  floz: 'flOz',
  fluidounce: 'flOz',
  fluidounces: 'flOz',
  pint: 'pint',
  pints: 'pint',
  quart: 'quart',
  quarts: 'quart',
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
};

// Looks for a unit word (or two-word unit like "fl oz") at the start of
// `text` and, if found, returns it along with whatever's left as the
// ingredient name. Returns null if the leading word isn't a known unit.
function extractUnit(text: string): { unit: Unit; name: string } | null {
  const words = text.split(/\s+/).filter((word) => word.length > 0);

  for (const wordCount of [2, 1]) {
    if (words.length < wordCount) continue;
    const candidate = words
      .slice(0, wordCount)
      .join('')
      .toLowerCase()
      .replace(/[.,]/g, '');
    const unit = UNIT_ALIASES[candidate];
    if (unit) {
      return { unit, name: words.slice(wordCount).join(' ') };
    }
  }

  return null;
}

// Parses a plain-text ingredient line ("2 1/4 cups flour", "1 tsp baking
// soda", "2 eggs") into an Ingredient. If no unit word is recognized, the
// quantity is treated as a count ("2 eggs" -> amount 2, unit 'unit').
// Notes ("2 cups flour, sifted") land in `name` as-is; splitting those out
// isn't handled here.
export function parseIngredientLine(line: string): Ingredient {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    throw new Error('ingredient line must not be empty');
  }

  const leading = parseLeadingAmount(trimmed);
  if (!leading) {
    throw new Error(`could not find a quantity in "${line}"`);
  }

  const rest = trimmed.slice(leading.length).trim();
  if (rest.length === 0) {
    throw new Error(`could not find an ingredient name in "${line}"`);
  }

  const unitMatch = extractUnit(rest);
  if (unitMatch && unitMatch.name.length > 0) {
    return { name: unitMatch.name, quantity: { amount: leading.amount, unit: unitMatch.unit } };
  }

  return { name: rest, quantity: { amount: leading.amount, unit: 'unit' } };
}
