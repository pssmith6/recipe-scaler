export type VolumeUnit = 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'flOz' | 'pint' | 'quart';
export type WeightUnit = 'g' | 'kg' | 'oz' | 'lb';
export type CountUnit = 'unit';

export type Unit = VolumeUnit | WeightUnit | CountUnit;

export type UnitCategory = 'volume' | 'weight' | 'count';

export interface Quantity {
  amount: number;
  unit: Unit;
}

// Conversion factors into a base unit per category (ml for volume, g for weight).
// Values come from standard US customary / metric cooking conversions.
const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  flOz: 29.5735,
  pint: 473.176,
  quart: 946.353,
};

const WEIGHT_TO_G: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME_UNITS = new Set<string>(Object.keys(VOLUME_TO_ML));
const WEIGHT_UNITS = new Set<string>(Object.keys(WEIGHT_TO_G));

export function unitCategory(unit: Unit): UnitCategory {
  if (VOLUME_UNITS.has(unit)) return 'volume';
  if (WEIGHT_UNITS.has(unit)) return 'weight';
  return 'count';
}

// Converts a quantity to a different unit within the same category.
// Count units (e.g. "2 eggs") only convert to themselves, since "unit"
// carries no fixed physical size to convert against.
export function convertUnit(quantity: Quantity, toUnit: Unit): Quantity {
  const fromCategory = unitCategory(quantity.unit);
  const toCategory = unitCategory(toUnit);

  if (fromCategory !== toCategory) {
    throw new Error(`cannot convert ${quantity.unit} (${fromCategory}) to ${toUnit} (${toCategory})`);
  }

  if (fromCategory === 'count') {
    if (quantity.unit !== toUnit) {
      throw new Error(`cannot convert count unit ${quantity.unit} to ${toUnit}`);
    }
    return { ...quantity };
  }

  const table = fromCategory === 'volume' ? VOLUME_TO_ML : WEIGHT_TO_G;
  const base = quantity.amount * table[quantity.unit as keyof typeof table];
  const amount = base / table[toUnit as keyof typeof table];
  return { amount, unit: toUnit };
}

// Grams per milliliter for ingredients that come up often enough in recipes
// to be worth hardcoding. These are averages for the ingredient in its usual
// prepared state (e.g. all-purpose flour spooned rather than packed) -
// actual density varies with how an ingredient is measured, so treat
// conversions through this table as good estimates, not lab-precise.
const INGREDIENT_DENSITY_G_PER_ML: Record<string, number> = {
  water: 1,
  milk: 1.03,
  'heavy cream': 1.01,
  'all-purpose flour': 0.53,
  flour: 0.53,
  'bread flour': 0.54,
  'whole wheat flour': 0.55,
  'cake flour': 0.48,
  'granulated sugar': 0.85,
  sugar: 0.85,
  'brown sugar': 0.93,
  'powdered sugar': 0.56,
  butter: 0.96,
  honey: 1.42,
  'maple syrup': 1.32,
  'vegetable oil': 0.92,
  'olive oil': 0.92,
  oil: 0.92,
  salt: 1.2,
  'kosher salt': 0.96,
  'cocoa powder': 0.53,
  'rolled oats': 0.41,
  oats: 0.41,
  'baking soda': 1.15,
  'baking powder': 0.9,
};

// Looks up a density for a known ingredient name, case-insensitively and
// ignoring leading/trailing whitespace. Returns undefined for anything not
// in the table rather than guessing - an unlisted ingredient needs a density
// supplied by the caller.
export function lookupIngredientDensity(name: string): number | undefined {
  return INGREDIENT_DENSITY_G_PER_ML[name.trim().toLowerCase()];
}

// Converts a quantity across the volume/weight boundary using a known
// density (grams per milliliter), for cases where a fixed unit ratio isn't
// enough - a cup of flour and a cup of honey don't weigh the same. Density
// conversions still route through the same base units (ml, g) as
// convertUnit; for same-category conversions this just delegates to it.
export function convertUnitByDensity(quantity: Quantity, toUnit: Unit, densityGPerMl: number): Quantity {
  const fromCategory = unitCategory(quantity.unit);
  const toCategory = unitCategory(toUnit);

  if (fromCategory === toCategory) {
    return convertUnit(quantity, toUnit);
  }
  if (fromCategory === 'count' || toCategory === 'count') {
    throw new Error(`cannot convert count unit ${quantity.unit === 'unit' ? toUnit : quantity.unit} by density`);
  }
  if (densityGPerMl <= 0) {
    throw new Error('density must be positive');
  }

  const grams =
    fromCategory === 'weight'
      ? quantity.amount * WEIGHT_TO_G[quantity.unit as WeightUnit]
      : quantity.amount * VOLUME_TO_ML[quantity.unit as VolumeUnit] * densityGPerMl;

  if (toCategory === 'weight') {
    return { amount: grams / WEIGHT_TO_G[toUnit as WeightUnit], unit: toUnit };
  }
  const ml = grams / densityGPerMl;
  return { amount: ml / VOLUME_TO_ML[toUnit as VolumeUnit], unit: toUnit };
}
