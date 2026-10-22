import type { Appliance } from "@/lib/types";

/**
 * Equipment each meal needs (DECISION_LOG 072). Each inner list is a choice: one of them is enough.
 * Most meals need only a stove or cooker, so only exceptions are listed; every other meal gets STOVE.
 *
 * Blending peppers or beans is NOT treated as needing a blender: most markets grind them for a small
 * fee, and a grinding stone works too. Only the smoothie truly needs one. Test D-15 checks that any
 * meal whose steps mention an oven, charcoal, a grill or a blender is listed here on purpose.
 */
export const STOVE: Appliance[][] = [["stove"]];

export const EQUIPMENT: Record<string, Appliance[][]> = {
  // No cooking at all.
  "fruit-bowl": [],
  "garden-eggs-groundnuts": [],
  "yoghurt-banana": [],
  "banana-groundnuts": [],
  "veg-sticks-yoghurt-dip": [],
  "herbed-cucumber-salad": [],
  // Needs a blender.
  "fruit-smoothie": [["blender"]],
  // Roasting over a flame or charcoal.
  "roasted-corn-coconut": [["stove", "grill"]],
  "boli": [["grill", "oven", "airfryer"]],
  "grilled-tilapia-boli": [["grill", "oven", "airfryer"]],
  "grilled-chicken-potatoes": [["stove"], ["grill", "oven", "airfryer"]],
  // "Grill or pan-roast", "grill or fry", "grill the chicken": a pan on the stove does it.
  "suya-beef-salad": [["stove", "grill"]],
  "jollof-rice-chicken": STOVE,
  "white-rice-fish-stew": STOVE,
  "fried-rice-chicken": STOVE,
  "chicken-salad": STOVE,
  // Blended peppers, beans or coconut: market grinding or a grater works (see above).
  "akara-and-pap": STOVE,
  "moi-moi-pap": STOVE,
  "moi-moi": STOVE,
  "bread-and-akara": STOVE,
  "coconut-rice": STOVE,
  "afang-soup-eba": STOVE,
};

export const equipmentFor = (slug: string): Appliance[][] => EQUIPMENT[slug] ?? STOVE;
