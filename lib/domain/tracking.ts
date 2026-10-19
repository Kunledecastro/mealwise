/**
 * Meal log and weight history helpers (Phase 4). Pure functions, unit-tested.
 * Database rows ↔ app shapes, daily totals, and the weight trend.
 */
import type { Meal, MealLog, MealType, WeightEntry } from "../types";

/** Row in public.meal_logs. Numeric columns arrive from Postgres as strings. */
export interface MealLogRow {
  id: string;
  meal_slug: string;
  logged_for: string;
  meal_type: MealType;
  portion: number | string;
  kcal: number;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  created_at?: string;
}

/** Row in public.weight_entries. */
export interface WeightRow {
  id: string;
  measured_on: string;
  weight_kg: number | string;
  entered_unit?: "kg" | "lb";
}

const n = (v: number | string) => (typeof v === "number" ? v : Number(v));
const r1 = (v: number) => Math.round(v * 10) / 10;

export function rowToLog(row: MealLogRow): MealLog {
  return {
    id: row.id,
    slug: row.meal_slug,
    date: row.logged_for,
    mealType: row.meal_type,
    portion: n(row.portion),
    kcal: row.kcal,
    protein: n(row.protein_g),
    carbs: n(row.carbs_g),
    fat: n(row.fat_g),
  };
}

export function rowToWeight(row: WeightRow): WeightEntry {
  return { id: row.id, date: row.measured_on, kg: n(row.weight_kg) };
}

/**
 * The figures saved with a log entry: the meal's per-serving values × portion, copied now so that
 * later catalogue corrections never rewrite what someone logged.
 */
export function logSnapshot(meal: Pick<Meal, "kcal" | "protein" | "carbs" | "fat">, portion: number) {
  return {
    kcal: Math.round(meal.kcal * portion),
    protein_g: r1(meal.protein * portion),
    carbs_g: r1(meal.carbs * portion),
    fat_g: r1(meal.fat * portion),
  };
}

export interface DayTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Totals for one day from the saved figures. */
export function totalsFor(logs: MealLog[], date: string): DayTotals {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const l of logs) {
    if (l.date !== date) continue;
    t.kcal += l.kcal;
    t.protein += l.protein;
    t.carbs += l.carbs;
    t.fat += l.fat;
  }
  return { kcal: Math.round(t.kcal), protein: Math.round(t.protein), carbs: Math.round(t.carbs), fat: Math.round(t.fat) };
}

/** Latest logged weight, else the weight given at setup. */
export function currentWeight(weights: WeightEntry[], profileKg?: number): number | undefined {
  if (!weights.length) return profileKg;
  return weights.reduce((a, b) => (b.date > a.date ? b : a)).kg;
}

const DAY = 86_400_000;

export interface Trend {
  /** kg per week (negative = losing), from a straight line through recent entries. */
  kgPerWeek: number;
  /** Days covered by the entries used. */
  days: number;
  /** Losing faster than about 1% of body weight a week. */
  tooFast: boolean;
}

/**
 * Weekly trend over the last `windowDays` (default 28). Needs at least 3 entries spanning 14 days or
 * more, because day-to-day weight moves with water and food; otherwise null.
 */
export function weeklyTrend(weights: WeightEntry[], today: string, windowDays = 28): Trend | null {
  const end = Date.parse(today);
  const pts = weights
    .map((w) => ({ t: Date.parse(w.date), kg: w.kg }))
    .filter((p) => p.t <= end && end - p.t <= windowDays * DAY)
    .sort((a, b) => a.t - b.t);
  if (pts.length < 3) return null;
  const days = Math.round((pts[pts.length - 1].t - pts[0].t) / DAY);
  if (days < 14) return null;
  const mx = pts.reduce((s, p) => s + p.t, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.kg, 0) / pts.length;
  const num = pts.reduce((s, p) => s + (p.t - mx) * (p.kg - my), 0);
  const den = pts.reduce((s, p) => s + (p.t - mx) ** 2, 0);
  const kgPerWeek = Math.round((num / den) * 7 * DAY * 100) / 100;
  const latest = pts[pts.length - 1].kg;
  return { kgPerWeek, days, tooFast: kgPerWeek < -0.01 * latest };
}

/** Shifts a YYYY-MM-DD date by whole days (calendar arithmetic, no timezone drift). */
export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}
