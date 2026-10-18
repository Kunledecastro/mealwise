export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

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
  name: string;
  quantity: string;
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
  /** SAMPLE values for the prototype — not real nutrition data. */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** SAMPLE naira range — not a real price estimate. */
  costLow: number;
  costHigh: number;
  tags: string[];
  allergens: string[];
  ingredients: Ingredient[];
  steps: string[];
  plate: PlatePart[];
  /** Real photo, when a verified licensed match exists. Otherwise the plate illustration is shown. */
  photo?: MealPhoto;
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
}
