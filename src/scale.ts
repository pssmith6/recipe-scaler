import { Quantity, Unit, unitCategory, convertUnit, convertUnitByDensity, lookupIngredientDensity } from './units';

// 'linear' (the default) scales 1:1 with the rest of the recipe. Spices and
// leavening are potent in small amounts - doubling a batch doesn't mean
// doubling the cinnamon or baking soda, since the effect isn't proportional
// to volume the way flour or butter is.
export type IngredientCategory = 'linear' | 'spice' | 'leavening';

export interface Ingredient {
  name: string;
  quantity: Quantity;
  note?: string;
  category?: IngredientCategory;
}

export interface Recipe {
  name: string;
  servings: number;
  ingredients: Ingredient[];
}

// How much of the recipe's overall scale factor to actually apply to a
// non-linear ingredient, as a fraction of the deviation from 1x. Leavening
// gets dampened harder than spices: too much baking soda or baking powder
// ruins texture and leaves a metallic taste, where a bit too much spice is
// merely stronger.
const NONLINEAR_EXPONENTS: Record<Exclude<IngredientCategory, 'linear'>, number> = {
  spice: 0.75,
  leavening: 0.6,
};

// Computes the factor to actually apply to an ingredient's quantity, given
// the recipe's overall scale factor. For 'linear' ingredients this is just
// `factor`. For 'spice' and 'leavening', the deviation from 1x (no change)
// is dampened by a fixed exponent, so a 4x batch might only get ~2.25x the
// spice rather than a full 4x - and a half batch keeps more than half the
// spice, since flavor doesn't disappear as fast as volume does.
export function nonlinearScaleFactor(factor: number, category: IngredientCategory): number {
  if (factor <= 0) {
    throw new Error('scale factor must be positive');
  }
  if (category === 'linear') {
    return factor;
  }
  return 1 + (factor - 1) * NONLINEAR_EXPONENTS[category];
}

export function scaleQuantity(quantity: Quantity, factor: number): Quantity {
  if (factor <= 0) {
    throw new Error('scale factor must be positive');
  }
  return { amount: quantity.amount * factor, unit: quantity.unit };
}

export function scaleIngredient(ingredient: Ingredient, factor: number): Ingredient {
  const effectiveFactor = nonlinearScaleFactor(factor, ingredient.category ?? 'linear');
  return { ...ingredient, quantity: scaleQuantity(ingredient.quantity, effectiveFactor) };
}

export function scaleRecipe(recipe: Recipe, factor: number): Recipe {
  if (factor <= 0) {
    throw new Error('scale factor must be positive');
  }
  return {
    ...recipe,
    servings: recipe.servings * factor,
    ingredients: recipe.ingredients.map((ingredient) => scaleIngredient(ingredient, factor)),
  };
}

// Converts an ingredient's quantity to a different unit, resolving density
// from the ingredient's own name when the conversion crosses the
// volume/weight boundary. An explicit densityGPerMl overrides the name
// lookup, for ingredients not in the table or prepared in a way that changes
// their density (packed vs. sifted flour, for instance).
export function convertIngredientUnit(ingredient: Ingredient, toUnit: Unit, densityGPerMl?: number): Ingredient {
  const fromCategory = unitCategory(ingredient.quantity.unit);
  const toCategory = unitCategory(toUnit);

  if (fromCategory === toCategory) {
    return { ...ingredient, quantity: convertUnit(ingredient.quantity, toUnit) };
  }

  const density = densityGPerMl ?? lookupIngredientDensity(ingredient.name);
  if (density === undefined) {
    throw new Error(
      `no known density for "${ingredient.name}" - pass densityGPerMl explicitly to convert between volume and weight`
    );
  }

  return { ...ingredient, quantity: convertUnitByDensity(ingredient.quantity, toUnit, density) };
}

// Scales a recipe to a target number of servings, deriving the factor from
// the recipe's own stated yield rather than requiring the caller to do
// that division themselves.
export function scaleRecipeToServings(recipe: Recipe, targetServings: number): Recipe {
  if (recipe.servings <= 0) {
    throw new Error('recipe.servings must be positive to compute a scale factor');
  }
  if (targetServings <= 0) {
    throw new Error('targetServings must be positive');
  }
  return scaleRecipe(recipe, targetServings / recipe.servings);
}
