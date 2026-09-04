import { Recipe, scaleRecipe } from './scale';

export type PanShape = 'round' | 'square' | 'rectangular';

export interface RoundPan {
  shape: 'round';
  diameter: number; // inches
}

export interface SquarePan {
  shape: 'square';
  side: number; // inches
}

export interface RectangularPan {
  shape: 'rectangular';
  length: number; // inches
  width: number; // inches
}

export type Pan = RoundPan | SquarePan | RectangularPan;

// Cakes, bars, and brownies bake to roughly the same depth regardless of pan
// footprint, so the batter needed scales with the pan's surface area, not its
// volume - a 9x13 pan doesn't need twice the batter of a 9-inch round just
// because it holds more. This assumption breaks down for loaves and other
// deep, narrow pans where depth matters as much as footprint.
export function panArea(pan: Pan): number {
  switch (pan.shape) {
    case 'round':
      if (pan.diameter <= 0) {
        throw new Error('pan diameter must be positive');
      }
      return Math.PI * (pan.diameter / 2) ** 2;
    case 'square':
      if (pan.side <= 0) {
        throw new Error('pan side must be positive');
      }
      return pan.side ** 2;
    case 'rectangular':
      if (pan.length <= 0 || pan.width <= 0) {
        throw new Error('pan length and width must be positive');
      }
      return pan.length * pan.width;
  }
}

// Derives the scale factor for moving a recipe from one pan to another,
// as the ratio of their surface areas.
export function panScaleFactor(fromPan: Pan, toPan: Pan): number {
  return panArea(toPan) / panArea(fromPan);
}

// Scales a recipe from the pan it was written for to a different pan,
// deriving the factor from the pans' areas rather than requiring the
// caller to compute it. Non-linear ingredient categories (spice,
// leavening) still dampen the same way they do under scaleRecipe.
export function scaleRecipeForPan(recipe: Recipe, fromPan: Pan, toPan: Pan): Recipe {
  return scaleRecipe(recipe, panScaleFactor(fromPan, toPan));
}
