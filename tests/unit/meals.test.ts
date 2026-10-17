import { describe, expect, it } from "vitest";
import { filterMeals, formatMinutes, formatNairaRange, slotForHour } from "@/lib/domain/meals";
import { SAMPLE_MEALS, SAMPLE_PROFILE, fromISODate, toISODate } from "@/lib/sample-data";
import { suitsProfile } from "@/components/meal-bits";

describe("slotForHour", () => {
  it.each([
    [4, "snack"], [5, "breakfast"], [10, "breakfast"], [11, "lunch"],
    [15, "lunch"], [16, "dinner"], [20, "dinner"], [21, "snack"], [0, "snack"],
  ])("hour %i is %s", (hour, slot) => {
    expect(slotForHour(hour)).toBe(slot);
  });
});

describe("filterMeals", () => {
  it("filters by meal type", () => {
    const r = filterMeals(SAMPLE_MEALS, { mealType: "snack" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((m) => m.mealTypes.includes("snack"))).toBe(true);
  });

  it("matches words in name and ingredients, case-insensitive", () => {
    expect(filterMeals(SAMPLE_MEALS, { query: "PLANTAIN" }).map((m) => m.slug)).toEqual(
      expect.arrayContaining(["plantain-egg-frittata", "beans-and-plantain"]),
    );
    expect(filterMeals(SAMPLE_MEALS, { query: "catfish" }).map((m) => m.slug)).toEqual(["fish-pepper-soup"]);
  });

  it("returns nothing for an unknown word", () => {
    expect(filterMeals(SAMPLE_MEALS, { query: "pizza" })).toEqual([]);
  });

  it("applies time, budget and tag limits together", () => {
    const r = filterMeals(SAMPLE_MEALS, { maxPrep: 30, maxCost: 1000, tags: ["Vegan"] });
    expect(r.length).toBeGreaterThan(0);
    for (const m of r) {
      expect(m.prepMinutes).toBeLessThanOrEqual(30);
      expect(m.costLow).toBeLessThanOrEqual(1000);
      expect(m.tags).toContain("Vegan");
    }
  });

  it("never returns a meal containing an excluded allergen", () => {
    for (const allergen of ["Peanuts", "Fish", "Eggs", "Milk", "Wheat", "Shellfish"]) {
      const r = filterMeals(SAMPLE_MEALS, { excludeAllergens: [allergen] });
      expect(r.some((m) => m.allergens.includes(allergen))).toBe(false);
    }
  });
});

describe("suitsProfile (prototype preference filter)", () => {
  it("hides meals with the user's allergens", () => {
    const p = { ...SAMPLE_PROFILE, allergies: ["Peanuts"] };
    expect(SAMPLE_MEALS.filter((m) => suitsProfile(m, p)).some((m) => m.allergens.includes("Peanuts"))).toBe(false);
  });

  it("hides meals with disliked ingredients", () => {
    const p = { ...SAMPLE_PROFILE, dislikes: ["egusi"] };
    expect(suitsProfile(SAMPLE_MEALS.find((m) => m.slug === "egusi-pounded-yam")!, p)).toBe(false);
  });

  it("keeps only vegan meals for vegans", () => {
    const p = { ...SAMPLE_PROFILE, diet: ["Vegan"] };
    expect(SAMPLE_MEALS.filter((m) => suitsProfile(m, p)).every((m) => m.tags.includes("Vegan"))).toBe(true);
  });
});

describe("formatting", () => {
  it("formats naira ranges", () => {
    expect(formatNairaRange(1800, 2800)).toBe("₦1,800–2,800");
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

describe("sample catalogue integrity", () => {
  it("has unique slugs and at least two meals per slot", () => {
    const slugs = SAMPLE_MEALS.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const t of ["breakfast", "lunch", "dinner", "snack"] as const) {
      expect(SAMPLE_MEALS.filter((m) => m.mealTypes.includes(t)).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("has sensible sample values", () => {
    for (const m of SAMPLE_MEALS) {
      expect(m.costLow).toBeLessThanOrEqual(m.costHigh);
      expect(m.kcal).toBeGreaterThan(0);
      expect(m.plate.length).toBeGreaterThan(0);
    }
  });
});
