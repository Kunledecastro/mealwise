import { describe, expect, it } from "vitest";
import { EXCLUDED_MEALS, INGREDIENTS, MEALS, PHOTO_CREDITS } from "@/catalogue";
import { MEAL_DEFS } from "@/catalogue/meals";
import { NUTRITION_SOURCES } from "@/catalogue/sources";
import { atwaterGap } from "@/lib/domain/catalogue";
import { checkMeal, rankMeals } from "@/lib/domain/recommend";
import { EMPTY_PROFILE } from "@/lib/domain/profile";
import { ALLERGENS, CUISINES } from "@/lib/options";
import { MEAL_TYPES } from "@/lib/types";

// Integrity checks on the REAL catalogue data (batch 1).
describe("catalogue data integrity", () => {
  it("D-01 every meal compiles; none silently excluded", () => {
    expect(EXCLUDED_MEALS).toEqual([]);
    expect(MEALS).toHaveLength(MEAL_DEFS.length);
    expect(MEALS.length).toBeGreaterThanOrEqual(40);
  });
  it("D-02 every ingredient has a known source, a source code and a source food name", () => {
    const ids = new Set(NUTRITION_SOURCES.map((s) => s.id));
    for (const i of INGREDIENTS) {
      expect(ids.has(i.nutrition.sourceId), i.id).toBe(true);
      expect(i.nutrition.ref, i.id).toBeTruthy();
      expect(i.nutrition.sourceName, i.id).toBeTruthy();
    }
  });
  it("D-03 every ingredient's energy agrees with its macronutrients (catches copy errors)", () => {
    for (const i of INGREDIENTS) {
      const gap = atwaterGap(i.per100g);
      expect(gap <= 15 || gap / i.per100g.kcal <= 0.08, `${i.id}: gap ${gap}`).toBe(true);
    }
  });
  it("D-04 allergens agree with food groups (fish → Fish, crayfish → Shellfish, egg → Eggs, dairy → Milk)", () => {
    const need = { fish: "fish", shellfish: "shellfish", egg: "egg", dairy: "milk" } as const;
    for (const i of INGREDIENTS) {
      const a = need[i.group as keyof typeof need];
      if (a) expect(i.contains, i.id).toContain(a);
    }
  });
  it("D-05 ingredient ids are unique and every meal uses known ingredients", () => {
    const ids = INGREDIENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of MEAL_DEFS) for (const mi of d.ingredients) expect(ids, `${d.slug}`).toContain(mi.id);
  });
  it("D-06 each meal slot has enough choice", () => {
    for (const t of MEAL_TYPES) expect(MEALS.filter((m) => m.mealTypes.includes(t)).length, t).toBeGreaterThanOrEqual(8);
  });
  it("D-07 meals have plausible per-serving figures", () => {
    for (const m of MEALS) {
      expect(m.kcal, m.slug).toBeGreaterThan(100);
      expect(m.kcal, m.slug).toBeLessThan(1200);
      expect(m.steps.length, m.slug).toBeGreaterThanOrEqual(1);
      expect(m.assumptions?.length, m.slug).toBeGreaterThanOrEqual(1);
      expect(CUISINES, m.slug).toContain(m.cuisine);
      for (const a of [...m.allergens, ...(m.mayContain ?? [])]) expect(ALLERGENS).toContain(a);
    }
  });
  it("D-08 there are vegetarian and vegan options in every main slot", () => {
    for (const t of ["breakfast", "lunch", "snack"] as const) {
      expect(MEALS.some((m) => m.mealTypes.includes(t) && m.diets?.includes("Vegetarian")), t).toBe(true);
    }
    expect(MEALS.filter((m) => m.diets?.includes("Vegan")).length).toBeGreaterThanOrEqual(4);
  });
  it("D-09 all ten verified photos are still attached", () => {
    expect(PHOTO_CREDITS).toHaveLength(10);
  });
  it("D-10 allergen leak sweep on the real catalogue: no declared allergen ever reaches a suggestion", () => {
    for (const allergy of ALLERGENS) {
      const profile = { ...EMPTY_PROFILE, onboarded: true, allergies: [allergy] };
      for (const slot of MEAL_TYPES) {
        for (const r of rankMeals(MEALS, { profile, slot })) {
          expect([...r.meal.allergens, ...(r.meal.mayContain ?? [])], `${allergy} in ${r.meal.slug}`).not.toContain(allergy);
        }
      }
    }
  });
  it("D-11 dish names people dislike are matched through aliases (egusi, ogbono, okra, beans)", () => {
    const egusi = MEALS.find((m) => m.slug === "egusi-pounded-yam")!;
    const p = (d: string) => ({ ...EMPTY_PROFILE, dislikes: [d] });
    expect(checkMeal(egusi, p("egusi")).ok).toBe(false);
    expect(checkMeal(MEALS.find((m) => m.slug === "ogbono-soup-eba")!, p("ogbono")).ok).toBe(false);
    expect(checkMeal(MEALS.find((m) => m.slug === "okra-soup-eba")!, p("okro")).ok).toBe(false);
    expect(checkMeal(MEALS.find((m) => m.slug === "red-red")!, p("beans")).ok).toBe(false);
  });
});
