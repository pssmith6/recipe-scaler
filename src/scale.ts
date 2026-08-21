import { Quantity } from './units';

export interface Ingredient {
  name: string;
  quantity: Quantity;
  note?: string;
}

export interface Recipe {
  name: string;
  servings: number;
  ingredients: Ingredient[];
}

export function scaleQuantity(quantity: Quantity, factor: number): Quantity {
  if (factor <= 0) {
    throw new Error('scale factor must be positive');
  }
  return { amount: quantity.amount * factor, unit: quantity.unit };
}

export function scaleIngredient(ingredient: Ingredient, factor: number): Ingredient {
  return { ...ingredient, quantity: scaleQuantity(ingredient.quantity, factor) };
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
