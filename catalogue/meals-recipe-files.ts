/**
 * Batch 2b — dishes based on recipe files supplied by the product owner (2026-10-18).
 *
 * - The Golden Rule Cook Book (1907) is in the public domain.
 * - Gourmet Garden Salads and Mom's Best Recipes are copyrighted: we use only the facts
 *   (ingredients and amounts, scaled to one serving) and write every description and step in our
 *   own words. Ingredients the food tables don't cover and that add under 2 kcal (fresh dill,
 *   chives) are listed as optional and not counted.
 * Most of these files are American baking and casseroles; only dishes that suit a weight goal
 * and Lagos kitchens were taken (see DECISION_LOG 044).
 */
import { C } from "./colors";
import type { MealDef, MealIngredient, RecipeCredit } from "./types";

const i = (id: string, grams: number, display: string, optional = false): MealIngredient =>
  optional ? { id, grams, display, optional } : { id, grams, display };

const GOLDEN_RULE: RecipeCredit = {
  title: "The Golden Rule Cook Book (1907), “Lentils Egyptian style”",
  publisher: "M. R. L. Sharpe; digitised by the Internet Archive",
  url: "https://archive.org/details/goldenrulecookbo00shar",
  licence: "Public domain",
};
const GARDEN_SALADS: RecipeCredit = {
  title: "Gourmet Garden Salads: Harvest Goodness from Plant to Plate",
  publisher: "Patti Winker",
  licence: "© the author. Ingredient amounts only; steps written by Mealwise",
};
const MOMS_BEST: RecipeCredit = {
  title: "Mom’s Best Recipes, Volume 2, “Sunrise Smoothie”",
  publisher: "Recipe by Shirley McNevich",
  licence: "© the author. Ingredient amounts only; steps written by Mealwise",
};

export const RECIPE_FILE_MEALS: MealDef[] = [
  {
    slug: "lentils-and-rice",
    name: "Lentils with rice and onions",
    description: "Tender lentils tossed with rice and slow-cooked onions in a little butter. Simple, filling, meat-free.",
    mealTypes: ["lunch", "dinner"],
    cuisine: "Mediterranean",
    serving: "1 bowl",
    prepMinutes: 60,
    ingredients: [
      i("lentils", 95, "½ cup lentils (dry)"),
      i("rice-white", 28, "2 tbsp rice (raw), or ½ cup cooked"),
      i("onion", 38, "½ onion"),
      i("butter", 7, "1½ tsp butter"),
      i("salt", 1, "pinch of salt"),
    ],
    steps: [
      "Rinse the lentils, soak them for 2 hours, then drain.",
      "Boil them in salted water for about 40 minutes until soft, and drain. Boil the rice separately.",
      "Melt the butter and cook the chopped onion gently for 10 minutes without browning.",
      "Fold in the lentils and rice, heat through and season with salt and pepper.",
    ],
    assumptions: ["The original makes about 4 bowls; amounts here are a quarter.", "Lentils are weighed dry."],
    plate: [
      { label: "Lentils", color: C.lentils, share: 0.65, texture: "grains" },
      { label: "Rice", color: C.whiteRice, share: 0.35, texture: "grains" },
    ],
    basedOn: GOLDEN_RULE,
  },
  {
    slug: "herbed-cucumber-salad",
    name: "Herbed cucumber salad",
    description: "Thin cucumber slices in a mint, garlic and honey vinegar dressing. Crunchy and very light.",
    mealTypes: ["snack"],
    cuisine: "International",
    serving: "1 small bowl",
    prepMinutes: 20,
    ingredients: [
      i("cucumber", 113, "1 small cucumber"),
      i("vinegar", 60, "¼ cup vinegar"),
      i("honey", 10, "1½ tsp honey"),
      i("mint", 1, "a few mint leaves"),
      i("garlic", 1, "a little garlic"),
      i("salt", 2, "½ tsp salt (mostly drained off)"),
      i("yoghurt", 30, "2 tbsp plain yoghurt on top", true),
    ],
    steps: [
      "Slice the cucumber very thinly, sprinkle with salt and leave 30–60 minutes; drain and pat dry.",
      "Whisk the vinegar, honey, chopped mint, garlic and any other fresh herbs you have (dill, chives).",
      "Pour over the cucumber and chill for an hour or two. Add a spoon of yoghurt if you like.",
    ],
    assumptions: [
      "The original serves about 4.",
      "Much of the dressing stays in the bowl; we count all of it, so the real figure is a little lower.",
      "Fresh dill and chives aren't in the food tables and add under 2 kcal; not counted.",
    ],
    plate: [{ label: "Cucumber", color: C.cucumber, share: 1, texture: "slices" }],
    basedOn: GARDEN_SALADS,
  },
  {
    slug: "cabbage-carrot-slaw",
    name: "Cabbage and carrot slaw with almonds",
    description: "Shredded cabbage and carrot in a honey-mustard yoghurt dressing with toasted almonds.",
    mealTypes: ["snack", "lunch"],
    cuisine: "International",
    serving: "1 side bowl",
    prepMinutes: 20,
    ingredients: [
      i("cabbage", 60, "1 cup shredded cabbage"),
      i("carrot", 24, "⅓ carrot"),
      i("almonds", 5, "1 tsp sliced almonds"),
      i("olive-oil", 8, "2 tsp olive oil"),
      i("vinegar", 9, "2 tsp vinegar"),
      i("honey", 13, "2 tsp honey"),
      i("yoghurt", 9, "2 tsp plain yoghurt"),
      i("mustard", 2, "a dab of mustard"),
      i("salt", 1, "pinch of salt"),
    ],
    steps: [
      "Toast the almonds in a dry pan until golden.",
      "Shred the cabbage and peel the carrot into thin ribbons.",
      "Whisk the oil, vinegar, honey, yoghurt, mustard, salt and pepper; toss with the vegetables and almonds.",
      "Leave 30 minutes before serving so it softens a little.",
    ],
    assumptions: ["The original serves 4–6 and uses broccoli stems, noting cabbage as a substitute; we use cabbage and count 5 servings."],
    plate: [
      { label: "Slaw", color: C.slaw, share: 0.8, texture: "leafy" },
      { label: "Carrot", color: C.carrot, share: 0.2, texture: "slices" },
    ],
    basedOn: GARDEN_SALADS,
  },
  {
    slug: "fruit-smoothie",
    name: "Pineapple, banana and strawberry smoothie",
    description: "Blended pineapple juice, banana, strawberries and yoghurt. A quick breakfast or snack.",
    mealTypes: ["breakfast", "snack"],
    cuisine: "International",
    serving: "1 large glass (about 350 ml)",
    prepMinutes: 5,
    ingredients: [
      i("pineapple-juice", 125, "½ cup pineapple juice"),
      i("yoghurt-sweet", 120, "½ cup sweetened yoghurt"),
      i("strawberries", 75, "½ cup strawberries (fresh or frozen)"),
      i("banana", 120, "1 banana"),
    ],
    steps: ["Put everything in a blender.", "Blend until smooth and drink straight away."],
    assumptions: ["The original makes 2 glasses.", "Plain yoghurt instead of sweetened saves about 25 kcal."],
    plate: [{ label: "Smoothie", color: C.smoothie, share: 1, texture: "smooth" }],
    basedOn: MOMS_BEST,
  },
];
