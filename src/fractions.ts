import { Quantity, Unit } from './units';

// Denominators a cook can actually hit with standard measuring cups and
// spoons. Cups also come in thirds (1/3, 2/3 cup), the others don't.
const FRACTION_DENOMINATORS: Partial<Record<Unit, number[]>> = {
  tsp: [1, 2, 4, 8],
  tbsp: [1, 2, 4, 8],
  cup: [1, 2, 3, 4, 8],
  flOz: [1, 2, 4],
  pint: [1, 2, 4],
  quart: [1, 2, 4],
  oz: [1, 2, 4],
  lb: [1, 2, 4],
  unit: [1, 2, 4],
};

// Units read off a scale or a graduated container rather than scooped in
// fractional increments - a decimal place is more useful here than a fraction.
const DECIMAL_PLACES: Partial<Record<Unit, number>> = {
  ml: 0,
  l: 2,
  g: 0,
  kg: 2,
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Finds the fraction, among the given denominators, closest to `remainder`
// (which must be in [0, 1)). Returns null if the whole number itself is the
// closest fit (remainder rounds to 0).
function nearestFraction(remainder: number, denominators: number[]): { numerator: number; denominator: number } | null {
  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestError = remainder;

  for (const denominator of denominators) {
    const numerator = Math.round(remainder * denominator);
    if (numerator === 0) continue;
    const error = Math.abs(remainder - numerator / denominator);
    if (error < bestError) {
      bestError = error;
      bestNumerator = numerator;
      bestDenominator = denominator;
    }
  }

  if (bestNumerator === 0) {
    return null;
  }

  const divisor = gcd(bestNumerator, bestDenominator);
  return { numerator: bestNumerator / divisor, denominator: bestDenominator / divisor };
}

// Rounds a plain amount to the nearest fraction available from the given
// denominators (e.g. [1, 2, 4] can hit whole numbers, halves, and quarters).
export function roundToNearestFraction(amount: number, denominators: number[]): number {
  if (denominators.length === 0) {
    throw new Error('denominators must not be empty');
  }
  const whole = Math.floor(amount);
  const remainder = amount - whole;
  const fraction = nearestFraction(remainder, denominators);
  if (fraction === null) {
    return whole;
  }
  return whole + fraction.numerator / fraction.denominator;
}

// Rounds a quantity's amount into something a cook could actually measure:
// a common fraction for scoop-and-spoon units (cups, spoons, oz/lb, whole
// eggs), a sensible decimal precision for units read off a scale or a
// graduated container (g, kg, ml, l).
export function roundQuantityToCookingFraction(quantity: Quantity): Quantity {
  const denominators = FRACTION_DENOMINATORS[quantity.unit];
  if (denominators) {
    return { amount: roundToNearestFraction(quantity.amount, denominators), unit: quantity.unit };
  }

  const places = DECIMAL_PLACES[quantity.unit];
  if (places !== undefined) {
    const factor = 10 ** places;
    return { amount: Math.round(quantity.amount * factor) / factor, unit: quantity.unit };
  }

  return { ...quantity };
}

// Renders a quantity the way a recipe card would print it, e.g. "1 1/2 cup"
// or "3/4 tsp", rather than the decimal a scaling calculation produces.
export function formatQuantity(quantity: Quantity): string {
  const denominators = FRACTION_DENOMINATORS[quantity.unit];
  if (!denominators) {
    const places = DECIMAL_PLACES[quantity.unit] ?? 2;
    const factor = 10 ** places;
    const amount = Math.round(quantity.amount * factor) / factor;
    return `${amount} ${quantity.unit}`;
  }

  const whole = Math.floor(quantity.amount);
  const remainder = quantity.amount - whole;
  const fraction = nearestFraction(remainder, denominators);

  if (fraction === null) {
    return `${whole} ${quantity.unit}`;
  }

  const fractionText = `${fraction.numerator}/${fraction.denominator}`;
  return whole > 0 ? `${whole} ${fractionText} ${quantity.unit}` : `${fractionText} ${quantity.unit}`;
}
