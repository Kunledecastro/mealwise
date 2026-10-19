import type { IngredientDef } from "./types";

/** Shopping-list sections, in the order a Lagos market or supermarket trip usually goes. */
export const SECTIONS = [
  "Grains, flours and bread",
  "Yam, plantain and tubers",
  "Beans, nuts and seeds",
  "Meat, fish and eggs",
  "Vegetables and leaves",
  "Fruit",
  "Oils, dairy and seasonings",
] as const;

export type Section = (typeof SECTIONS)[number];

const BY_ID: Record<string, Section> = {};
const add = (section: Section, ids: string) => ids.split(/\s+/).filter(Boolean).forEach((id) => (BY_ID[id] = section));

add("Grains, flours and bread", "rice-white rice-ofada spaghetti bread-white oats pap kenkey gari yam-flour maize-flour maize-grits fufu");
add("Yam, plantain and tubers", "yam plantain-ripe plantain-unripe plantain-fried sweet-potato potato cocoyam maize-fresh");
add("Beans, nuts and seeds", "beans-brown beans-peeled bambara lentils peas groundnuts almonds egusi ogbono coconut coconut-milk");
add(
  "Vegetables and leaves",
  "tomato onion tatashe green-pepper scotch-bonnet garlic ginger amaranth ewedu okra garden-egg cabbage carrot green-beans lettuce cucumber bitterleaf waterleaf afang yakuwa kuka mint",
);
add("Fruit", "avocado banana pawpaw pineapple watermelon lemon-juice strawberries pineapple-juice");
add(
  "Oils, dairy and seasonings",
  "palm-oil palm-fruit vegetable-oil olive-oil butter evaporated-milk yoghurt yoghurt-sweet honey sugar salt stock-cube curry thyme mustard chilli-dried ehuru soy-sauce vinegar tomato-paste iru",
);

/** Section for an ingredient: listed above, else by food group (meat, fish, eggs). */
export function sectionFor(ing: Pick<IngredientDef, "id" | "group">): Section | "Other" {
  if (BY_ID[ing.id]) return BY_ID[ing.id];
  if (["beef_goat", "pork", "poultry", "fish", "shellfish", "egg", "other_meat"].includes(ing.group)) return "Meat, fish and eggs";
  if (ing.group === "dairy") return "Oils, dairy and seasonings";
  return "Other";
}
