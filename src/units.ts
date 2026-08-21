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
