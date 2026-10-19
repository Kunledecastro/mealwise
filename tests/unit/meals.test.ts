import { describe, expect, it } from "vitest";
import { MEALS } from "@/catalogue";
import { filterMeals, formatMinutes, formatNairaRange, hasTag, slotForHour } from "@/lib/domain/meals";
import { fromISODate, toISODate } from "@/lib/sample-data";
import type { Meal } from "@/lib/types";

describe("slotForHour", () => {
  it.each([
    [4, "snack"], [5, "breakfast"], [10, "breakfast"], [11, "lunch"],
    [15, "lunch"], [16, "dinner"], [20, "dinner"], [21, "snack"], [0, "snack"],
  ])("hour %i is %s", (hour, slot) => {
    expect(slotForHour(hour)).toBe(slot);
  });
});

describe("filterMeals (search) on the real catalogue", () => {
  it("filters by meal type", () => {
    const r = filterMeals(MEALS, { mealType: "snack" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((m) => m.mealTypes.includes("snack"))).toBe(true);
  });

  it("matches words in name, ingredients and local names, case-insensitive", () => {
    expect(filterMeals(MEALS, { query: "PLANTAIN" }).map((m) => m.slug)).toEqual(
      expect.arrayContaining(["plantain-egg-frittata", "beans-and-plantain", "red-red"]),
    );
    expect(filterMeals(MEALS, { query: "catfish" }).map((m) => m.slug).sort()).toEqual(["banga-soup-eba", "fish-pepper-soup", "fisherman-soup-yam"]);
    expect(filterMeals(MEALS, { query: "elubo" }).map((m) => m.slug)).toEqual(["amala-ewedu-gbegiri"]);
  });

  it("returns nothing for an unknown word", () => {
    expect(filterMeals(MEALS, { query: "pizza" })).toEqual([]);
  });

  it("applies time and tag limits together", () => {
    const r = filterMeals(MEALS, { maxPrep: 30, tags: ["Vegetarian"] });
    expect(r.length).toBeGreaterThan(0);
    for (const m of r) {
      expect(m.prepMinutes).toBeLessThanOrEqual(30);
      expect(m.diets).toContain("Vegetarian");
    }
  });

  it("derives High protein, Lighter and Quick from the figures", () => {
    const base = MEALS[0];
    const m = (o: Partial<Meal>): Meal => ({ ...base, ...o });
    expect(hasTag(m({ protein: 30, kcal: 600 }), "High protein")).toBe(true);
    expect(hasTag(m({ protein: 8, kcal: 600 }), "High protein")).toBe(false);
    expect(hasTag(m({ kcal: 400 }), "Lighter")).toBe(true);
    expect(hasTag(m({ prepMinutes: 15 }), "Quick")).toBe(true);
  });

  it("keeps meals without a price when filtering by cost (we can't say they're over budget)", () => {
    const priced = { ...MEALS[0], slug: "x", costLow: 5000, costHigh: 6000 };
    const unpriced = { ...MEALS[0], slug: "y", costLow: null, costHigh: null };
    expect(filterMeals([priced, unpriced], { maxCost: 1000 }).map((m) => m.slug)).toEqual(["y"]);
  });

  it("never returns a meal that contains or may contain an excluded allergen", () => {
    for (const allergen of ["Peanuts", "Tree nuts", "Fish", "Eggs", "Milk", "Wheat", "Soy", "Shellfish", "Sesame"]) {
      for (const m of filterMeals(MEALS, { excludeAllergens: [allergen] })) {
        expect([...m.allergens, ...(m.mayContain ?? [])]).not.toContain(allergen);
      }
    }
  });
});

describe("formatting", () => {
  it("formats naira ranges, and says when there's no price yet", () => {
    expect(formatNairaRange(1800, 2800)).toBe("₦1,800–2,800");
    expect(formatNairaRange(null, null)).toBe("Price not yet estimated");
  });

  it("formats minutes", () => {
    expect(formatMinutes(25)).toBe("25 min");
    expect(formatMinutes(60)).toBe("1 hr");
    expect(formatMinutes(75)).toBe("1 hr 15 min");
  });

  it("round-trips ISO dates without timezone shift", () => {
    expect(toISODate(fromISODate("2026-01-31"))).toBe("2026-01-31");
  });
});
