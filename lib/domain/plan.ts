/**
 * Day and week meal plans (Phase 5). Pure functions, unit-tested. Deterministic: the same profile,
 * choices and date always give the same plan.
 *
 * For each day:
 * 1. Each slot (breakfast, lunch, dinner, and snack if wanted) gets its best few suggestions from the
 *    recommendation engine, so every hard rule (allergies, diet, dislikes, "Not for me") still applies.
 *    Meals not yet used in the plan come first; a meal is only repeated when a slot runs short of
 *    fresh choices, and never within 2 days, so the week has variety.
 * 2. Of those, the combination is chosen whose total is closest to the daily target, while still
 *    favouring better-scored meals. Without a target, the best meal per slot is used.
 * 3. The same meal is never used twice in one day.
 */
import type { Meal, MealType } from "../types";
import { rankMeals, type RecommendContext } from "./recommend";
import type { PlanItem } from "./shopping";

export const PLAN_SLOTS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
/** Candidates considered per slot when fitting the day to the target. */
export const CANDIDATES = 6;
/** A meal isn't repeated within this many days of the plan. */
export const NO_REPEAT_DAYS = 2;
/** Below this many unused choices for a slot, meals used earlier in the plan may come back. */
const MIN_FRESH = 3;
/** How much a 10% miss on the daily target counts against the meals' scores. */
const TARGET_WEIGHT = 1.5;

export interface PlanOptions {
  days: number;
  includeSnacks: boolean;
  /** Daily kcal target, when one could be calculated. */
  dailyKcal?: number | null;
  /** Meals logged recently (days ago), for variety on the first days. */
  recent?: ReadonlyMap<string, number>;
}

type Base = Omit<RecommendContext, "slot" | "recent" | "daySoFar">;

export function slotsFor(includeSnacks: boolean): MealType[] {
  return includeSnacks ? PLAN_SLOTS : PLAN_SLOTS.filter((s) => s !== "snack");
}

export function generatePlan(meals: Meal[], base: Base, opts: PlanOptions): PlanItem[] {
  const slots = slotsFor(opts.includeSnacks);
  const items: PlanItem[] = [];
  const lastUsed = new Map<string, number>(); // slug → day index
  for (let day = 0; day < opts.days; day++) {
    // Variety: days since each meal was last planned (or logged before the plan started).
    const recent = new Map<string, number>();
    for (const [slug, ago] of opts.recent ?? []) recent.set(slug, ago + day);
    for (const [slug, d] of lastUsed) recent.set(slug, day - d);

    const options = slots.map((slot) => {
      const ranked = rankMeals(meals, { ...base, slot, recent, dailyKcal: opts.dailyKcal, daySoFar: undefined });
      const fresh = ranked.filter((r) => !lastUsed.has(r.meal.slug));
      const reusable = ranked.filter((r) => lastUsed.has(r.meal.slug) && day - lastUsed.get(r.meal.slug)! > NO_REPEAT_DAYS);
      const pool = fresh.length >= MIN_FRESH ? fresh : [...fresh, ...reusable];
      return { slot, ranked: pool.slice(0, CANDIDATES) };
    });

    let best: { score: number; picks: (Meal | null)[] } = { score: -Infinity, picks: [] };
    const search = (i: number, picks: (Meal | null)[], score: number, kcal: number) => {
      if (i === options.length) {
        const miss = opts.dailyKcal ? Math.abs(kcal - opts.dailyKcal) / opts.dailyKcal : 0;
        const total = score - TARGET_WEIGHT * miss * 10;
        if (total > best.score) best = { score: total, picks: [...picks] };
        return;
      }
      const { ranked } = options[i];
      if (!ranked.length) return search(i + 1, [...picks, null], score, kcal);
      for (const r of ranked) {
        if (picks.some((p) => p?.slug === r.meal.slug)) continue; // not twice in a day
        search(i + 1, [...picks, r.meal], score + r.score, kcal + r.meal.kcal);
        if (!opts.dailyKcal) break; // without a target, the top meal per slot is enough
      }
    };
    search(0, [], 0, 0);

    best.picks.forEach((meal, i) => {
      if (!meal) return;
      items.push({ day, slot: options[i].slot, slug: meal.slug, servings: 1 });
      lastUsed.set(meal.slug, day);
    });
  }
  return items;
}

/** Meals for one slot of one day, best first, excluding meals already planned that day. */
export function swapOptions(meals: Meal[], base: Base, items: PlanItem[], day: number, slot: MealType, dailyKcal?: number | null, limit = 8): Meal[] {
  const sameDay = new Set(items.filter((i) => i.day === day).map((i) => i.slug));
  return rankMeals(meals, { ...base, slot, dailyKcal })
    .map((r) => r.meal)
    .filter((m) => !sameDay.has(m.slug))
    .slice(0, limit);
}

/** Replaces (or adds) the meal for a day and slot, keeping the servings. */
export function setMeal(items: PlanItem[], day: number, slot: MealType, slug: string): PlanItem[] {
  const existing = items.find((i) => i.day === day && i.slot === slot);
  const rest = items.filter((i) => i !== existing);
  return sortItems([...rest, { day, slot, slug, servings: existing?.servings ?? 1 }]);
}

export const SERVINGS_MIN = 0.5;
export const SERVINGS_MAX = 8;

/** Changes the "cooking for" servings by a step, within 0.5–8. */
export function setServings(items: PlanItem[], day: number, slot: MealType, servings: number): PlanItem[] {
  const s = Math.min(SERVINGS_MAX, Math.max(SERVINGS_MIN, Math.round(servings * 2) / 2));
  return items.map((i) => (i.day === day && i.slot === slot ? { ...i, servings: s } : i));
}

export function sortItems(items: PlanItem[]): PlanItem[] {
  return [...items].sort((a, b) => a.day - b.day || PLAN_SLOTS.indexOf(a.slot) - PLAN_SLOTS.indexOf(b.slot));
}

/** Energy for one person's plates on a day (one serving each), from the catalogue figures. */
export function dayKcal(items: PlanItem[], day: number, meals: ReadonlyMap<string, Meal>): number {
  return items.filter((i) => i.day === day).reduce((s, i) => s + (meals.get(i.slug)?.kcal ?? 0), 0);
}

/** Keeps only valid entries from stored data (unknown meals are kept; the screen marks them). */
export function cleanItems(raw: unknown, days: number): PlanItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: PlanItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const { day, slot, slug, servings } = r as Record<string, unknown>;
    if (typeof day !== "number" || day < 0 || day >= days || !PLAN_SLOTS.includes(slot as MealType)) continue;
    if (typeof slug !== "string" || typeof servings !== "number") continue;
    const key = `${day}|${slot}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ day, slot: slot as MealType, slug, servings });
  }
  return sortItems(out);
}
