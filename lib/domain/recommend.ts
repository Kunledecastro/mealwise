/**
 * Mealwise recommendation engine (Phase 3). Deterministic and explainable: same inputs, same
 * order, every time. No AI model.
 *
 * 1. Hard rules (a meal is never suggested if any fails): allergies — including "may contain"
 *    and meals whose allergen content isn't fully known — diet, dislikes, "Not for me".
 * 2. Soft score 0–1 from weighted factors (WEIGHTS below), highest first, ties by name.
 * 3. Plain-language reasons from the strongest factors.
 *
 * Calorie bands per meal slot come from the user's own daily target when there is one (Phase 4),
 * otherwise general guidance scaled by goal.
 */
import { MEAL_TYPES, type Meal, type MealType, type Profile } from "../types";
import { formatMinutes } from "./meals";
import { SLOT_SHARE, slotBandFromTarget } from "./targets";

export const WEIGHTS = { goal: 0.35, time: 0.15, budget: 0.15, cuisine: 0.1, variety: 0.15, saved: 0.1 } as const;

/** kcal per serving considered a typical portion for each slot (maintain). Scaled by goal. */
export const SLOT_KCAL: Record<MealType, [number, number]> = {
  breakfast: [300, 500],
  lunch: [450, 700],
  dinner: [400, 650],
  snack: [100, 250],
};
const GOAL_SCALE = { lose: 0.85, maintain: 1, gain: 1.2 } as const;

/** ₦ per serving each budget band allows (matches onboarding labels). */
export const BUDGET_CAP = { low: 1500, medium: 3000, high: Infinity } as const;

/** The price range used for budget: cooking cost if known, else the ready-made price, else unknown. */
export function mealPriceRange(meal: Meal): [number | null, number | null] {
  if (meal.costLow !== null && meal.costHigh !== null) return [meal.costLow, meal.costHigh];
  if (meal.readyMade) return [meal.readyMade.low, meal.readyMade.high];
  return [null, null];
}

export type HideReason = "allergy" | "allergy_unknown" | "diet" | "dislike" | "rejected";

export interface Verdict {
  ok: boolean;
  reason?: HideReason;
  /** User-facing explanation, e.g. "Contains Peanuts". */
  detail?: string;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").trim();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Text a dislike is matched against: meal name and every ingredient name and alias. */
function searchableText(meal: Meal): string {
  const parts = [meal.name];
  for (const i of meal.ingredients) {
    if (i.optional) continue;
    parts.push(i.name, ...(i.aliases ?? []));
  }
  return norm(parts.join(" | "));
}

/** Whole-word match, allowing a plural "s"/"es", so "egg" matches "eggs" but not "eggplant". */
export function mentions(text: string, term: string): boolean {
  const t = norm(term).replace(/(es|s)$/, "");
  if (t.length < 2) return false;
  return new RegExp(`(^|[^a-z])${escape(t)}(s|es)?([^a-z]|$)`).test(text);
}

/** Hard rules. Order matters only for which reason is shown; any failure hides the meal. */
export function checkMeal(meal: Meal, profile: Profile, rejected?: ReadonlySet<string>): Verdict {
  const blocked = [...meal.allergens, ...(meal.mayContain ?? [])].filter((a) => profile.allergies.includes(a));
  if (blocked.length) {
    const contains = blocked.filter((a) => meal.allergens.includes(a));
    return {
      ok: false,
      reason: "allergy",
      detail: contains.length ? `Contains ${contains.join(", ")}` : `May contain ${blocked.join(", ")}`,
    };
  }
  if (profile.allergies.length && meal.allergenUnknown)
    return { ok: false, reason: "allergy_unknown", detail: "We can't confirm this meal is free of your allergens" };
  const diets = meal.diets ?? meal.tags;
  const missingDiet = profile.diet.filter((d) => !diets.includes(d));
  if (missingDiet.length) return { ok: false, reason: "diet", detail: `Not ${missingDiet.join(" or ").toLowerCase()}` };
  const text = searchableText(meal);
  const disliked = profile.dislikes.find((d) => mentions(text, d));
  if (disliked) return { ok: false, reason: "dislike", detail: `Has ${disliked}, which you said you don't like` };
  if (rejected?.has(meal.slug)) return { ok: false, reason: "rejected", detail: "You marked this “Not for me”" };
  return { ok: true };
}

export interface RecommendContext {
  profile: Profile;
  slot: MealType;
  rejected?: ReadonlySet<string>;
  saved?: ReadonlySet<string>;
  /** Meals logged recently: how many days ago (0 = today). */
  recent?: ReadonlyMap<string, number>;
  /** The user's daily energy target, when one could be calculated. */
  dailyKcal?: number | null;
  /** What has been logged today, so suggestions fit the calories left. Only for today, never for plans. */
  daySoFar?: DaySoFar;
}

/** Today's logged calories and the meal times already logged. */
export interface DaySoFar {
  kcal: number;
  slots: readonly MealType[];
}

export interface DayFit {
  /** Calorie band for this meal, sized to what is left of today's target. */
  band: [number, number];
  /** kcal left of today's target (negative when over). */
  left: number;
  /** How the band compares with this meal time's usual share. */
  shift: "lighter" | "bigger" | "usual";
}

/**
 * Sizes the next meal to what is left of today's target. The calories left are shared among this
 * meal and the meal times not yet logged today, in their usual proportions. Never below half or
 * above one and a half times the usual share, so a big lunch never means skipping dinner and a
 * skipped breakfast never means a huge dinner. Null when there is no target or nothing logged yet.
 */
export function dayFit(slot: MealType, dailyKcal?: number | null, soFar?: DaySoFar): DayFit | null {
  if (!dailyKcal || !soFar || soFar.kcal <= 0) return null;
  const left = Math.round(dailyKcal - soFar.kcal);
  const open = MEAL_TYPES.filter((t) => t === slot || !soFar.slots.includes(t));
  const openShare = open.reduce((sum, t) => sum + SLOT_SHARE[t], 0);
  const usual = SLOT_SHARE[slot] * dailyKcal;
  const fair = (Math.max(0, left) * SLOT_SHARE[slot]) / openShare;
  const mid = Math.min(usual * 1.5, Math.max(usual * 0.5, fair));
  const shift = mid < usual * 0.9 ? "lighter" : mid > usual * 1.1 ? "bigger" : "usual";
  return { band: [Math.round(mid * 0.8), Math.round(mid * 1.15)], left, shift };
}

export interface Factors {
  goal: number;
  time: number;
  budget: number;
  cuisine: number;
  variety: number;
  saved: number;
}

export interface Ranked {
  meal: Meal;
  score: number;
  factors: Factors;
  reasons: string[];
}

function bandScore(kcal: number, [lo, hi]: [number, number]): number {
  if (kcal >= lo && kcal <= hi) return 1;
  const gap = kcal < lo ? lo - kcal : kcal - hi;
  return clamp01(1 - gap / (0.5 * (kcal < lo ? lo : hi)));
}

export function kcalBand(slot: MealType, goal: Profile["goal"], dailyKcal?: number | null, soFar?: DaySoFar): [number, number] {
  const fit = dayFit(slot, dailyKcal, soFar);
  if (fit) return fit.band;
  if (dailyKcal) return slotBandFromTarget(slot, dailyKcal);
  const s = GOAL_SCALE[goal ?? "maintain"];
  const [lo, hi] = SLOT_KCAL[slot];
  return [Math.round(lo * s), Math.round(hi * s)];
}

/** Share of energy from protein (0–1). */
export const proteinShare = (m: Meal) => (m.kcal > 0 ? (m.protein * 4) / m.kcal : 0);

export function goalScore(meal: Meal, slot: MealType, goal: Profile["goal"], dailyKcal?: number | null, soFar?: DaySoFar): number {
  const band = bandScore(meal.kcal, kcalBand(slot, goal, dailyKcal, soFar));
  const ps = proteinShare(meal);
  if (goal === "lose") return 0.5 * band + 0.35 * clamp01((ps - 0.1) / 0.15) + 0.15 * clamp01((meal.fibre ?? 0) / 8);
  if (goal === "gain") return 0.6 * band + 0.4 * clamp01(meal.protein / 30);
  return 0.7 * band + 0.3 * clamp01((ps - 0.08) / 0.12);
}

export function factorsFor(meal: Meal, ctx: RecommendContext): Factors {
  const p = ctx.profile;
  const max = p.maxPrepMinutes;
  const time = !max ? 1 : meal.prepMinutes <= max ? 1 : clamp01(1 - (meal.prepMinutes - max) / max);
  const cap = p.budget ? BUDGET_CAP[p.budget] : Infinity;
  // Cooking cost when known; otherwise the typical price to buy it ready-made.
  const [low, high] = mealPriceRange(meal);
  const budget = cap === Infinity ? 1 : low === null || high === null ? 0.5 : high <= cap ? 1 : clamp01(1 - (low - cap) / cap);
  const cuisine = !p.cuisines.length || p.cuisines.includes(meal.cuisine) ? 1 : 0.4;
  const days = ctx.recent?.get(meal.slug);
  const variety = days === undefined ? 1 : days <= 0 ? 0 : days === 1 ? 0.3 : days === 2 ? 0.6 : 1;
  return {
    goal: goalScore(meal, ctx.slot, p.goal, ctx.dailyKcal, ctx.daySoFar),
    time,
    budget,
    cuisine,
    variety,
    saved: ctx.saved?.has(meal.slug) ? 1 : 0,
  };
}

export function scoreOf(f: Factors): number {
  return (Object.keys(WEIGHTS) as (keyof Factors)[]).reduce((s, k) => s + WEIGHTS[k] * f[k], 0);
}

/** Up to three plain-language reasons why a meal suits the user. Never claims more than the data shows. */
export function reasonsFor(meal: Meal, f: Factors, ctx: RecommendContext): string[] {
  const p = ctx.profile;
  const r: string[] = [];
  const ps = proteinShare(meal);
  const inBand = bandScore(meal.kcal, kcalBand(ctx.slot, p.goal, ctx.dailyKcal, ctx.daySoFar)) === 1;
  const fit = dayFit(ctx.slot, ctx.dailyKcal, ctx.daySoFar);
  if (fit && fit.shift !== "usual" && inBand) {
    r.push(fit.left > 0 ? `Fits the ${fit.left.toLocaleString("en-US")} kcal left today` : "A lighter option for today");
  }
  if (p.goal === "lose") {
    if (ps >= 0.2) r.push("High in protein, which helps you stay full");
    if (inBand) r.push("A lighter portion for your goal");
    if ((meal.fibre ?? 0) >= 8) r.push("High in fibre");
  } else if (p.goal === "gain") {
    if (meal.protein >= 25) r.push("Good protein for gaining");
    if (inBand) r.push("Enough energy for your goal");
  } else if (inBand) r.push("A balanced portion");
  if (p.maxPrepMinutes && f.time === 1) r.push(`Ready in ${formatMinutes(meal.prepMinutes)}`);
  if (p.budget && p.budget !== "high" && f.budget === 1) r.push("Fits your budget");
  if (p.cuisines.length && p.cuisines.includes(meal.cuisine)) r.push(`${meal.cuisine} food you enjoy`);
  if (f.saved) r.push("One of your saved meals");
  return r.slice(0, 3);
}

/** Meals for a slot that pass every hard rule, best first. */
export function rankMeals(meals: Meal[], ctx: RecommendContext): Ranked[] {
  return meals
    .filter((m) => m.mealTypes.includes(ctx.slot) && checkMeal(m, ctx.profile, ctx.rejected).ok)
    .map((meal) => {
      const factors = factorsFor(meal, ctx);
      return { meal, factors, score: Math.round(scoreOf(factors) * 1000) / 1000, reasons: reasonsFor(meal, factors, ctx) };
    })
    .sort((a, b) => b.score - a.score || a.meal.name.localeCompare(b.meal.name));
}

/** Similar meals to swap to: same slot, also allowed, closest in calories. */
export function alternativesFor(meal: Meal, meals: Meal[], ctx: RecommendContext, count = 3): Meal[] {
  return rankMeals(meals, ctx)
    .filter((r) => r.meal.slug !== meal.slug)
    .sort((a, b) => Math.abs(a.meal.kcal - meal.kcal) - Math.abs(b.meal.kcal - meal.kcal) || b.score - a.score)
    .slice(0, count)
    .map((r) => r.meal);
}
