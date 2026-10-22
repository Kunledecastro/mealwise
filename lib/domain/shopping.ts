/**
 * Shopping list from a meal plan (Phase 5). Pure functions, unit-tested.
 *
 * - Every recipe quantity is stored in grams of edible food, so the same ingredient from different
 *   meals always adds up in one unit: it can't be wrongly summed across units. The list then shows
 *   each total in the way it is usually bought (1 kg, a bunch, a crate…).
 * - Quantities are multiplied by the plan's "cooking for" servings.
 * - The ₦ estimate is for the amount the plan uses, from the same dated price ranges as meal costs.
 *   You may need to buy a whole pack, so the till total can be higher; the screen says so.
 * - Optional extras are listed separately and not counted. Optional extras containing one of the
 *   user's allergens are left off the list entirely.
 */
import type { IngredientDef, IngredientPrice } from "@/catalogue/types";
import { SECTIONS, sectionFor, type Section } from "@/catalogue/shop-sections";
import type { Meal, MealType } from "../types";

export interface PlanItem {
  day: number;
  slot: MealType;
  slug: string;
  /** How many servings to cook or buy for (0.5–8). Your plate is still one serving. */
  servings: number;
}

export type Tick = "have" | "bought";

export interface ShoppingLine {
  id: string;
  name: string;
  section: Section | "Other";
  grams: number;
  /** How much to get, in buying terms, e.g. "about 1.25 kg", "2 × bunch (about 300 g)", "a little". */
  amount: string;
  /** ₦ for the amount used, or null when the ingredient has no price yet. */
  low: number | null;
  high: number | null;
  priceDate: string | null;
  /** Where the price came from: the chosen shop's own price, or the average market price. */
  priceFrom: "shop" | "market" | null;
  /** Seasonings in small amounts: listed but not priced. */
  small: boolean;
  optional: boolean;
  /** Meal names that use it. */
  meals: string[];
}

/** Something the user added to the list themselves (bread, detergent…). Not priced. */
export interface OwnItem {
  id: string;
  name: string;
}

export const MAX_OWN_ITEMS = 50;
export const OWN_NAME_MAX = 60;
const OWN_ID = /^own-[a-z0-9]{1,20}$/;

/** Keeps only well-formed own items (same rules as the database). */
export function cleanOwnItems(raw: unknown): OwnItem[] {
  if (!Array.isArray(raw)) return [];
  const out: OwnItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const { id, name } = r as Record<string, unknown>;
    if (typeof id !== "string" || !OWN_ID.test(id) || typeof name !== "string") continue;
    const n = name.trim();
    if (!n || n.length > OWN_NAME_MAX || out.some((o) => o.id === id)) continue;
    out.push({ id, name: n });
  }
  return out.slice(0, MAX_OWN_ITEMS);
}

/** Adds an item, or explains why not. Names are trimmed; a name already on the list isn't added twice. */
export function addOwnItem(items: OwnItem[], name: string, id: string): { ok: true; items: OwnItem[] } | { ok: false; error: string } {
  const n = name.trim().replace(/\s+/g, " ");
  if (!n) return { ok: false, error: "Type what you want to add." };
  if (n.length > OWN_NAME_MAX) return { ok: false, error: `Keep it under ${OWN_NAME_MAX} characters.` };
  if (items.length >= MAX_OWN_ITEMS) return { ok: false, error: `You can add up to ${MAX_OWN_ITEMS} items of your own.` };
  if (items.some((i) => i.name.toLowerCase() === n.toLowerCase())) return { ok: false, error: `${n} is already on your list.` };
  if (!OWN_ID.test(id)) return { ok: false, error: "Something went wrong. Try again." };
  return { ok: true, items: [...items, { id, name: n }] };
}

/** A fresh id for an own item, e.g. "own-k3j9x2a". */
export function newOwnItemId(): string {
  return `own-${Math.random().toString(36).slice(2, 9) || "x"}`;
}

export interface Estimate {
  low: number;
  high: number;
  /** Lines (to buy, not optional, not small) that have a price. */
  priced: number;
  /** Lines (to buy, not optional, not small) without a price. */
  unpriced: string[];
  /** Oldest price date used. */
  oldest: string | null;
  /** Priced lines that used the chosen shop's own price. */
  shopPriced: number;
}

/** Totals below this weight for an ingredient with no buying unit show as "a little". */
export const SMALL_GRAMS = 15;

type Unit = { unit: string; grams: number };

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** "about 350 g", "about 1.25 kg". */
export function formatWeightAmount(grams: number): string {
  if (grams < 1000) return `about ${Math.max(10, roundTo(grams, grams < 100 ? 10 : 50))} g`;
  return `about ${(roundTo(grams, 250) / 1000).toLocaleString("en-NG", { maximumFractionDigits: 2 })} kg`;
}

/** How much to get, in the unit people buy it in. */
export function amountFor(grams: number, unit: Unit | undefined): string {
  if (!unit) return grams < SMALL_GRAMS ? "a little" : formatWeightAmount(grams);
  const units = grams / unit.grams;
  // Sold by weight or volume: say how much to buy (as sold, e.g. bone-in), not the edible weight.
  if (/^1 kg\b/.test(unit.unit)) return formatWeightAmount(units * 1000) + (unit.grams < 1000 ? " as sold" : "");
  if (/^1 litre\b/.test(unit.unit)) {
    const ml = units * 1000;
    return ml < 1000 ? `about ${Math.max(50, roundTo(ml, 50))} ml` : `about ${(roundTo(ml, 250) / 1000).toLocaleString("en-NG", { maximumFractionDigits: 2 })} litres`;
  }
  if (units < 0.9) return `${formatWeightAmount(grams)} · sold as ${unit.unit}`;
  // Round up to whole units, allowing a small overshoot (2.05 → 2).
  const n = Math.max(1, Math.ceil(units - 0.1));
  return n === 1 ? unit.unit : `${n} × ${unit.unit.replace(/^1 /, "")}`;
}

/**
 * Builds the list. `units` are the generated buying units; a priced ingredient uses its price unit,
 * so the quantity and the price talk about the same thing.
 */
export function buildShoppingList(
  items: PlanItem[],
  meals: ReadonlyMap<string, Meal>,
  ingredients: ReadonlyMap<string, IngredientDef>,
  units: Record<string, Unit>,
  /** Optional ingredients to leave off (e.g. ones containing the user's allergens). */
  skipOptional: ReadonlySet<string> = new Set(),
  /** The chosen shop's own prices, where collected; others fall back to the market price. */
  shopPrices: Readonly<Record<string, IngredientPrice>> = {},
): ShoppingLine[] {
  const acc = new Map<string, { grams: number; optional: boolean; meals: Set<string> }>();
  for (const item of items) {
    const meal = meals.get(item.slug);
    if (!meal) continue; // a meal no longer in the catalogue
    for (const mi of meal.ingredients) {
      if (!mi.id || !mi.grams) continue;
      if (mi.optional && skipOptional.has(mi.id)) continue;
      const key = `${mi.optional ? "opt:" : ""}${mi.id}`;
      const a = acc.get(key) ?? { grams: 0, optional: !!mi.optional, meals: new Set<string>() };
      a.grams += mi.grams * item.servings;
      a.meals.add(meal.name);
      acc.set(key, a);
    }
  }
  const lines: ShoppingLine[] = [];
  for (const [key, a] of acc) {
    const id = key.replace(/^opt:/, "");
    const ing = ingredients.get(id);
    if (!ing) continue;
    // An optional pinch of something already on the list adds nothing useful.
    if (a.optional && acc.has(id) && !units[id] && !ing.price) continue;
    const price: IngredientPrice | undefined = shopPrices[id] ?? ing.price;
    const unit = price ? { unit: price.unit, grams: price.gramsPerUnit } : units[id];
    const small = !unit && a.grams < SMALL_GRAMS * Math.max(1, a.meals.size);
    lines.push({
      id,
      name: ing.name,
      section: sectionFor(ing),
      grams: Math.round(a.grams),
      amount: small ? "a little" : amountFor(a.grams, unit),
      low: price && !small ? (price.low * a.grams) / price.gramsPerUnit : null,
      high: price && !small ? (price.high * a.grams) / price.gramsPerUnit : null,
      priceDate: price?.observedOn ?? null,
      priceFrom: price ? (shopPrices[id] ? "shop" : "market") : null,
      small,
      optional: a.optional,
      meals: [...a.meals].sort(),
    });
  }
  const order = (s: string) => (SECTIONS as readonly string[]).indexOf(s) + 1 || 99;
  return lines.sort((x, y) => Number(x.optional) - Number(y.optional) || order(x.section) - order(y.section) || x.name.localeCompare(y.name));
}

/** ₦ estimate for what is still to buy: ticked "already have" lines, optional extras and small seasonings excluded. */
export function estimateFor(lines: ShoppingLine[], ticks: Readonly<Record<string, Tick>>): Estimate {
  let low = 0;
  let high = 0;
  let priced = 0;
  let shopPriced = 0;
  let oldest: string | null = null;
  const unpriced: string[] = [];
  for (const l of lines) {
    if (l.optional || l.small || ticks[l.id] === "have") continue;
    if (l.low === null || l.high === null) {
      unpriced.push(l.name);
      continue;
    }
    low += l.low;
    high += l.high;
    priced += 1;
    if (l.priceFrom === "shop") shopPriced += 1;
    if (l.priceDate && (!oldest || l.priceDate < oldest)) oldest = l.priceDate;
  }
  return { low: Math.floor(low / 100) * 100, high: Math.ceil(high / 100) * 100, priced, unpriced, oldest, shopPriced };
}

/** Plain-text list to paste into WhatsApp or notes. Skips what you already have and what you've bought. */
export function listAsText(lines: ShoppingLine[], ticks: Readonly<Record<string, Tick>>, title = "Mealwise shopping list", own: OwnItem[] = []): string {
  const out = [title];
  let section = "";
  for (const l of lines) {
    if (ticks[l.id]) continue;
    const head = l.optional ? "Optional extras" : l.section;
    if (head !== section) {
      out.push("", head);
      section = head;
    }
    out.push(`- ${l.name}: ${l.amount}`);
  }
  const mine = own.filter((o) => !ticks[o.id]);
  if (mine.length) out.push("", "Your own items", ...mine.map((o) => `- ${o.name}`));
  return out.join("\n");
}

/** Ingredient ids whose allergens (contains or may contain) clash with the user's allergy labels. */
export function allergenIngredients(ingredients: Iterable<IngredientDef>, allergies: string[], label: Record<string, string>): Set<string> {
  const out = new Set<string>();
  if (!allergies.length) return out;
  for (const ing of ingredients) {
    if ([...ing.contains, ...(ing.mayContain ?? [])].some((a) => allergies.includes(label[a])) || ing.allergenStatus === "unknown") out.add(ing.id);
  }
  return out;
}
