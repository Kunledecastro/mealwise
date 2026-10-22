import type { Shop } from "@/lib/types";
import type { IngredientPrice } from "./types";

/**
 * Prices observed at a particular shop (DECISION_LOG 075). The shopping list uses a shop's own price
 * for an ingredient when one is listed here, and the average market price (PRICE_SHEET.csv) otherwise,
 * and says how many items used the shop's prices.
 *
 * Empty until real prices are collected: never add guessed figures. To add one, copy the ingredient's
 * id from docs/PRICE_SHEET.csv and record what the shelf showed, for example:
 *   shoprite: { "rice-white": { unit: "1 kg", gramsPerUnit: 1000, low: 2600, high: 2900,
 *     observedOn: "2026-11-02", sourceId: "owner-visit", note: "Shoprite Lekki, own-brand 5 kg bag ÷ 5" } }
 */
export const SHOP_PRICES: Partial<Record<Shop, Record<string, IngredientPrice>>> = {};
