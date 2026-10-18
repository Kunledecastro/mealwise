/**
 * SAMPLE DATA — still placeholder until Phase 4
 *
 * The meal log, weight history and daily target here are illustrative placeholders.
 * Meals themselves now come from the real catalogue (catalogue/).
 */
import type { MealLog, Profile, WeightEntry } from "./types";

export const SAMPLE_PROFILE: Profile = {
  displayName: "Amaka",
  birthYear: 1996,
  heightCm: 165,
  weightKg: 79.4,
  units: "metric",
  goal: "lose",
  targetWeightKg: 74,
  activity: "light",
  diet: [],
  allergies: [],
  dislikes: ["Okra"],
  cuisines: ["Nigerian", "International"],
  budget: "medium",
  maxPrepMinutes: 45,
};

/** SAMPLE daily target shown in the prototype. Real calculation arrives in Phase 4. */
export const SAMPLE_DAILY_TARGET = { kcal: 1850, protein: 100, carbs: 210, fat: 62 };

export function sampleWeights(today: Date): WeightEntry[] {
  const values = [82.1, 81.6, 81.8, 81.0, 80.6, 80.7, 80.0, 79.4];
  return values.map((kg, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (values.length - 1 - i) * 7);
    return { id: `sample-w${i}`, date: toISODate(d), kg };
  });
}

export function sampleLogs(today: Date): MealLog[] {
  const date = toISODate(today);
  return [
    { id: "sample-l1", slug: "oats-banana-groundnuts", mealType: "breakfast", portion: 1, date },
    { id: "sample-l2", slug: "fruit-bowl", mealType: "snack", portion: 1, date },
  ];
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD as a local calendar date (avoids timezone shifts). */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
