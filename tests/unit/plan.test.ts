import { describe, expect, it } from "vitest";
import { MEALS, MEALS_BY_SLUG } from "@/catalogue";
import { EMPTY_PROFILE } from "@/lib/domain/profile";
import { cleanItems, dayKcal, generatePlan, setMeal, setServings, slotsFor, swapOptions, NO_REPEAT_DAYS } from "@/lib/domain/plan";
import { checkMeal } from "@/lib/domain/recommend";
import type { Profile } from "@/lib/types";

const profile: Profile = { ...EMPTY_PROFILE, onboarded: true, goal: "lose", cuisines: ["Nigerian"], budget: "medium", maxPrepMinutes: 45 };
const base = { profile };

describe("generating a plan (real catalogue)", () => {
  const week = generatePlan(MEALS, base, { days: 7, includeSnacks: true, dailyKcal: 1750 });

  it("PL-01 fills every slot of every day, snacks included when asked", () => {
    expect(week).toHaveLength(7 * 4);
    expect(generatePlan(MEALS, base, { days: 1, includeSnacks: false, dailyKcal: 1750 }).map((i) => i.slot)).toEqual(["breakfast", "lunch", "dinner"]);
    expect(slotsFor(false)).not.toContain("snack");
  });
  it("PL-02 is deterministic", () => {
    expect(generatePlan(MEALS, base, { days: 7, includeSnacks: true, dailyKcal: 1750 })).toEqual(week);
  });
  it("PL-03 never repeats a meal in a day or within 2 days", () => {
    for (let d = 0; d < 7; d++) {
      const today = week.filter((i) => i.day === d).map((i) => i.slug);
      expect(new Set(today).size, `day ${d}`).toBe(today.length);
    }
    const last = new Map<string, number>();
    for (const i of week) {
      if (last.has(i.slug)) expect(i.day - last.get(i.slug)!, i.slug).toBeGreaterThan(NO_REPEAT_DAYS);
      last.set(i.slug, i.day);
    }
  });
  it("PL-03b with enough choice, no meal repeats in the whole week", () => {
    expect(new Set(week.map((i) => i.slug)).size).toBe(week.length);
  });
  it("PL-04 each day lands near the target (within 15%)", () => {
    for (let d = 0; d < 7; d++) {
      const kcal = dayKcal(week, d, MEALS_BY_SLUG);
      expect(Math.abs(kcal - 1750) / 1750, `day ${d}: ${kcal}`).toBeLessThan(0.15);
    }
  });
  it("PL-05 keeps every hard rule: allergies, diet and dislikes", () => {
    const strict: Profile = { ...profile, allergies: ["Peanuts", "Shellfish"], diet: ["Vegetarian"], dislikes: ["okra"] };
    const plan = generatePlan(MEALS, { profile: strict }, { days: 7, includeSnacks: true, dailyKcal: 1750 });
    expect(plan.length).toBeGreaterThan(0);
    for (const i of plan) expect(checkMeal(MEALS_BY_SLUG.get(i.slug)!, strict).ok, i.slug).toBe(true);
  });
  it("PL-06 leaves out 'Not for me' meals and works without a target", () => {
    const top = generatePlan(MEALS, base, { days: 1, includeSnacks: false })[0].slug;
    const again = generatePlan(MEALS, { ...base, rejected: new Set([top]) }, { days: 1, includeSnacks: false });
    expect(again.map((i) => i.slug)).not.toContain(top);
  });
  it("PL-07 a slot with no possible meal is left empty rather than breaking the rules", () => {
    const impossible: Profile = { ...profile, diet: ["Vegan"], allergies: ["Peanuts", "Tree nuts", "Soy", "Wheat", "Sesame", "Milk", "Eggs", "Fish", "Shellfish"], dislikes: ["rice", "beans", "plantain", "yam", "oats", "bread", "fruit", "salad", "soup"] };
    const plan = generatePlan(MEALS, { profile: impossible }, { days: 2, includeSnacks: true, dailyKcal: 1750 });
    for (const i of plan) expect(checkMeal(MEALS_BY_SLUG.get(i.slug)!, impossible).ok).toBe(true);
  });
});

describe("changing a plan", () => {
  const items = generatePlan(MEALS, base, { days: 2, includeSnacks: false, dailyKcal: 1750 });
  it("PL-08 swap options exclude meals already planned that day and obey the rules", () => {
    const lunch = items.find((i) => i.day === 0 && i.slot === "lunch")!;
    const opts = swapOptions(MEALS, base, items, 0, "lunch", 1750);
    const sameDay = items.filter((i) => i.day === 0).map((i) => i.slug);
    expect(opts.length).toBeGreaterThan(3);
    for (const m of opts) {
      expect(sameDay).not.toContain(m.slug);
      expect(m.mealTypes).toContain("lunch");
    }
    const swapped = setMeal(items, 0, "lunch", opts[0].slug);
    expect(swapped.find((i) => i.day === 0 && i.slot === "lunch")).toMatchObject({ slug: opts[0].slug, servings: lunch.servings });
    expect(swapped).toHaveLength(items.length);
  });
  it("PL-09 servings stay between 0.5 and 8, in halves", () => {
    expect(setServings(items, 0, "lunch", 3).find((i) => i.day === 0 && i.slot === "lunch")!.servings).toBe(3);
    expect(setServings(items, 0, "lunch", 0).find((i) => i.day === 0 && i.slot === "lunch")!.servings).toBe(0.5);
    expect(setServings(items, 0, "lunch", 12).find((i) => i.day === 0 && i.slot === "lunch")!.servings).toBe(8);
    expect(setServings(items, 0, "lunch", 1.3).find((i) => i.day === 0 && i.slot === "lunch")!.servings).toBe(1.5);
  });
  it("PL-10 stored data is cleaned: bad entries, duplicates and days outside the plan are dropped", () => {
    expect(cleanItems([{ day: 0, slot: "lunch", slug: "red-red", servings: 1 }, { day: 0, slot: "lunch", slug: "okpa", servings: 1 }, { day: 5, slot: "lunch", slug: "okpa", servings: 1 }, { day: 0, slot: "supper", slug: "x", servings: 1 }, "junk"], 2))
      .toEqual([{ day: 0, slot: "lunch", slug: "red-red", servings: 1 }]);
    expect(cleanItems(null, 7)).toEqual([]);
  });
});
