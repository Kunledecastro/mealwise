/**
 * The compiled catalogue the app uses. Built from the data files in this folder at build time.
 */
import { compileCatalogue, type CompileContext } from "@/lib/domain/catalogue";
import { GENERATED_INGREDIENTS } from "./ingredients.generated";
import { MEAL_DEFS as BATCH_1 } from "./meals";
import { ECOOKBOOK_MEALS } from "./meals-ecookbook";
import { RECIPE_FILE_MEALS } from "./meals-recipe-files";
import { BATCH_2_MEALS } from "./meals-batch2";
import { READY_MADE } from "./ready-made";
import { PRICES } from "./prices";
import { NUTRITION_SOURCES } from "./sources";
import { PHOTOS } from "./photos";
import { equipmentFor } from "./equipment";
import type { IngredientDef } from "./types";

/** Date of this catalogue edition. Bump when meals, ingredients or prices change. */
export const CATALOGUE_VERSION = "2026-10-18";

export const INGREDIENTS: IngredientDef[] = GENERATED_INGREDIENTS.map((ing) => (PRICES[ing.id] ? { ...ing, price: PRICES[ing.id] } : ing));

const ctx: CompileContext = {
  ingredients: new Map(INGREDIENTS.map((i) => [i.id, i])),
  sources: new Map(NUTRITION_SOURCES.map((s) => [s.id, s])),
  today: CATALOGUE_VERSION,
};

/** Every meal definition, in display order, with its verified photo attached by slug. */
export const MEAL_DEFS = [...BATCH_1, ...ECOOKBOOK_MEALS, ...RECIPE_FILE_MEALS, ...BATCH_2_MEALS].map((d) =>
  PHOTOS[d.slug] ? { ...d, photo: PHOTOS[d.slug] } : d,
);

const compiled = compileCatalogue(MEAL_DEFS, ctx);

/** Every published meal, with its typical ready-made price when collected. Meals with definition errors are left out (see EXCLUDED_MEALS). */
export const MEALS = compiled.meals.map((m) => ({
  ...m,
  ...(READY_MADE[m.slug] ? { readyMade: READY_MADE[m.slug] } : {}),
  equipment: equipmentFor(m.slug),
}));
export const EXCLUDED_MEALS = compiled.excluded;
export const MEALS_BY_SLUG = new Map(MEALS.map((m) => [m.slug, m]));
export const getMeal = (slug: string) => MEALS_BY_SLUG.get(slug);

/** Every photo used, for the credits list. */
export const PHOTO_CREDITS = MEALS.filter((m) => m.photo).map((m) => ({ meal: m.name, ...m.photo! }));
