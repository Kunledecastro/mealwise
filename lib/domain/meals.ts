import type { Meal, MealType } from "../types";

/** Which meal slot to suggest at a given hour of the day (0–23). */
export function slotForHour(hour: number): MealType {
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 21) return "dinner";
  return "snack";
}

export interface MealFilters {
  query?: string;
  mealType?: MealType | "any";
  maxPrep?: number;
  maxCost?: number;
  tags?: string[];
  excludeAllergens?: string[];
}

/** Search filter labels that are derived from the figures rather than stored on the meal. */
export const DERIVED_TAGS: Record<string, (m: Meal) => boolean> = {
  "High protein": (m) => m.protein >= 25 || (m.kcal > 0 && (m.protein * 4) / m.kcal >= 0.2),
  Lighter: (m) => m.kcal <= 450,
  Quick: (m) => m.prepMinutes <= 20,
};

export function hasTag(m: Meal, tag: string): boolean {
  const derived = DERIVED_TAGS[tag];
  return derived ? derived(m) : m.tags.includes(tag) || !!m.diets?.includes(tag);
}

/** Filtering over the catalogue for the search screen. */
export function filterMeals(meals: Meal[], f: MealFilters): Meal[] {
  const q = f.query?.trim().toLowerCase() ?? "";
  return meals.filter((m) => {
    if (f.mealType && f.mealType !== "any" && !m.mealTypes.includes(f.mealType)) return false;
    if (f.maxPrep && m.prepMinutes > f.maxPrep) return false;
    // Meals without a price estimate stay in results (we can't say they're over budget).
    if (f.maxCost && m.costLow !== null && m.costLow > f.maxCost) return false;
    if (f.tags?.length && !f.tags.every((t) => hasTag(m, t))) return false;
    if (f.excludeAllergens?.length) {
      // Same safety rule as suggestions: "may contain" and unknown allergen content count too.
      if ([...m.allergens, ...(m.mayContain ?? [])].some((a) => f.excludeAllergens!.includes(a))) return false;
      if (m.allergenUnknown) return false;
    }
    if (q) {
      const hay = [m.name, m.description, m.cuisine, ...m.ingredients.flatMap((i) => [i.name, ...(i.aliases ?? [])])].join(" ").toLowerCase();
      if (!q.split(/\s+/).every((word) => hay.includes(word))) return false;
    }
    return true;
  });
}

export function formatNaira(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

export function formatNairaRange(low: number | null, high: number | null): string {
  if (low === null || high === null) return "Price not yet estimated";
  return `${formatNaira(low)}–${formatNaira(high).slice(1)}`;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
