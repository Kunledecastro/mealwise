import { describe, expect, it } from "vitest";
import { EMPTY_PROFILE } from "@/lib/domain/profile";
import { alternativesFor, checkMeal, kcalBand, mentions, rankMeals, reasonsFor, factorsFor, WEIGHTS } from "@/lib/domain/recommend";
import type { Meal, Profile } from "@/lib/types";

// Synthetic meals for engine tests — not catalogue data.
let n = 0;
const m = (over: Partial<Meal>): Meal => ({
  slug: `meal-${++n}`,
  name: `Meal ${n}`,
  description: "",
  mealTypes: ["lunch"],
  cuisine: "Nigerian",
  serving: "1 plate",
  prepMinutes: 30,
  kcal: 550,
  protein: 25,
  carbs: 60,
  fat: 18,
  fibre: 5,
  costLow: 1000,
  costHigh: 1400,
  tags: [],
  diets: ["No pork", "Halal"],
  allergens: [],
  mayContain: [],
  allergenUnknown: false,
  ingredients: [{ name: "Rice", quantity: "1 cup" }],
  steps: ["Cook."],
  plate: [],
  ...over,
});
const P = (over: Partial<Profile>): Profile => ({ ...EMPTY_PROFILE, onboarded: true, ...over });

describe("hard rules (safety)", () => {
  it("R-01 a meal containing a declared allergen is never suggested", () => {
    const peanut = m({ allergens: ["Peanuts"] });
    expect(checkMeal(peanut, P({ allergies: ["Peanuts"] }))).toMatchObject({ ok: false, reason: "allergy", detail: "Contains Peanuts" });
    expect(rankMeals([peanut], { profile: P({ allergies: ["Peanuts"] }), slot: "lunch" })).toEqual([]);
  });
  it("R-02 'may contain' counts as contains for allergic users", () => {
    const v = checkMeal(m({ mayContain: ["Wheat"] }), P({ allergies: ["Wheat"] }));
    expect(v).toMatchObject({ ok: false, reason: "allergy", detail: "May contain Wheat" });
  });
  it("R-03 unknown allergen content is hidden from anyone with an allergy, shown to others", () => {
    const unknown = m({ allergenUnknown: true });
    expect(checkMeal(unknown, P({ allergies: ["Sesame"] })).reason).toBe("allergy_unknown");
    expect(checkMeal(unknown, P({})).ok).toBe(true);
  });
  it("R-04 allergen leak sweep: across many combinations, no suggestion ever contains a declared allergen", () => {
    const labels = ["Peanuts", "Tree nuts", "Shellfish", "Fish", "Eggs", "Milk", "Soy", "Wheat", "Sesame"];
    const meals: Meal[] = [];
    labels.forEach((a, i) => {
      meals.push(m({ allergens: [a], mealTypes: ["lunch"] }));
      meals.push(m({ mayContain: [labels[(i + 1) % 9]], mealTypes: ["lunch"] }));
      meals.push(m({ allergenUnknown: true, mealTypes: ["lunch"] }));
    });
    meals.push(m({}));
    for (let mask = 1; mask < 1 << 9; mask += 7) {
      const allergies = labels.filter((_, i) => mask & (1 << i));
      for (const r of rankMeals(meals, { profile: P({ allergies }), slot: "lunch" })) {
        const all = [...r.meal.allergens, ...(r.meal.mayContain ?? [])];
        expect(all.filter((a) => allergies.includes(a))).toEqual([]);
        expect(r.meal.allergenUnknown).toBeFalsy();
      }
    }
  });
  it("R-05 every chosen diet must be met", () => {
    const fishMeal = m({ diets: ["Pescatarian", "No pork", "Halal"] });
    expect(checkMeal(fishMeal, P({ diet: ["Vegetarian"] }))).toMatchObject({ ok: false, reason: "diet", detail: "Not vegetarian" });
    expect(checkMeal(fishMeal, P({ diet: ["Pescatarian", "No pork"] })).ok).toBe(true);
  });
  it("R-06 dislikes match whole words in names and aliases, including plurals", () => {
    const meal = m({ name: "Okra soup", ingredients: [{ name: "Melon seed", aliases: ["egusi"], quantity: "" }, { name: "Eggs", quantity: "" }] });
    expect(checkMeal(meal, P({ dislikes: ["okra"] })).reason).toBe("dislike");
    expect(checkMeal(meal, P({ dislikes: ["Egusi"] })).reason).toBe("dislike");
    expect(checkMeal(meal, P({ dislikes: ["egg"] })).reason).toBe("dislike");
    expect(mentions("eggplant stew", "egg")).toBe(false);
    expect(mentions("rice", "ri")).toBe(false);
  });
  it("R-07 optional ingredients don't trigger dislikes", () => {
    expect(checkMeal(m({ ingredients: [{ name: "Pepper", quantity: "", optional: true }] }), P({ dislikes: ["pepper"] })).ok).toBe(true);
  });
  it("R-08 'Not for me' hides a meal", () => {
    const x = m({});
    expect(checkMeal(x, P({}), new Set([x.slug])).reason).toBe("rejected");
  });
  it("R-09 only meals for the requested slot are ranked", () => {
    const b = m({ mealTypes: ["breakfast"] });
    expect(rankMeals([b], { profile: P({}), slot: "dinner" })).toEqual([]);
  });
});

describe("ranking", () => {
  it("R-10 weights add up to 1", () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
  it("R-11 is deterministic and breaks ties by name", () => {
    const a = m({ name: "B dish" });
    const b = m({ name: "A dish" });
    const ctx = { profile: P({}), slot: "lunch" as const };
    const r1 = rankMeals([a, b], ctx).map((r) => r.meal.name);
    expect(r1).toEqual(["A dish", "B dish"]);
    expect(rankMeals([b, a], ctx).map((r) => r.meal.name)).toEqual(r1);
  });
  it("R-12 losing weight favours a lighter, higher-protein meal over a heavy one", () => {
    const light = m({ name: "Light", kcal: 450, protein: 35, fibre: 9 });
    const heavy = m({ name: "Heavy", kcal: 950, protein: 15, fibre: 2 });
    expect(rankMeals([heavy, light], { profile: P({ goal: "lose" }), slot: "lunch" })[0].meal.name).toBe("Light");
  });
  it("R-13 gaining weight favours more energy and protein", () => {
    const small = m({ name: "Small", kcal: 350, protein: 10 });
    const big = m({ name: "Big", kcal: 750, protein: 35 });
    expect(rankMeals([small, big], { profile: P({ goal: "gain" }), slot: "lunch" })[0].meal.name).toBe("Big");
  });
  it("R-14 calorie bands scale with goal", () => {
    expect(kcalBand("lunch", "maintain")).toEqual([450, 700]);
    expect(kcalBand("lunch", "lose")[1]).toBeLessThan(700);
    expect(kcalBand("lunch", "gain")[1]).toBeGreaterThan(700);
  });
  it("R-15 time, budget, cuisine, variety and saved each move a meal up or down", () => {
    const meal = m({ prepMinutes: 90, costLow: 4000, costHigh: 5000, cuisine: "Asian" });
    const ctx = { profile: P({ maxPrepMinutes: 30, budget: "low" as const, cuisines: ["Nigerian"] }), slot: "lunch" as const };
    const f = factorsFor(meal, ctx);
    expect(f.time).toBe(0);
    expect(f.budget).toBe(0);
    expect(f.cuisine).toBe(0.4);
    expect(factorsFor(meal, { ...ctx, recent: new Map([[meal.slug, 0]]) }).variety).toBe(0);
    expect(factorsFor(meal, { ...ctx, recent: new Map([[meal.slug, 1]]) }).variety).toBe(0.3);
    expect(factorsFor(meal, { ...ctx, saved: new Set([meal.slug]) }).saved).toBe(1);
  });
  it("R-16 a meal with no price yet scores neutral on budget, not zero", () => {
    expect(factorsFor(m({ costLow: null, costHigh: null }), { profile: P({ budget: "low" }), slot: "lunch" }).budget).toBe(0.5);
  });
  it("R-17 eating the same meal today pushes it below an equal alternative", () => {
    const a = m({ name: "A" });
    const b = m({ name: "B" });
    const ranked = rankMeals([a, b], { profile: P({}), slot: "lunch", recent: new Map([[a.slug, 0]]) });
    expect(ranked[0].meal.name).toBe("B");
  });
});

describe("reasons and alternatives", () => {
  it("R-18 reasons reflect real factors only (max 3)", () => {
    const meal = m({ kcal: 480, protein: 32, fibre: 9, prepMinutes: 20, costHigh: 1200 });
    const ctx = { profile: P({ goal: "lose", maxPrepMinutes: 30, budget: "low", cuisines: ["Nigerian"] }), slot: "lunch" as const };
    const r = reasonsFor(meal, factorsFor(meal, ctx), ctx);
    expect(r.length).toBeLessThanOrEqual(3);
    expect(r[0]).toBe("High in protein, which helps you stay full");
    const none = reasonsFor(m({ kcal: 1200, protein: 5 }), factorsFor(m({ kcal: 1200, protein: 5 }), { profile: P({ goal: "lose" }), slot: "lunch" }), { profile: P({ goal: "lose" }), slot: "lunch" });
    expect(none).toEqual([]);
  });
  it("R-19 alternatives are allowed meals in the same slot, closest in calories, never the meal itself", () => {
    const base = m({ name: "Base", kcal: 500 });
    const near = m({ name: "Near", kcal: 520 });
    const far = m({ name: "Far", kcal: 900 });
    const blocked = m({ name: "Blocked", kcal: 505, allergens: ["Fish"] });
    const other = m({ name: "Breakfast", kcal: 500, mealTypes: ["breakfast"] });
    const alts = alternativesFor(base, [base, near, far, blocked, other], { profile: P({ allergies: ["Fish"] }), slot: "lunch" });
    expect(alts.map((a) => a.name)).toEqual(["Near", "Far"]);
  });
});
