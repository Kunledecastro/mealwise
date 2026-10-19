import { describe, expect, it } from "vitest";
import { INGREDIENTS, MEALS, MEALS_BY_SLUG } from "@/catalogue";
import { BUYING_UNITS } from "@/catalogue/buying-units";
import { sectionFor } from "@/catalogue/shop-sections";
import type { IngredientDef } from "@/catalogue/types";
import { allergenIngredients, amountFor, buildShoppingList, estimateFor, listAsText, type PlanItem } from "@/lib/domain/shopping";
import { ALLERGEN_LABEL } from "@/lib/domain/catalogue";
import type { Meal } from "@/lib/types";

// Synthetic ingredients and meals with round numbers.
const ing = (id: string, over: Partial<IngredientDef> = {}): IngredientDef => ({
  id, name: id, group: "plant", per100g: { kcal: 100, protein: 0, fat: 0, carbs: 25, fibre: 0 },
  nutrition: { sourceId: "x", ref: "1", sourceName: id }, contains: [], allergenStatus: "known", ...over,
});
const ING = new Map([
  ["rice-white", ing("rice-white", { name: "White rice", price: { unit: "1 kg", gramsPerUnit: 1000, low: 2000, high: 2600, observedOn: "2026-05-31", sourceId: "nbs" } })],
  ["chicken", ing("chicken", { name: "Chicken", group: "poultry", price: { unit: "1 kg (bone-in, about 750 g edible)", gramsPerUnit: 750, low: 4500, high: 6000, observedOn: "2026-05-31", sourceId: "nbs" } })],
  ["amaranth", ing("amaranth", { name: "Efo" })],
  ["salt", ing("salt", { name: "Salt" })],
  ["groundnuts", ing("groundnuts", { name: "Groundnuts" })],
]);
const meal = (slug: string, ingredients: Meal["ingredients"]): Meal =>
  ({ slug, name: slug, ingredients, kcal: 500, protein: 20, carbs: 60, fat: 15 }) as Meal;
const MEALS_T = new Map([
  ["a", meal("a", [{ id: "rice-white", name: "", quantity: "", grams: 150 }, { id: "chicken", name: "", quantity: "", grams: 100 }, { id: "salt", name: "", quantity: "", grams: 2 }])],
  ["b", meal("b", [{ id: "rice-white", name: "", quantity: "", grams: 100 }, { id: "amaranth", name: "", quantity: "", grams: 200 }, { id: "groundnuts", name: "", quantity: "", grams: 30, optional: true }])],
]);
const UNITS = { amaranth: { unit: "1 bunch efo (about 300 g)", grams: 300 } };
const plan: PlanItem[] = [
  { day: 0, slot: "lunch", slug: "a", servings: 2 },
  { day: 0, slot: "dinner", slug: "b", servings: 1 },
  { day: 1, slot: "lunch", slug: "b", servings: 3 },
  { day: 1, slot: "dinner", slug: "gone", servings: 1 },
];

describe("shopping list", () => {
  const lines = buildShoppingList(plan, MEALS_T, ING, UNITS);
  const line = (id: string, optional = false) => lines.find((l) => l.id === id && l.optional === optional)!;

  it("SH-01 adds the same ingredient across meals, multiplied by servings", () => {
    expect(line("rice-white").grams).toBe(150 * 2 + 100 + 100 * 3);
    expect(line("amaranth").grams).toBe(200 + 600);
    expect(line("rice-white").meals).toEqual(["a", "b"]);
  });
  it("SH-02 every quantity is in grams at source, so one ingredient is always one line in one unit", () => {
    const ids = lines.filter((l) => !l.optional).map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("SH-03 shows amounts the way they're bought", () => {
    expect(line("rice-white").amount).toBe("about 700 g");
    expect(amountFor(1300, { unit: "1 kg", grams: 1000 })).toBe("about 1.25 kg");
    expect(line("chicken").amount).toBe("about 250 g as sold"); // 200 g edible ÷ 0.75
    expect(line("amaranth").amount).toBe("3 × bunch efo (about 300 g)"); // 800 g = 2.67 bunches → 3
    expect(line("salt").amount).toBe("a little");
    expect(amountFor(80, { unit: "1 crate (30 eggs, about 1.5 kg edible)", grams: 1500 })).toBe("about 80 g · sold as 1 crate (30 eggs, about 1.5 kg edible)");
    expect(amountFor(615, { unit: "1 bunch (about 300 g)", grams: 300 })).toBe("2 × bunch (about 300 g)"); // 2.05 → 2
    expect(amountFor(260, { unit: "1 ball (about 250 g)", grams: 250 })).toBe("1 ball (about 250 g)");
  });
  it("SH-04 optional extras are a separate line and never priced into the total", () => {
    expect(line("groundnuts", true).grams).toBe(30 + 90);
    expect(lines[lines.length - 1].optional).toBe(true);
  });
  it("SH-04b optional extras with the user's allergen are left off the list", () => {
    const withNut = new Map([...ING, ["groundnuts", ing("groundnuts", { name: "Groundnuts", contains: ["peanut"] })]]);
    const skip = allergenIngredients(withNut.values(), ["Peanuts"], ALLERGEN_LABEL);
    expect(skip.has("groundnuts")).toBe(true);
    const safe = buildShoppingList(plan, MEALS_T, withNut, UNITS, skip);
    expect(safe.some((l) => l.id === "groundnuts")).toBe(false);
    expect(allergenIngredients(withNut.values(), [], ALLERGEN_LABEL).size).toBe(0);
  });
  it("SH-05 meals no longer in the catalogue are skipped", () => {
    expect(lines.flatMap((l) => l.meals)).not.toContain("gone");
  });
  it("SH-06 ₦ estimate covers what's still to buy, lists unpriced items, and drops 'already have'", () => {
    const e = estimateFor(lines, {});
    // rice 700 g: 1,400–1,820; chicken 200 g edible: 1,200–1,600 → 2,600–3,420 → rounded outward to ₦100.
    expect(e).toMatchObject({ low: 2600, high: 3500, priced: 2, unpriced: ["Efo"], oldest: "2026-05-31" });
    expect(estimateFor(lines, { "rice-white": "have" })).toMatchObject({ low: 1200, high: 1600, priced: 1 });
    expect(estimateFor(lines, { "rice-white": "bought" }).priced).toBe(2); // bought still counts in the estimate
  });
  it("SH-07 text version skips ticked lines and groups by section", () => {
    const text = listAsText(lines, { chicken: "have" });
    expect(text).toContain("- White rice: about 700 g");
    expect(text).not.toContain("Chicken");
    expect(text).toContain("Optional extras\n- groundnuts".replace("groundnuts", "Groundnuts"));
  });
});

describe("real catalogue", () => {
  it("SH-08 every ingredient used by a meal has a shopping section", () => {
    const used = new Set(MEALS.flatMap((m) => m.ingredients.map((i) => i.id!)));
    for (const i of INGREDIENTS.filter((x) => used.has(x.id))) expect(sectionFor(i), i.id).not.toBe("Other");
  });
  it("SH-09 a week's list from real meals builds, with sane amounts and no NaN", () => {
    const items: PlanItem[] = MEALS.slice(0, 21).map((m, n) => ({ day: Math.floor(n / 3), slot: "lunch", slug: m.slug, servings: 1 }));
    const lines = buildShoppingList(items, MEALS_BY_SLUG, new Map(INGREDIENTS.map((i) => [i.id, i])), BUYING_UNITS);
    expect(lines.length).toBeGreaterThan(20);
    for (const l of lines) {
      expect(l.amount, l.id).not.toMatch(/NaN|undefined|Infinity/);
      if (l.low !== null) expect(l.high!).toBeGreaterThanOrEqual(l.low);
    }
    const e = estimateFor(lines, {});
    expect(e.low).toBeGreaterThan(0);
  });
});
