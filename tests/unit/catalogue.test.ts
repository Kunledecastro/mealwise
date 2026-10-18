import { describe, expect, it } from "vitest";
import type { IngredientDef, MealDef, NutritionSource } from "@/catalogue/types";
import { atwaterGap, compileCatalogue, compileMeal, costFor, dietsFor, type CompileContext } from "@/lib/domain/catalogue";

// Synthetic test ingredients — invented round numbers, not real nutrition data.
const src: NutritionSource[] = [
  { id: "open", citation: "Test open source", shortName: "OPEN", url: "https://example.test", licence: "CC0", licenceStatus: "open" },
  { id: "nc", citation: "Test NC source", shortName: "NC", url: "https://example.test", licence: "NC", licenceStatus: "non-commercial" },
];
const base = (id: string, over: Partial<IngredientDef>): IngredientDef => ({
  id,
  name: id,
  group: "plant",
  per100g: { kcal: 100, protein: 10, fat: 0, carbs: 15, fibre: 0 },
  nutrition: { sourceId: "open", ref: "X1", sourceName: id },
  contains: [],
  allergenStatus: "known",
  price: { unit: "1 kg", gramsPerUnit: 1000, low: 1000, high: 2000, observedOn: "2026-09-01", sourceId: "p" },
  ...over,
});
const ING = [
  base("rice", {}),
  base("chicken", { group: "poultry", per100g: { kcal: 200, protein: 20, fat: 12, carbs: 0, fibre: 0 } }),
  base("fish", { group: "fish", contains: ["fish"] }),
  base("crayfish", { group: "shellfish", contains: ["shellfish"], nutrition: { sourceId: "nc", ref: "N1", sourceName: "crayfish" } }),
  base("egg", { group: "egg", contains: ["egg"] }),
  base("milk", { group: "dairy", contains: ["milk"] }),
  base("cube", { group: "beef_goat", mayContain: ["wheat", "soy"] }),
  base("mystery", { allergenStatus: "unknown" }),
  base("salt", { per100g: { kcal: 0, protein: 0, fat: 0, carbs: 0, fibre: 0 }, price: undefined }),
  base("unpriced", { price: undefined }),
  base("old", { price: { unit: "1 kg", gramsPerUnit: 1000, low: 1000, high: 1000, observedOn: "2026-01-01", sourceId: "p" } }),
];
const ctx: CompileContext = {
  ingredients: new Map(ING.map((i) => [i.id, i])),
  sources: new Map(src.map((s) => [s.id, s])),
  today: "2026-10-18",
};
const meal = (over: Partial<MealDef>): MealDef => ({
  slug: "test-meal",
  name: "Test meal",
  description: "",
  mealTypes: ["lunch"],
  cuisine: "Nigerian",
  serving: "1 plate",
  prepMinutes: 30,
  ingredients: [{ id: "rice", grams: 200, display: "1 cup" }],
  steps: ["Cook it."],
  assumptions: [],
  plate: [],
  ...over,
});

describe("nutrition is calculated from ingredients", () => {
  it("C-01 sums grams × per-100 g values", () => {
    const m = compileMeal(meal({ ingredients: [{ id: "rice", grams: 200, display: "" }, { id: "chicken", grams: 150, display: "" }] }), ctx);
    expect(m.kcal).toBe(200 + 300);
    expect(m.protein).toBe(20 + 30);
    expect(m.fat).toBe(18);
    expect(m.carbs).toBe(30);
  });
  it("C-02 optional ingredients are listed but not counted", () => {
    const m = compileMeal(meal({ ingredients: [{ id: "rice", grams: 100, display: "" }, { id: "chicken", grams: 100, display: "", optional: true }] }), ctx);
    expect(m.kcal).toBe(100);
    expect(m.ingredients).toHaveLength(2);
    expect(m.diets).toContain("Vegetarian"); // optional chicken doesn't change the diet
  });
  it("C-03 unknown ingredient or zero grams excludes the meal instead of publishing it wrong", () => {
    const r = compileCatalogue(
      [meal({ slug: "a", ingredients: [{ id: "nope", grams: 10, display: "" }] }), meal({ slug: "b", ingredients: [{ id: "rice", grams: 0, display: "" }] }), meal({ slug: "c" })],
      ctx,
    );
    expect(r.meals.map((m) => m.slug)).toEqual(["c"]);
    expect(r.excluded.map((e) => e.slug)).toEqual(["a", "b"]);
  });
  it("C-04 duplicate slugs are rejected", () => {
    expect(() => compileCatalogue([meal({}), meal({})], ctx)).toThrow(/Duplicate/);
  });
  it("C-05 Atwater check flags inconsistent figures", () => {
    expect(atwaterGap({ kcal: 100, protein: 10, fat: 0, carbs: 15, fibre: 0 })).toBe(0);
    expect(atwaterGap({ kcal: 300, protein: 10, fat: 0, carbs: 15, fibre: 0 })).toBe(200);
  });
});

describe("allergens roll up from ingredients", () => {
  it("C-06 contains and may-contain are collected, unknown status is carried", () => {
    const m = compileMeal(meal({ ingredients: [{ id: "fish", grams: 100, display: "" }, { id: "cube", grams: 4, display: "" }, { id: "mystery", grams: 10, display: "" }] }), ctx);
    expect(m.allergens).toEqual(["Fish"]);
    expect(m.mayContain?.sort()).toEqual(["Soy", "Wheat"]);
    expect(m.allergenUnknown).toBe(true);
  });
  it("C-07 an allergen in 'contains' is not repeated in 'may contain'", () => {
    const egg2 = { ...ING.find((i) => i.id === "egg")!, id: "egg2", mayContain: ["egg" as const] };
    const c2 = { ...ctx, ingredients: new Map([...ctx.ingredients, ["egg2", egg2]]) };
    const m = compileMeal(meal({ ingredients: [{ id: "egg", grams: 50, display: "" }, { id: "egg2", grams: 50, display: "" }] }), c2);
    expect(m.allergens).toEqual(["Eggs"]);
    expect(m.mayContain).toEqual([]);
  });
});

describe("diet labels are derived, never typed", () => {
  it("C-08 plant-only is vegan and vegetarian", () => {
    expect(dietsFor(["plant"])).toEqual(["Vegetarian", "Vegan", "Pescatarian", "No pork", "Halal"]);
  });
  it("C-09 egg or dairy is vegetarian but not vegan", () => {
    expect(dietsFor(["plant", "egg"])).toContain("Vegetarian");
    expect(dietsFor(["plant", "dairy"])).not.toContain("Vegan");
  });
  it("C-10 fish or crayfish is pescatarian, not vegetarian", () => {
    for (const g of ["fish", "shellfish"] as const) {
      expect(dietsFor(["plant", g])).toContain("Pescatarian");
      expect(dietsFor(["plant", g])).not.toContain("Vegetarian");
    }
  });
  it("C-11 a beef stock cube makes a dish non-vegetarian", () => {
    const m = compileMeal(meal({ ingredients: [{ id: "rice", grams: 100, display: "" }, { id: "cube", grams: 4, display: "" }] }), ctx);
    expect(m.diets).not.toContain("Vegetarian");
    expect(m.containsMeat).toBe(true);
  });
  it("C-12 pork is excluded from no-pork and halal", () => {
    expect(dietsFor(["pork"])).not.toContain("No pork");
    expect(dietsFor(["pork"])).not.toContain("Halal");
  });
});

describe("cost", () => {
  it("C-13 converts unit prices to a per-serving range rounded outward to ₦50", () => {
    const c = costFor(meal({ ingredients: [{ id: "rice", grams: 250, display: "" }] }), ctx);
    expect(c).toMatchObject({ low: 250, high: 500, priceDate: "2026-09-01", stale: false });
  });
  it("C-14 tiny seasonings without a price are ignored; a missing main ingredient hides the price", () => {
    expect(costFor(meal({ ingredients: [{ id: "rice", grams: 100, display: "" }, { id: "salt", grams: 2, display: "" }] }), ctx).low).not.toBeNull();
    const c = costFor(meal({ ingredients: [{ id: "rice", grams: 100, display: "" }, { id: "unpriced", grams: 50, display: "" }] }), ctx);
    expect(c.low).toBeNull();
    expect(c.missing).toEqual(["unpriced"]);
  });
  it("C-15 prices older than 90 days are flagged stale, using the oldest price", () => {
    const c = costFor(meal({ ingredients: [{ id: "rice", grams: 100, display: "" }, { id: "old", grams: 100, display: "" }] }), ctx);
    expect(c.priceDate).toBe("2026-01-01");
    expect(c.stale).toBe(true);
  });
});

describe("provenance", () => {
  it("C-16 meals list their sources and flag non-commercial licences", () => {
    const m = compileMeal(meal({ ingredients: [{ id: "rice", grams: 100, display: "" }, { id: "crayfish", grams: 10, display: "" }] }), ctx);
    expect(m.sources?.sort()).toEqual(["NC", "OPEN"]);
    expect(m.licenceToConfirm).toBe(true);
    expect(compileMeal(meal({}), ctx).licenceToConfirm).toBe(false);
  });
});
