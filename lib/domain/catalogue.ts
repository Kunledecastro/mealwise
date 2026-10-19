/**
 * Turns catalogue definitions (ingredients + recipes) into the meals the app shows.
 * Every number is calculated here from ingredient source values; nothing is typed by hand.
 * Pure functions: no I/O, fully unit-tested.
 */
import type { AllergenCode, FoodGroup, IngredientDef, MealDef, NutritionSource, Per100g } from "@/catalogue/types";
import type { Meal } from "../types";

export const ALLERGEN_LABEL: Record<AllergenCode, string> = {
  peanut: "Peanuts",
  tree_nut: "Tree nuts",
  shellfish: "Shellfish",
  fish: "Fish",
  egg: "Eggs",
  milk: "Milk",
  soy: "Soy",
  wheat: "Wheat",
  sesame: "Sesame",
};

/** Prices older than this are flagged to the user as possibly out of date. */
export const PRICE_STALE_DAYS = 90;
/** Seasonings below this weight are ignored for cost (salt, a pinch of spice). */
export const MIN_COSTED_GRAMS = 5;

const MEAT: FoodGroup[] = ["beef_goat", "pork", "poultry", "other_meat"];

/** Diet labels a meal satisfies, derived only from its (non-optional) ingredients' food groups. */
export function dietsFor(groups: FoodGroup[]): string[] {
  const has = (g: FoodGroup) => groups.includes(g);
  const diets: string[] = [];
  const noMeat = !MEAT.some(has);
  const vegetarian = noMeat && !has("fish") && !has("shellfish");
  if (vegetarian) diets.push("Vegetarian");
  if (vegetarian && !has("egg") && !has("dairy") && !has("other_animal")) diets.push("Vegan");
  if (noMeat) diets.push("Pescatarian");
  if (!has("pork")) diets.push("No pork");
  // Halal: no pork, snail or alcohol in the recipe. Meat must still come from a halal source (shown as a note).
  if (!has("pork") && !has("other_meat")) diets.push("Halal");
  return diets;
}

export interface CompileContext {
  ingredients: Map<string, IngredientDef>;
  sources: Map<string, NutritionSource>;
  /** "Today" for price staleness, YYYY-MM-DD. Passed in so results are deterministic. */
  today: string;
}

export class CatalogueError extends Error {}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function nutritionFor(def: MealDef, ctx: CompileContext): Per100g {
  const total: Per100g = { kcal: 0, protein: 0, fat: 0, carbs: 0, fibre: 0 };
  for (const mi of def.ingredients) {
    if (mi.optional) continue;
    const ing = ctx.ingredients.get(mi.id);
    if (!ing) throw new CatalogueError(`${def.slug}: unknown ingredient "${mi.id}"`);
    if (!(mi.grams > 0)) throw new CatalogueError(`${def.slug}: "${mi.id}" needs a positive gram amount`);
    const f = mi.grams / 100;
    total.kcal += ing.per100g.kcal * f;
    total.protein += ing.per100g.protein * f;
    total.fat += ing.per100g.fat * f;
    total.carbs += ing.per100g.carbs * f;
    total.fibre += ing.per100g.fibre * f;
  }
  return {
    kcal: Math.round(total.kcal),
    protein: round1(total.protein),
    fat: round1(total.fat),
    carbs: round1(total.carbs),
    fibre: round1(total.fibre),
  };
}

export interface CostResult {
  low: number | null;
  high: number | null;
  /** Oldest price date used (YYYY-MM-DD), or null if no cost. */
  priceDate: string | null;
  stale: boolean;
  /** Ingredients (≥ MIN_COSTED_GRAMS) that have no price yet. */
  missing: string[];
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/** Per-serving ₦ range. Only shown when every costed ingredient has a price; rounded outwards to ₦50. */
export function costFor(def: MealDef, ctx: CompileContext): CostResult {
  let low = 0;
  let high = 0;
  let oldest: string | null = null;
  const missing: string[] = [];
  for (const mi of def.ingredients) {
    if (mi.optional || mi.grams < MIN_COSTED_GRAMS) continue;
    const ing = ctx.ingredients.get(mi.id);
    if (!ing) throw new CatalogueError(`${def.slug}: unknown ingredient "${mi.id}"`);
    const p = ing.price;
    if (!p) {
      missing.push(ing.name);
      continue;
    }
    low += (p.low * mi.grams) / p.gramsPerUnit;
    high += (p.high * mi.grams) / p.gramsPerUnit;
    if (!oldest || p.observedOn < oldest) oldest = p.observedOn;
  }
  if (missing.length) return { low: null, high: null, priceDate: null, stale: false, missing };
  return {
    low: Math.floor(low / 50) * 50,
    high: Math.max(Math.ceil(high / 50) * 50, Math.floor(low / 50) * 50 + 50),
    priceDate: oldest,
    stale: oldest ? daysBetween(oldest, ctx.today) > PRICE_STALE_DAYS : false,
    missing,
  };
}

export function allergensFor(def: MealDef, ctx: CompileContext) {
  const contains = new Set<AllergenCode>();
  const may = new Set<AllergenCode>();
  let unknown = false;
  for (const mi of def.ingredients) {
    if (mi.optional) continue;
    const ing = ctx.ingredients.get(mi.id)!;
    ing.contains.forEach((a) => contains.add(a));
    ing.mayContain?.forEach((a) => may.add(a));
    if (ing.allergenStatus === "unknown") unknown = true;
  }
  for (const a of contains) may.delete(a);
  return { contains: [...contains], mayContain: [...may], unknown };
}

/** Compiles one meal. Throws CatalogueError if the definition is inconsistent. */
export function compileMeal(def: MealDef, ctx: CompileContext): Meal {
  if (!def.ingredients.length) throw new CatalogueError(`${def.slug}: no ingredients`);
  if (!def.steps.length) throw new CatalogueError(`${def.slug}: no steps`);
  const n = nutritionFor(def, ctx);
  const cost = costFor(def, ctx);
  const al = allergensFor(def, ctx);
  const used = def.ingredients.filter((mi) => !mi.optional).map((mi) => ctx.ingredients.get(mi.id)!);
  const groups = used.map((i) => i.group);
  const diets = dietsFor(groups);
  const sourceIds = new Set(used.map((i) => i.nutrition.sourceId));
  const sourceShortNames = [...sourceIds].map((id) => ctx.sources.get(id)?.shortName ?? id);
  const licenceToConfirm = [...sourceIds].some((id) => ctx.sources.get(id)?.licenceStatus === "non-commercial");
  return {
    slug: def.slug,
    name: def.name,
    description: def.description,
    mealTypes: def.mealTypes,
    cuisine: def.cuisine,
    serving: def.serving,
    prepMinutes: def.prepMinutes,
    kcal: n.kcal,
    protein: n.protein,
    carbs: n.carbs,
    fat: n.fat,
    fibre: n.fibre,
    costLow: cost.low,
    costHigh: cost.high,
    priceDate: cost.priceDate,
    priceStale: cost.stale,
    tags: diets.filter((d) => d === "Vegetarian" || d === "Vegan"),
    diets,
    allergens: al.contains.map((a) => ALLERGEN_LABEL[a]),
    mayContain: al.mayContain.map((a) => ALLERGEN_LABEL[a]),
    allergenUnknown: al.unknown,
    containsMeat: groups.some((g) => MEAT.includes(g)),
    ingredients: def.ingredients.map((mi) => {
      const ing = ctx.ingredients.get(mi.id)!;
      return { id: ing.id, name: ing.name, aliases: ing.aliases ?? [], quantity: mi.display, grams: mi.grams, optional: !!mi.optional };
    }),
    steps: def.steps,
    assumptions: def.assumptions,
    plate: def.plate,
    photo: def.photo,
    sources: sourceShortNames,
    licenceToConfirm,
    substitutes: used.filter((i) => i.nutrition.substituteNote).map((i) => `${i.name}: ${i.nutrition.substituteNote}`),
    basedOn: def.basedOn,
  };
}

export interface CompiledCatalogue {
  meals: Meal[];
  /** Meals left out, with the reason (shown in the catalogue report, never to users). */
  excluded: { slug: string; reason: string }[];
}

/** Compiles all meals; meals with errors are excluded with a reason rather than published wrong. */
export function compileCatalogue(defs: MealDef[], ctx: CompileContext): CompiledCatalogue {
  const meals: Meal[] = [];
  const excluded: CompiledCatalogue["excluded"] = [];
  const seen = new Set<string>();
  for (const def of defs) {
    if (seen.has(def.slug)) throw new CatalogueError(`Duplicate meal slug "${def.slug}"`);
    seen.add(def.slug);
    try {
      meals.push(compileMeal(def, ctx));
    } catch (e) {
      if (e instanceof CatalogueError) excluded.push({ slug: def.slug, reason: e.message });
      else throw e;
    }
  }
  return { meals, excluded };
}

/**
 * Checks an ingredient's figures are internally consistent: energy should be close to
 * 4·protein + 9·fat + 4·carbs + 2·fibre (the Atwater factors WAFCT uses). Catches typing slips.
 */
export function atwaterGap(p: Per100g): number {
  const calc = 4 * p.protein + 9 * p.fat + 4 * p.carbs + 2 * p.fibre;
  return Math.abs(calc - p.kcal);
}
