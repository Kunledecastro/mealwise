/**
 * Mealwise catalogue — data model (Phase 3).
 *
 * The catalogue is authored as typed data files in this folder and compiled into the app at
 * build time (DECISION_LOG 033). Nutrition, allergens, diet labels and cost are NEVER typed by
 * hand for a meal: they are calculated from its ingredients, so every figure traces back to a
 * named source entry.
 */
import type { MealPhoto, MealType, PlatePart } from "@/lib/types";

/** The nine allergens users can declare (same order as onboarding). */
export type AllergenCode = "peanut" | "tree_nut" | "shellfish" | "fish" | "egg" | "milk" | "soy" | "wheat" | "sesame";

/**
 * What kind of food an ingredient is. Diet labels (vegetarian, vegan, …) are derived from this,
 * never set by hand.
 */
export type FoodGroup =
  | "beef_goat" // red meat other than pork
  | "pork"
  | "poultry"
  | "fish"
  | "shellfish"
  | "egg"
  | "dairy"
  | "plant"
  | "other_meat" // land animals that are meat but not halal-by-default, e.g. snail
  | "other_animal"; // animal products that aren't meat, e.g. honey

export interface NutritionSource {
  id: string;
  /** Full citation as required by the publisher. */
  citation: string;
  shortName: string;
  url: string;
  licence: string;
  /** "open" = no restriction for our use; "non-commercial" = must be resolved before any paid launch. */
  licenceStatus: "open" | "non-commercial";
}

export interface PriceSource {
  id: string;
  name: string;
  url: string;
  note: string;
}

/** Values per 100 g of the food as weighed in recipes (edible portion). */
export interface Per100g {
  kcal: number;
  protein: number;
  fat: number;
  /** Available carbohydrate, EXCLUDING fibre (WAFCT definition; USDA values are converted). */
  carbs: number;
  fibre: number;
}

export interface IngredientDef {
  id: string;
  /** Name shown to users. */
  name: string;
  /** Other names people search for, e.g. "egusi", "efo tete". */
  aliases?: string[];
  group: FoodGroup;
  per100g: Per100g;
  /** Where the numbers come from. */
  nutrition: {
    sourceId: string;
    /** Code in the source table, e.g. WAFCT "06_013" or USDA FDC id. */
    ref: string;
    /** Food name exactly as in the source. */
    sourceName: string;
    /** Set when the source food is a stand-in for the real ingredient (e.g. a related species). */
    substituteNote?: string;
    /** Fields the source itself marks as estimated (shown in [brackets] in WAFCT). */
    estimatedInSource?: string[];
  };
  /** Allergens the ingredient contains. */
  contains: AllergenCode[];
  /** Allergens it commonly may contain (cross-contact or varying recipes). Treated like "contains" for allergic users. */
  mayContain?: AllergenCode[];
  /** If allergen content is not reliably known, allergic users never see meals with it. */
  allergenStatus: "known" | "unknown";
  /** ₦ price range for a stated unit, if sourced. */
  price?: IngredientPrice;
}

export interface IngredientPrice {
  /** e.g. "1 kg", "1 tuber (medium)", "1 piece". */
  unit: string;
  /** Edible grams that one unit yields, used to convert to a per-serving cost. */
  gramsPerUnit: number;
  low: number;
  high: number;
  /** Date the price was observed or published (YYYY-MM-DD). Shown to users; stale after 90 days. */
  observedOn: string;
  sourceId: string;
  note?: string;
}

export interface MealIngredient {
  id: string;
  /** Grams per serving, edible portion, as used in the recipe. */
  grams: number;
  /** What a cook would read, e.g. "1 cup", "2 tbsp". */
  display: string;
  /** Optional ingredients are listed but NOT counted in nutrition, allergens or diet labels. */
  optional?: boolean;
}

export interface MealDef {
  slug: string;
  name: string;
  description: string;
  mealTypes: MealType[];
  /** "Nigerian", "Ghanaian", "International", "Asian", "Mediterranean" (matches onboarding choices). */
  cuisine: string;
  /** e.g. "1 plate (about 450 g)". */
  serving: string;
  /** Active preparation + cooking time, minutes. */
  prepMinutes: number;
  ingredients: MealIngredient[];
  steps: string[];
  /** Plain-language assumptions behind the figures (oil absorbed, portion sizes, …). */
  assumptions: string[];
  plate: PlatePart[];
  photo?: MealPhoto;
  /** Where the dish and its proportions come from, when based on a published recipe. Steps are always our own words. */
  basedOn?: RecipeCredit;
}

export interface RecipeCredit {
  title: string;
  publisher: string;
  url?: string;
  licence: string;
}
