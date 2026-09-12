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

Not every ingredient should scale 1:1. Doubling a batch of cookies doesn't
mean doubling the cinnamon or the baking soda - spices taste stronger than
their volume suggests once a batch grows, and too much leavening ruins
texture rather than just tasting different. Tag an ingredient with a
`category` of `'spice'` or `'leavening'` and its effective factor is
dampened toward 1x instead of following the recipe's factor exactly:

```ts
const gingerbread: Recipe = {
  name: 'Gingerbread',
  servings: 12,
  ingredients: [
    { name: 'flour', quantity: { amount: 3, unit: 'cup' } },
    { name: 'ground ginger', quantity: { amount: 1, unit: 'tbsp' }, category: 'spice' },
    { name: 'baking soda', quantity: { amount: 1, unit: 'tsp' }, category: 'leavening' },
  ],
};

const forFortyEight = scaleRecipeToServings(gingerbread, 48); // 4x
// flour: 12 cup (4x, linear)
// ground ginger: 3.25 tbsp (~3.25x, not 4x)
// baking soda: 2.8 tsp (~2.8x, not 4x)
```

Ingredients without a `category` (the default) scale linearly, same as
before.

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

A recipe written for one pan doesn't scale by servings when the real
constraint is the pan you own. `scaleRecipeForPan` derives a factor from the
surface area of the pan the recipe was written for versus the pan you're
using, on the assumption (true for cakes, bars, and brownies; not for loaves
or other deep pans) that batter depth stays roughly constant and the amount
needed scales with footprint:

```ts
import { scaleRecipeForPan, Pan } from 'recipe-scaler';

const nineInchRound: Pan = { shape: 'round', diameter: 9 };
const nineByThirteen: Pan = { shape: 'rectangular', length: 13, width: 9 };

const forSheet = scaleRecipeForPan(cookies, nineInchRound, nineByThirteen);
// factor is (13 * 9) / (pi * 4.5^2) =~ 1.84
```

`Pan` also has a `square` variant (`{ shape: 'square', side }`). All
dimensions are inches; `panArea` and `panScaleFactor` are exposed separately
if you just need the numbers rather than a scaled recipe.

Recipes are usually typed or copied as plain text, not entered field by
field. `parseIngredientLine` turns a line like that into an `Ingredient`:

```ts
import { parseIngredientLine } from 'recipe-scaler';

parseIngredientLine('2 1/4 cups flour');
// { name: 'flour', quantity: { amount: 2.25, unit: 'cup' } }

parseIngredientLine('1 tsp baking soda');
// { name: 'baking soda', quantity: { amount: 1, unit: 'tsp' } }

parseIngredientLine('2 eggs');
// { name: 'eggs', quantity: { amount: 2, unit: 'unit' } }
```

It understands mixed numbers, plain fractions, decimals, and single-glyph
fractions like "2¼", and recognizes common unit words and abbreviations
(including plurals, like "cups" or "tablespoons"). A line whose leading
word isn't a known unit is treated as a count, the same way `2 eggs` is
above. It doesn't split off trailing notes ("2 cups flour, sifted" keeps
", sifted" as part of the name) or spell out `category` - those still need
to be set by hand.

## Testing

Tests run on Node's built-in test runner directly against the TypeScript
source, using Node's native type-stripping support - no test framework or
build step needed:

```
npm test
```

This requires Node 23.6 or later.

## Status

Linear and non-linear scaling, same-category unit conversion, fraction
rounding for display, area-based pan scaling, parsing quantities out of
plain ingredient text, and a test suite covering conversion and parsing edge
cases. Not yet handled: volume/weight conversions across ingredients, which
need an ingredient's density rather than just a fixed unit table.

## License

MIT
