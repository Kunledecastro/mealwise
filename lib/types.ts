export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

/** Kitchen equipment a user can say they have (DECISION_LOG 072). */
export type Appliance = "stove" | "oven" | "grill" | "airfryer" | "blender";

/** "What are you in the mood for?" tiles: soft preferences that lift matching meals (DECISION_LOG 073). */
export type Mood = "quick" | "light" | "protein" | "budget" | "classic" | "different";

/** Where the user usually shops (DECISION_LOG 075). */
export type Shop = "market" | "shoprite" | "spar" | "supermarket";

/** Texture used by the plate illustration for one component of a dish. */
export type PlateTexture = "grains" | "balls" | "smooth" | "leafy" | "chunks" | "slices";

export interface PlatePart {
  label: string;
  color: string;
  /** Relative size on the plate, 0–1. */
  share: number;
  texture: PlateTexture;
}

export interface Ingredient {
  /** Catalogue ingredient id (absent in Phase 1 sample data). */
  id?: string;
  name: string;
  aliases?: string[];
  quantity: string;
  /** Grams per serving as used in the nutrition calculation. */
  grams?: number;
  /** Optional ingredients are not counted in nutrition, allergens or diet labels. */
  optional?: boolean;
}

export interface MealPhoto {
  src: string;
  alt: string;
  /** Photographer name or handle as shown on the source site. */
  credit: string;
  source: "Pexels" | "Unsplash";
  /** Photo page on the source site (licence and photographer details). */
  page: string;
}

export interface Meal {
  slug: string;
  name: string;
  description: string;
  mealTypes: MealType[];
  cuisine: string;
  serving: string;
  prepMinutes: number;
  /** Per serving, calculated from ingredients (estimate). */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre?: number;
  /** Per-serving ₦ range; null when not every ingredient has a price yet. */
  costLow: number | null;
  costHigh: number | null;
  /** Date of the oldest price used (YYYY-MM-DD). */
  priceDate?: string | null;
  /** True when that price is older than 90 days. */
  priceStale?: boolean;
  /** Short labels shown on cards ("Vegetarian", "Vegan"). */
  tags: string[];
  /** Every diet the meal fits, derived from ingredients. */
  diets?: string[];
  /** Allergen labels the meal contains (same wording as onboarding). */
  allergens: string[];
  /** Allergens it may contain (treated as "contains" for allergic users). */
  mayContain?: string[];
  /** Some ingredient's allergen content isn't reliably known: hidden from anyone with allergies. */
  allergenUnknown?: boolean;
  /** Contains red meat or poultry (used for the halal note). */
  containsMeat?: boolean;
  ingredients: Ingredient[];
  steps: string[];
  /** Plain-language assumptions behind the estimates. */
  assumptions?: string[];
  plate: PlatePart[];
  /** Real photo, when a verified licensed match exists. Otherwise the plate illustration is shown. */
  photo?: MealPhoto;
  /** Short names of the nutrition sources used. */
  sources?: string[];
  /** Uses a source whose licence allows non-commercial use only (resolve before a paid launch). */
  licenceToConfirm?: boolean;
  /** Ingredients whose figures come from a close stand-in food. */
  substitutes?: string[];
  /** Credit when the dish and proportions are based on a published recipe. */
  basedOn?: { title: string; publisher: string; url?: string; licence: string };
  /** Allergens in optional extras, which are not counted in the meal's allergens. */
  optionalAllergens?: { ingredient: string; allergens: string[] }[];
  /** Typical price to buy one plate ready-made (no vendor names). */
  readyMade?: ReadyMadePrice;
  /** Equipment needed: every group must be met by at least one appliance in it. Empty = no cooking. */
  equipment?: Appliance[][];
}

export interface ReadyMadePrice {
  /** What one bought portion usually is, e.g. "1 plate with 1 piece of chicken". */
  portion: string;
  low: number;
  high: number;
  /** Where this kind of price applies, e.g. "Buka or eatery, Lagos". */
  where: string;
  observedOn: string;
  note?: string;
}

export type Goal = "lose" | "gain" | "maintain";
export type Activity = "sedentary" | "light" | "moderate" | "very";
export type Units = "metric" | "imperial";

export interface Profile {
  displayName: string;
  birthYear?: number;
  heightCm?: number;
  weightKg?: number;
  units: Units;
  goal?: Goal;
  targetWeightKg?: number;
  activity?: Activity;
  diet: string[];
  allergies: string[];
  dislikes: string[];
  cuisines: string[];
  budget?: "low" | "medium" | "high";
  maxPrepMinutes?: number;
  /** Optional; used only for the calorie estimate. */
  sex?: "female" | "male";
  /** Pregnant, breastfeeding or a condition that affects diet: no targets shown. Which one is not stored. */
  needsGuidance?: boolean;
  /** Kitchen equipment the user has. Undefined = not answered (no filtering). */
  appliances?: Appliance[];
  /** Up to three moods. */
  moods?: Mood[];
  /** Where the user usually shops. Undefined = not answered. */
  shop?: Shop;
  /** Set once the user finishes setup. Until then the app sends them to /onboarding. */
  onboarded?: boolean;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  kg: number;
}

export interface MealLog {
  id: string;
  slug: string;
  mealType: MealType;
  portion: number;
  date: string; // YYYY-MM-DD
  /** Figures saved when the meal was logged (portion already applied). */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}
