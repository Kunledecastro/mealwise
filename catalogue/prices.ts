import type { IngredientPrice } from "./types";

/**
 * ₦ price ranges per ingredient (DECISION_LOG 034). GENERATED from docs/PRICE_SHEET.csv by
 * scripts/catalogue/price_sheet.py — edit the sheet, not this file.
 * Until an ingredient has a price, meals using it show "Price not yet estimated".
 */
/* PRICES_JSON {} */
export const PRICES: Record<string, IngredientPrice> = {};
