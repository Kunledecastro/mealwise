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

/** Simple filtering over the catalogue. Used by search in the prototype. */
export function filterMeals(meals: Meal[], f: MealFilters): Meal[] {
  const q = f.query?.trim().toLowerCase() ?? "";
  return meals.filter((m) => {
    if (f.mealType && f.mealType !== "any" && !m.mealTypes.includes(f.mealType)) return false;
    if (f.maxPrep && m.prepMinutes > f.maxPrep) return false;
    if (f.maxCost && m.costLow > f.maxCost) return false;
    if (f.tags?.length && !f.tags.every((t) => m.tags.includes(t))) return false;
    if (f.excludeAllergens?.length && m.allergens.some((a) => f.excludeAllergens!.includes(a))) return false;
    if (q) {
      const hay = [m.name, m.description, m.cuisine, ...m.ingredients.map((i) => i.name)].join(" ").toLowerCase();
      if (!q.split(/\s+/).every((word) => hay.includes(word))) return false;
    }
    return true;
  });
}

export function formatNaira(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

export function formatNairaRange(low: number, high: number): string {
  return `${formatNaira(low)}–${formatNaira(high).slice(1)}`;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
