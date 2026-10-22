import { describe, expect, it } from "vitest";
import { MEALS, MEALS_BY_SLUG } from "@/catalogue";
import { EQUIPMENT } from "@/catalogue/equipment";
import { SHOP_PRICES } from "@/catalogue/shop-prices";
import type { IngredientDef } from "@/catalogue/types";
import { EMPTY_PROFILE, profileToUpdate, rowToProfile, type ProfileRow } from "@/lib/domain/profile";
import { checkMeal, fitsMood, missingEquipment, rankMeals } from "@/lib/domain/recommend";
import { generatePlan } from "@/lib/domain/plan";
import { addOwnItem, buildShoppingList, cleanOwnItems, estimateFor, listAsText, newOwnItemId, type PlanItem } from "@/lib/domain/shopping";
import { MOODS } from "@/lib/options";
import type { Meal, Profile } from "@/lib/types";

const profile: Profile = { ...EMPTY_PROFILE, onboarded: true, goal: "maintain" };
const get = (slug: string) => MEALS_BY_SLUG.get(slug)!;

describe("kitchen equipment", () => {
  it("D-15 every meal whose steps mention an oven, charcoal, a grill or a blender is tagged on purpose", () => {
    for (const m of MEALS) {
      const text = m.steps.join(" ").toLowerCase();
      if (/\boven\b|charcoal|\bgrill|blender/.test(text)) expect(EQUIPMENT[m.slug], m.slug).toBeDefined();
    }
    for (const slug of Object.keys(EQUIPMENT)) expect(MEALS_BY_SLUG.has(slug), slug).toBe(true);
  });

  it("KM-01 no kitchen list means no filtering", () => {
    expect(MEALS.every((m) => missingEquipment(m, undefined) === null)).toBe(true);
    expect(MEALS.every((m) => missingEquipment(m, []) === null)).toBe(true);
  });

  it("KM-02 without an oven, grill or air fryer, oven-or-charcoal dishes are hidden with a clear reason", () => {
    const p = { ...profile, appliances: ["stove" as const] };
    const v = checkMeal(get("boli"), p);
    expect(v).toMatchObject({ ok: false, reason: "equipment" });
    expect(v.detail).toBe("Needs a charcoal grill, an oven or an air fryer, which isn't in your kitchen list");
    expect(checkMeal(get("grilled-tilapia-boli"), p).ok).toBe(false);
    expect(checkMeal(get("jollof-rice-chicken"), p).ok).toBe(true); // "grill or fry": a pan does it
    expect(checkMeal(get("suya-beef-salad"), p).ok).toBe(true); // "grill or pan-roast"
  });

  it("KM-03 any one appliance in a choice is enough; every choice must be met", () => {
    expect(checkMeal(get("boli"), { ...profile, appliances: ["airfryer"] }).ok).toBe(true);
    expect(checkMeal(get("grilled-chicken-potatoes"), { ...profile, appliances: ["oven"] }).ok).toBe(false); // also needs a stove for the potatoes
    expect(checkMeal(get("grilled-chicken-potatoes"), { ...profile, appliances: ["stove", "oven"] }).ok).toBe(true);
  });

  it("KM-04 only the smoothie needs a blender; ground pepper and beans can be bought ground", () => {
    const noBlender = { ...profile, appliances: ["stove" as const] };
    expect(checkMeal(get("fruit-smoothie"), noBlender).ok).toBe(false);
    expect(checkMeal(get("akara-and-pap"), noBlender).ok).toBe(true);
    expect(checkMeal(get("moi-moi"), noBlender).ok).toBe(true);
  });

  it("KM-05 no-cook meals stay available to someone with no stove", () => {
    const blenderOnly = { ...profile, appliances: ["blender" as const] };
    const ok = MEALS.filter((m) => checkMeal(m, blenderOnly).ok).map((m) => m.slug);
    expect(ok).toEqual(expect.arrayContaining(["fruit-bowl", "banana-groundnuts", "fruit-smoothie", "veg-sticks-yoghurt-dip"]));
    expect(ok).not.toContain("jollof-rice-chicken");
  });

  it("KM-06 plans respect the kitchen list", () => {
    const p = { ...profile, appliances: ["stove" as const] };
    const items = generatePlan(MEALS, { profile: p }, { days: 7, includeSnacks: true, dailyKcal: 2000 });
    for (const i of items) expect(checkMeal(get(i.slug), p).ok, i.slug).toBe(true);
  });
});

describe("moods", () => {
  it("KM-07 each mood matches the meals it says", () => {
    const quick = MEALS.filter((m) => fitsMood(m, "quick", "lunch"));
    expect(quick.length).toBeGreaterThan(0);
    expect(quick.every((m) => m.prepMinutes <= 30)).toBe(true);
    expect(fitsMood(get("fish-pepper-soup"), "light", "dinner")).toBe(true); // 223 kcal
    expect(fitsMood(get("afang-soup-eba"), "light", "dinner")).toBe(false); // 955 kcal
    expect(fitsMood(get("afang-soup-eba"), "protein", "dinner")).toBe(true); // 70 g protein
    expect(fitsMood(get("red-red"), "classic", "lunch")).toBe(true); // Ghanaian
    expect(fitsMood(get("spaghetti-bolognese"), "different", "lunch")).toBe(true);
    for (const m of MEALS) if (fitsMood(m, "budget", "lunch")) expect((m.costHigh ?? m.readyMade?.high)!).toBeLessThanOrEqual(1500);
  });

  it("KM-08 chosen moods lift matching meals and say so; no moods changes nothing between meals", () => {
    const base = { profile, slot: "dinner" as const, dailyKcal: 2000 };
    const plain = rankMeals(MEALS, base);
    expect(plain.every((r) => r.factors.mood === 1)).toBe(true);
    const light = rankMeals(MEALS, { ...base, profile: { ...profile, moods: ["light"] } });
    const share = (rs: typeof plain) => rs.slice(0, 5).filter((r) => fitsMood(r.meal, "light", "dinner")).length;
    expect(share(light)).toBeGreaterThanOrEqual(share(plain));
    expect(light.find((r) => fitsMood(r.meal, "light", "dinner"))!.reasons).toContain("In the mood for: light");
    expect(MOODS).toHaveLength(6);
  });
});

describe("shop and your own items", () => {
  const rice: IngredientDef = {
    id: "rice-white", name: "White rice", group: "plant", per100g: { kcal: 360, protein: 7, fat: 1, carbs: 80, fibre: 1 },
    nutrition: { sourceId: "x", ref: "1", sourceName: "rice" }, contains: [], allergenStatus: "known",
    price: { unit: "1 kg", gramsPerUnit: 1000, low: 2000, high: 2600, observedOn: "2026-05-31", sourceId: "nbs" },
  };
  const ING = new Map([["rice-white", rice]]);
  const MEALS_T = new Map([["a", { slug: "a", name: "A", ingredients: [{ id: "rice-white", name: "", quantity: "", grams: 500 }] } as unknown as Meal]]);
  const plan: PlanItem[] = [{ day: 0, slot: "lunch", slug: "a", servings: 1 }];

  it("KM-09 a shop's own price is used where collected; otherwise the market price, and the estimate says which", () => {
    const market = buildShoppingList(plan, MEALS_T, ING, {});
    expect(market[0]).toMatchObject({ low: 1000, high: 1300, priceFrom: "market" });
    expect(estimateFor(market, {}).shopPriced).toBe(0);
    const shop = buildShoppingList(plan, MEALS_T, ING, {}, new Set(), {
      "rice-white": { unit: "1 kg", gramsPerUnit: 1000, low: 2800, high: 3000, observedOn: "2026-11-01", sourceId: "visit" },
    });
    expect(shop[0]).toMatchObject({ low: 1400, high: 1500, priceFrom: "shop", priceDate: "2026-11-01" });
    expect(estimateFor(shop, {})).toMatchObject({ shopPriced: 1, priced: 1 });
  });

  it("KM-10 no shop prices are invented: the shop price list starts empty", () => {
    expect(Object.values(SHOP_PRICES).every((m) => Object.keys(m ?? {}).length === 0)).toBe(true);
  });

  it("KM-11 own items: trimmed, no duplicates, length and count limits, clean ids", () => {
    const id = newOwnItemId();
    expect(id).toMatch(/^own-[a-z0-9]{1,20}$/);
    const r = addOwnItem([], "  Bread  ", id);
    expect(r).toEqual({ ok: true, items: [{ id, name: "Bread" }] });
    if (!r.ok) return;
    expect(addOwnItem(r.items, "bread", "own-b")).toMatchObject({ ok: false, error: "bread is already on your list." });
    expect(addOwnItem([], "   ", "own-c")).toMatchObject({ ok: false });
    expect(addOwnItem([], "x".repeat(61), "own-c")).toMatchObject({ ok: false });
    const fifty = Array.from({ length: 50 }, (_, i) => ({ id: `own-${i}`, name: `Item ${i}` }));
    expect(addOwnItem(fifty, "One more", "own-z")).toMatchObject({ ok: false });
    expect(cleanOwnItems([{ id: "own-a", name: "Eggs" }, { id: "bad id", name: "x" }, { id: "own-a", name: "Dup" }, "junk", null])).toEqual([{ id: "own-a", name: "Eggs" }]);
    expect(cleanOwnItems("nope")).toEqual([]);
  });

  it("KM-12 the shared list includes own items not yet ticked", () => {
    const lines = buildShoppingList(plan, MEALS_T, ING, {});
    const text = listAsText(lines, { "own-b": "bought" }, "List", [{ id: "own-a", name: "Detergent" }, { id: "own-b", name: "Bread" }]);
    expect(text).toContain("Your own items\n- Detergent");
    expect(text).not.toContain("Bread");
  });
});

describe("profile fields", () => {
  it("KM-13 kitchen, moods and shop round-trip; blank kitchen is stored as not answered", () => {
    const u = profileToUpdate({ ...profile, appliances: ["stove", "oven", "stove"], moods: ["quick", "light", "protein", "budget"], shop: "spar" });
    expect(u).toMatchObject({ appliances: ["stove", "oven"], moods: ["quick", "light", "protein"], shop: "spar" });
    expect(profileToUpdate({ ...profile, appliances: [] }).appliances).toBeNull();
    const row = { appliances: null, moods: undefined, shop: null } as unknown as ProfileRow;
    const p = rowToProfile({ ...row, diet: [], allergies: [], dislikes: [], cuisines: [] } as ProfileRow);
    expect(p).toMatchObject({ appliances: undefined, moods: [], shop: undefined });
  });
});
