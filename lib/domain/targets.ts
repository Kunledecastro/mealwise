/**
 * Daily energy and macro targets, with conservative safety rules (ARCHITECTURE §7, DECISION_LOG 006).
 * Pure functions, fully unit-tested. Every figure is an estimate and is explained to the user.
 *
 * Method
 * - Resting energy (BMR): Mifflin-St Jeor. If sex isn't given, the midpoint of the two equations.
 * - Daily needs (TDEE) = BMR × activity factor.
 * - Goal: lose = up to −500 kcal; gain = up to +300 kcal; maintain = 0. The change is capped so the
 *   implied rate never exceeds 1% of body weight a week (loss) or 0.5% (gain), and a deficit never
 *   exceeds 20% of daily needs.
 * - Floor: never below 1,500 kcal (male) / 1,200 kcal (female or not given).
 * - No target at all for under-18s, anyone who says they're pregnant, breastfeeding or have a
 *   condition that affects what they eat, or a "lose" goal when BMI is under 18.5.
 */
import type { Activity, Goal, MealType } from "../types";

export type Sex = "female" | "male";

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

/** Planned daily change before safety caps. */
export const GOAL_ADJUSTMENT: Record<Goal, number> = { lose: -500, maintain: 0, gain: 300 };

export const FLOOR_KCAL = { male: 1500, female: 1200, unspecified: 1200 } as const;

/** Energy in 1 kg of body weight change (commonly used approximation). */
export const KCAL_PER_KG = 7700;
/** Fastest implied weekly change we allow, as a share of body weight. */
export const MAX_WEEKLY_LOSS = 0.01;
export const MAX_WEEKLY_GAIN = 0.005;
/** A deficit never exceeds this share of daily needs. */
export const MAX_DEFICIT_SHARE = 0.2;

/** Protein guide, g per kg of reference body weight. */
export const PROTEIN_PER_KG: Record<Goal, number> = { lose: 1.4, maintain: 1.2, gain: 1.6 };
export const FAT_SHARE = 0.3;
const MAX_PROTEIN_SHARE = 0.35;

export const MIN_AGE = 18;
export const UNDERWEIGHT_BMI = 18.5;
/** Above this BMI, protein is based on the weight at this BMI (avoids very high protein figures). */
const PROTEIN_REF_BMI = 25;

export interface TargetInput {
  birthYear?: number;
  heightCm?: number;
  weightKg?: number;
  sex?: Sex;
  activity?: Activity;
  goal?: Goal;
  targetWeightKg?: number;
  needsGuidance?: boolean;
  /** Current calendar year on the user's clock. */
  year: number;
}

export interface TargetBreakdown {
  age: number;
  bmi: number;
  bmr: number;
  activityFactor: number;
  tdee: number;
  /** Planned change for the goal before safety caps (kcal/day). */
  plannedAdjustment: number;
  /** Change actually applied (kcal/day), after caps and the floor. */
  adjustment: number;
  floor: number;
  floorApplied: boolean;
  /** True when the 1%-a-week (or 20%-of-needs) cap reduced the planned change. */
  capApplied: boolean;
  /** Implied weekly weight change in kg (negative = loss). */
  weeklyChangeKg: number;
  /** True when sex wasn't given and the midpoint equation was used. */
  sexMidpoint: boolean;
  proteinPerKg: number;
  proteinRefKg: number;
}

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MissingField = "birthYear" | "heightCm" | "weightKg" | "activity" | "goal";

export type TargetResult =
  | ({ status: "ok"; breakdown: TargetBreakdown; notes: string[] } & Macros)
  | { status: "incomplete"; missing: MissingField[] }
  | { status: "blocked"; reason: "under18" | "guidance" | "underweight-lose" };

export const MISSING_LABEL: Record<MissingField, string> = {
  birthYear: "year you were born",
  heightCm: "height",
  weightKg: "weight",
  activity: "activity level",
  goal: "goal",
};

export const bmiFor = (kg: number, cm: number) => kg / (cm / 100) ** 2;

/** Mifflin-St Jeor resting energy, kcal/day. Without sex, the midpoint of the two equations (−78). */
export function bmr(kg: number, cm: number, age: number, sex?: Sex): number {
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return base + (sex === "male" ? 5 : sex === "female" ? -161 : -78);
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function calculateTarget(input: TargetInput): TargetResult {
  const { birthYear, heightCm, weightKg, sex, activity, goal } = input;
  if (input.needsGuidance) return { status: "blocked", reason: "guidance" };
  if (birthYear !== undefined && input.year - birthYear < MIN_AGE) return { status: "blocked", reason: "under18" };

  const missing: MissingField[] = [];
  if (!birthYear) missing.push("birthYear");
  if (!heightCm) missing.push("heightCm");
  if (!weightKg) missing.push("weightKg");
  if (!activity) missing.push("activity");
  if (!goal) missing.push("goal");
  if (missing.length || !birthYear || !heightCm || !weightKg || !activity || !goal) return { status: "incomplete", missing };

  const age = input.year - birthYear;
  const bmi = bmiFor(weightKg, heightCm);
  if (goal === "lose" && bmi < UNDERWEIGHT_BMI) return { status: "blocked", reason: "underweight-lose" };

  const restKcal = bmr(weightKg, heightCm, age, sex);
  const factor = ACTIVITY_FACTOR[activity];
  const tdee = restKcal * factor;
  const planned = GOAL_ADJUSTMENT[goal];

  let adjustment = planned;
  if (goal === "lose") {
    const maxDeficit = Math.min((weightKg * MAX_WEEKLY_LOSS * KCAL_PER_KG) / 7, tdee * MAX_DEFICIT_SHARE);
    adjustment = -Math.min(-planned, maxDeficit);
  } else if (goal === "gain") {
    adjustment = Math.min(planned, (weightKg * MAX_WEEKLY_GAIN * KCAL_PER_KG) / 7);
  }
  const capApplied = Math.round(adjustment) !== planned;

  const floor = FLOOR_KCAL[sex ?? "unspecified"];
  let kcal = roundTo(tdee + adjustment, 50);
  const floorApplied = kcal < floor;
  if (floorApplied) kcal = floor;
  const applied = kcal - tdee;

  // Macros: protein from a reference weight, fat 30% of energy, carbohydrate the rest.
  const refKg = bmi > PROTEIN_REF_BMI ? PROTEIN_REF_BMI * (heightCm / 100) ** 2 : weightKg;
  const ppk = PROTEIN_PER_KG[goal];
  const protein = Math.round(Math.min(refKg * ppk, (kcal * MAX_PROTEIN_SHARE) / 4));
  const fat = Math.round((kcal * FAT_SHARE) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));

  const notes: string[] = [];
  if (floorApplied && goal === "lose" && kcal >= tdee - 50)
    notes.push(
      "Your estimated needs are already close to the minimum we suggest, so this target won't create much of a deficit. A doctor or dietitian can advise on losing weight safely.",
    );
  else if (floorApplied) notes.push(`We never suggest less than ${floor.toLocaleString()} kcal a day, so your target is set at that.`);
  if (capApplied && !floorApplied && goal === "lose")
    notes.push("We've kept the deficit smaller than usual so you lose no more than about 1% of your weight a week.");
  if (capApplied && goal === "gain") notes.push("We've kept the surplus small so you gain no more than about 0.5% of your weight a week.");
  if (goal === "lose" && input.targetWeightKg && bmiFor(input.targetWeightKg, heightCm) < UNDERWEIGHT_BMI)
    notes.push("Your target weight is below the healthy range for your height (BMI under 18.5). You may want to choose a higher target.");
  if (goal === "lose" && input.targetWeightKg && input.targetWeightKg >= weightKg)
    notes.push("Your target weight isn't below your current weight. You may want to update your goal or target.");
  if (goal === "gain" && input.targetWeightKg && input.targetWeightKg <= weightKg)
    notes.push("Your target weight isn't above your current weight. You may want to update your goal or target.");

  return {
    status: "ok",
    kcal,
    protein,
    carbs,
    fat,
    notes,
    breakdown: {
      age,
      bmi: Math.round(bmi * 10) / 10,
      bmr: Math.round(restKcal),
      activityFactor: factor,
      tdee: Math.round(tdee),
      plannedAdjustment: planned,
      adjustment: Math.round(applied),
      floor,
      floorApplied,
      capApplied,
      weeklyChangeKg: Math.round(((applied * 7) / KCAL_PER_KG) * 100) / 100,
      sexMidpoint: !sex,
      proteinPerKg: ppk,
      proteinRefKg: Math.round(refKg * 10) / 10,
    },
  };
}

/** Rough share of the day's energy for each meal slot (used for portion guidance and suggestions). */
export const SLOT_SHARE: Record<MealType, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 };

/** Portion sizes a user can log. */
export const PORTIONS = [0.5, 0.75, 1, 1.5, 2] as const;
const SUGGESTED = [0.5, 0.75, 1, 1.5] as const;

/**
 * Serving size that fits the slot's share of the daily target, rounded to a portion people can judge
 * (½, ¾, 1, 1½). Returns 1 when no target is available.
 */
export function suggestedPortion(mealKcal: number, slot: MealType, dailyKcal: number | null | undefined): number {
  if (!dailyKcal || mealKcal <= 0) return 1;
  const ideal = (SLOT_SHARE[slot] * dailyKcal) / mealKcal;
  return SUGGESTED.reduce((best, p) => (Math.abs(p - ideal) < Math.abs(best - ideal) ? p : best), 1 as number);
}

/** Calorie band for a slot from the user's own target (±20% / +15% around the slot's share). */
export function slotBandFromTarget(slot: MealType, dailyKcal: number): [number, number] {
  const mid = SLOT_SHARE[slot] * dailyKcal;
  return [Math.round(mid * 0.8), Math.round(mid * 1.15)];
}
