# recipe-scaler

A recipe is written for one yield. As soon as you need a different one -
half a batch, a dozen instead of four dozen cookies, a dinner party instead
of a weeknight meal - every quantity has to be recomputed, and the units
have to stay sane while you do it. This library does that math: scaling
ingredient lists by a factor or to a target serving count, and converting
quantities between compatible units (volume to volume, weight to weight).

It is a plain TypeScript library with no runtime dependencies. Every
exported function is pure - same input, same output, no hidden state - so
a recipe can be scaled or converted without touching anything outside the
values passed in.

## Usage

```ts
import { scaleRecipeToServings, convertUnit, Recipe } from 'recipe-scaler';

const cookies: Recipe = {
  name: 'Chocolate chip cookies',
  servings: 12,
  ingredients: [
    { name: 'flour', quantity: { amount: 2.25, unit: 'cup' } },
    { name: 'butter', quantity: { amount: 1, unit: 'cup' } },
    { name: 'eggs', quantity: { amount: 2, unit: 'unit' } },
  ],
};

const forThirty = scaleRecipeToServings(cookies, 30);
// forThirty.servings === 30
// forThirty.ingredients[0].quantity.amount === 5.625 (cups of flour)

const flourInGrams = convertUnit({ amount: 5.625, unit: 'cup' }, 'ml');
// { amount: 1330.0837..., unit: 'ml' }
```

`convertUnit` only converts within a measurement category: volume units
(`ml`, `l`, `tsp`, `tbsp`, `cup`, `flOz`, `pint`, `quart`) convert to other
volume units, weight units (`g`, `kg`, `oz`, `lb`) convert to other weight
units, and count-based ingredients (`unit`, e.g. "2 eggs") don't convert to
anything else - there's no fixed size to convert against. Trying to cross
categories, or convert a count unit to a different unit, throws.

`scaleRecipe` takes an explicit factor; `scaleRecipeToServings` derives the
factor from the recipe's own `servings` field. Neither mutates its input -
both return a new `Recipe`.

Scaling produces exact decimals (5.625 cups), which isn't something anyone
can actually measure. `roundQuantityToCookingFraction` rounds a scaled
quantity to the nearest amount a cook could hit with standard cups and
spoons - eighths for tsp/tbsp, thirds and eighths for cups, quarters for
oz/lb/whole units - and rounds scale-and-container units (g, kg, ml, l) to a
sensible decimal place instead. `formatQuantity` renders the result as a
recipe card would print it:

```ts
import { formatQuantity, roundQuantityToCookingFraction } from 'recipe-scaler';

const rounded = roundQuantityToCookingFraction({ amount: 2.2, unit: 'cup' });
// { amount: 2.25, unit: 'cup' }

formatQuantity({ amount: 2.2, unit: 'cup' });
// '2 1/4 cup'
```

Both functions are separate from scaling on purpose: scaling stays exact so
rounding error doesn't compound across repeated scale calls, and rounding is
applied once, right before a quantity is displayed to a cook.

## Status

Linear scaling, same-category unit conversion, and fraction rounding for
display. Not yet handled: non-linear adjustments (spices and leavening
rarely scale 1:1), scaling by pan size, parsing quantities out of plain
ingredient text, and volume/weight conversions across ingredients (which
need density, not just a unit table).

## License

MIT
