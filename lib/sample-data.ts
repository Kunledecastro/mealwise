/**
 * SAMPLE DATA — PROTOTYPE ONLY (Phase 1)
 *
 * Every number in this file (calories, macros, prices, weights) is an
 * illustrative placeholder so the screens can be reviewed. None of it is
 * real nutrition or price data. The real catalogue, with sourced values,
 * arrives in Phase 3.
 */
import type { Meal, MealLog, MealPhoto, Profile, WeightEntry } from "./types";

const C = {
  jollof: "#E0763A",
  whiteRice: "#F3EEDF",
  beans: "#8A5A3B",
  stew: "#B9361F",
  greens: "#3E7A3A",
  chicken: "#C98C4F",
  fish: "#9C8E7A",
  yolk: "#F2C230",
  eggWhite: "#FBF6E8",
  yam: "#EDE1B8",
  plantain: "#E9A436",
  eba: "#EBD07A",
  poundo: "#F5F0E1",
  amala: "#6B4A3A",
  egusi: "#C9B04A",
  ewedu: "#4F6B2E",
  gbegiri: "#C99B4E",
  oats: "#D9C6A0",
  banana: "#F2DD7B",
  groundnut: "#B98A55",
  pap: "#F1E6CC",
  akara: "#C27A35",
  moimoi: "#D9825B",
  corn: "#F0C53D",
  coconut: "#F7F3EA",
  broth: "#C8642E",
  pasta: "#E58A44",
  salad: "#6FA34A",
  watermelon: "#E5546A",
  pineapple: "#F5CF4A",
  pawpaw: "#F08A3C",
};

export const SAMPLE_MEALS: Meal[] = [
  {
    slug: "akara-and-pap",
    name: "Akara and pap",
    description: "Crisp bean fritters with smooth, warm pap. A classic weekend breakfast.",
    mealTypes: ["breakfast"],
    cuisine: "Nigerian",
    serving: "5 akara balls + 1 bowl pap",
    prepMinutes: 35,
    kcal: 480, protein: 18, carbs: 58, fat: 19,
    costLow: 700, costHigh: 1100,
    tags: ["Vegetarian"],
    allergens: [],
    ingredients: [
      { name: "Peeled black-eyed beans", quantity: "1 cup" },
      { name: "Onion", quantity: "½ medium" },
      { name: "Scotch bonnet pepper", quantity: "1 small" },
      { name: "Vegetable oil (for frying)", quantity: "2 tbsp absorbed" },
      { name: "Pap (ogi)", quantity: "1 bowl" },
    ],
    steps: [
      "Blend the peeled beans with onion and pepper until smooth and airy.",
      "Season with salt and whisk for a minute to trap air.",
      "Fry spoonfuls in hot oil until golden, then drain.",
      "Stir pap paste into boiling water until it thickens.",
    ],
    plate: [
      { label: "Akara", color: C.akara, share: 0.55, texture: "balls" },
      { label: "Pap", color: C.pap, share: 0.45, texture: "smooth" },
    ],
  },
  {
    slug: "oats-banana-groundnuts",
    name: "Oats with banana and groundnuts",
    description: "Creamy oats topped with sliced banana and a handful of roasted groundnuts.",
    mealTypes: ["breakfast"],
    cuisine: "International",
    serving: "1 bowl",
    prepMinutes: 10,
    kcal: 390, protein: 13, carbs: 56, fat: 13,
    costLow: 600, costHigh: 900,
    tags: ["Vegetarian", "Quick"],
    allergens: ["Peanuts", "Milk"],
    ingredients: [
      { name: "Rolled oats", quantity: "½ cup" },
      { name: "Milk or water", quantity: "1 cup" },
      { name: "Banana", quantity: "1 medium" },
      { name: "Roasted groundnuts", quantity: "1 small handful" },
    ],
    steps: [
      "Simmer oats in milk or water for 4–5 minutes, stirring.",
      "Top with sliced banana and groundnuts.",
    ],
    plate: [
      { label: "Oats", color: C.oats, share: 0.6, texture: "grains" },
      { label: "Banana", color: C.banana, share: 0.25, texture: "slices" },
      { label: "Groundnuts", color: C.groundnut, share: 0.15, texture: "balls" },
    ],
  },
  {
    slug: "yam-and-egg-sauce",
    name: "Boiled yam with egg sauce",
    description: "Soft boiled yam with a tomato and pepper egg sauce.",
    mealTypes: ["breakfast", "dinner"],
    cuisine: "Nigerian",
    serving: "3 slices yam + 2 eggs",
    prepMinutes: 30,
    kcal: 520, protein: 19, carbs: 70, fat: 18,
    costLow: 1200, costHigh: 1800,
    tags: ["Vegetarian"],
    allergens: ["Eggs"],
    ingredients: [
      { name: "Yam", quantity: "3 medium slices" },
      { name: "Eggs", quantity: "2" },
      { name: "Tomatoes", quantity: "2" },
      { name: "Onion and pepper", quantity: "to taste" },
      { name: "Vegetable oil", quantity: "1 tbsp" },
    ],
    steps: [
      "Peel and boil yam in salted water until tender.",
      "Sauté chopped onion, tomato and pepper in oil.",
      "Add beaten eggs and stir gently until just set.",
    ],
    plate: [
      { label: "Yam", color: C.yam, share: 0.55, texture: "chunks" },
      { label: "Egg sauce", color: C.yolk, share: 0.45, texture: "chunks" },
    ],
  },
  {
    slug: "plantain-egg-frittata",
    name: "Plantain and egg frittata",
    description: "Ripe plantain baked into a fluffy pepper-and-onion omelette.",
    mealTypes: ["breakfast"],
    cuisine: "Nigerian",
    serving: "1 large wedge",
    prepMinutes: 25,
    kcal: 430, protein: 17, carbs: 45, fat: 20,
    costLow: 1000, costHigh: 1500,
    tags: ["Vegetarian", "High protein"],
    allergens: ["Eggs"],
    ingredients: [
      { name: "Ripe plantain", quantity: "1 medium" },
      { name: "Eggs", quantity: "3" },
      { name: "Bell pepper and onion", quantity: "½ cup chopped" },
    ],
    steps: [
      "Slice plantain and pan-fry lightly until golden.",
      "Pour beaten eggs with peppers and onion over the plantain.",
      "Cook on low heat with a lid until set.",
    ],
    plate: [
      { label: "Plantain", color: C.plantain, share: 0.5, texture: "slices" },
      { label: "Egg", color: C.yolk, share: 0.5, texture: "smooth" },
    ],
  },
  {
    slug: "jollof-rice-chicken",
    name: "Jollof rice with chicken",
    description: "Smoky party-style jollof with grilled chicken and a little salad.",
    mealTypes: ["lunch", "dinner"],
    cuisine: "Nigerian",
    serving: "1 plate (about 1½ cups rice + 1 chicken thigh)",
    prepMinutes: 60,
    kcal: 680, protein: 34, carbs: 82, fat: 22,
    costLow: 1800, costHigh: 2800,
    tags: ["High protein"],
    allergens: [],
    ingredients: [
      { name: "Long-grain parboiled rice", quantity: "¾ cup uncooked" },
      { name: "Tomato and pepper base", quantity: "½ cup" },
      { name: "Chicken thigh", quantity: "1" },
      { name: "Vegetable oil", quantity: "1 tbsp" },
      { name: "Cucumber and tomato salad", quantity: "small side" },
    ],
    steps: [
      "Fry the tomato–pepper base in oil until it darkens and the oil rises.",
      "Add washed rice, stock and seasoning; cover and cook on low heat.",
      "Season and grill the chicken until cooked through.",
      "Serve with a small cucumber–tomato salad.",
    ],
    plate: [
      { label: "Jollof rice", color: C.jollof, share: 0.55, texture: "grains" },
      { label: "Chicken", color: C.chicken, share: 0.3, texture: "chunks" },
      { label: "Salad", color: C.salad, share: 0.15, texture: "leafy" },
    ],
  },
  {
    slug: "rice-beans-plantain",
    name: "Rice and beans with fried plantain",
    description: "Comforting rice and beans with a little stew and sweet fried plantain.",
    mealTypes: ["lunch", "dinner"],
    cuisine: "Nigerian",
    serving: "1 plate (about 1½ cups) + ½ plantain",
    prepMinutes: 70,
    kcal: 640, protein: 21, carbs: 104, fat: 15,
    costLow: 1200, costHigh: 1900,
    tags: ["Vegetarian", "High fibre"],
    allergens: [],
    ingredients: [
      { name: "Rice", quantity: "½ cup uncooked" },
      { name: "Brown beans", quantity: "⅓ cup uncooked" },
      { name: "Tomato stew", quantity: "¼ cup" },
      { name: "Ripe plantain", quantity: "½" },
      { name: "Vegetable oil (for frying)", quantity: "1 tbsp absorbed" },
    ],
    steps: [
      "Cook beans until soft, then add rice and cook together.",
      "Fry sliced ripe plantain until golden and drain.",
      "Serve the rice and beans with a spoon of stew and the plantain.",
    ],
    plate: [
      { label: "Rice and beans", color: C.beans, share: 0.55, texture: "grains" },
      { label: "Stew", color: C.stew, share: 0.2, texture: "smooth" },
      { label: "Plantain", color: C.plantain, share: 0.25, texture: "slices" },
    ],
  },
  {
    slug: "amala-ewedu-gbegiri",
    name: "Amala with ewedu and gbegiri",
    description: "Soft amala with silky ewedu, bean soup and a little stew.",
    mealTypes: ["lunch", "dinner"],
    cuisine: "Nigerian – Yoruba",
    serving: "1 medium wrap amala + soups",
    prepMinutes: 50,
    kcal: 610, protein: 21, carbs: 95, fat: 15,
    costLow: 1300, costHigh: 2000,
    tags: ["Vegetarian option"],
    allergens: [],
    ingredients: [
      { name: "Yam flour (elubo)", quantity: "1 cup" },
      { name: "Jute leaves (ewedu)", quantity: "1 bunch" },
      { name: "Peeled beans for gbegiri", quantity: "½ cup" },
      { name: "Palm oil", quantity: "1 tbsp" },
    ],
    steps: [
      "Stir yam flour into boiling water until smooth and stretchy.",
      "Boil ewedu leaves and whisk with a little locust bean.",
      "Cook and mash beans with palm oil and seasoning for gbegiri.",
    ],
    plate: [
      { label: "Amala", color: C.amala, share: 0.45, texture: "smooth" },
      { label: "Ewedu", color: C.ewedu, share: 0.3, texture: "leafy" },
      { label: "Gbegiri", color: C.gbegiri, share: 0.25, texture: "smooth" },
    ],
  },
  {
    slug: "egusi-pounded-yam",
    name: "Egusi soup with pounded yam",
    description: "Rich melon-seed soup with leafy greens and assorted protein.",
    mealTypes: ["lunch", "dinner"],
    cuisine: "Nigerian",
    serving: "1 medium wrap + 1 cup soup",
    prepMinutes: 75,
    kcal: 820, protein: 30, carbs: 88, fat: 38,
    costLow: 2200, costHigh: 3500,
    tags: [],
    allergens: [],
    ingredients: [
      { name: "Ground egusi", quantity: "½ cup" },
      { name: "Spinach or bitter leaf", quantity: "2 cups" },
      { name: "Beef or goat meat", quantity: "2 pieces" },
      { name: "Palm oil", quantity: "2 tbsp" },
      { name: "Pounded yam", quantity: "1 medium wrap" },
    ],
    steps: [
      "Fry egusi in palm oil until it clumps, then add stock.",
      "Add cooked meat and simmer, then stir in the greens.",
      "Serve with pounded yam.",
    ],
    plate: [
      { label: "Pounded yam", color: C.poundo, share: 0.45, texture: "smooth" },
      { label: "Egusi", color: C.egusi, share: 0.4, texture: "grains" },
      { label: "Greens", color: C.greens, share: 0.15, texture: "leafy" },
    ],
  },
  {
    slug: "efo-riro-eba",
    name: "Efo riro with eba",
    description: "Spinach stewed with peppers and fish, served with eba.",
    mealTypes: ["lunch", "dinner"],
    cuisine: "Nigerian – Yoruba",
    serving: "1 small wrap eba + 1 cup efo",
    prepMinutes: 40,
    kcal: 590, protein: 25, carbs: 72, fat: 22,
    costLow: 1400, costHigh: 2200,
    tags: ["Pescatarian"],
    allergens: ["Fish", "Shellfish"],
    ingredients: [
      { name: "Spinach (efo tete)", quantity: "3 cups" },
      { name: "Pepper base", quantity: "½ cup" },
      { name: "Smoked fish and crayfish", quantity: "small portion" },
      { name: "Garri", quantity: "¾ cup" },
    ],
    steps: [
      "Fry the pepper base in a little palm oil.",
      "Add fish, crayfish and seasoning, then fold in spinach.",
      "Stir garri into hot water to make eba.",
    ],
    plate: [
      { label: "Eba", color: C.eba, share: 0.45, texture: "smooth" },
      { label: "Efo riro", color: C.greens, share: 0.4, texture: "leafy" },
      { label: "Fish", color: C.fish, share: 0.15, texture: "chunks" },
    ],
  },
  {
    slug: "fish-pepper-soup",
    name: "Fish pepper soup",
    description: "Light, spicy broth with catfish and fragrant pepper-soup spice.",
    mealTypes: ["dinner"],
    cuisine: "Nigerian",
    serving: "1 large bowl",
    prepMinutes: 35,
    kcal: 340, protein: 36, carbs: 8, fat: 17,
    costLow: 2000, costHigh: 3200,
    tags: ["High protein", "Pescatarian", "Lighter"],
    allergens: ["Fish"],
    ingredients: [
      { name: "Catfish", quantity: "2 steaks" },
      { name: "Pepper soup spice", quantity: "1 tbsp" },
      { name: "Scent leaf", quantity: "a few leaves" },
    ],
    steps: [
      "Simmer fish gently with spice, pepper and seasoning.",
      "Add scent leaf at the end and serve hot.",
    ],
    plate: [
      { label: "Broth", color: C.broth, share: 0.6, texture: "smooth" },
      { label: "Catfish", color: C.fish, share: 0.3, texture: "chunks" },
      { label: "Scent leaf", color: C.greens, share: 0.1, texture: "leafy" },
    ],
  },
  {
    slug: "beans-and-plantain",
    name: "Beans porridge with plantain",
    description: "Slow-cooked beans in palm oil sauce with boiled ripe plantain.",
    mealTypes: ["lunch", "dinner"],
    cuisine: "Nigerian",
    serving: "1½ cups beans + 1 plantain",
    prepMinutes: 80,
    kcal: 600, protein: 24, carbs: 92, fat: 15,
    costLow: 1000, costHigh: 1600,
    tags: ["Vegetarian", "High fibre"],
    allergens: [],
    ingredients: [
      { name: "Honey beans (oloyin)", quantity: "¾ cup uncooked" },
      { name: "Ripe plantain", quantity: "1" },
      { name: "Palm oil", quantity: "1 tbsp" },
      { name: "Onion and pepper", quantity: "to taste" },
    ],
    steps: [
      "Boil beans until very soft.",
      "Add palm oil, onion, pepper and seasoning; simmer and mash slightly.",
      "Boil the plantain and serve on the side.",
    ],
    plate: [
      { label: "Beans", color: C.beans, share: 0.6, texture: "balls" },
      { label: "Plantain", color: C.plantain, share: 0.4, texture: "slices" },
    ],
  },
  {
    slug: "chicken-salad",
    name: "Grilled chicken salad",
    description: "Crunchy greens, sweetcorn and grilled chicken with a light dressing.",
    mealTypes: ["lunch", "dinner"],
    cuisine: "International",
    serving: "1 large bowl",
    prepMinutes: 25,
    kcal: 420, protein: 38, carbs: 22, fat: 19,
    costLow: 2000, costHigh: 3000,
    tags: ["High protein", "Lighter"],
    allergens: [],
    ingredients: [
      { name: "Chicken breast", quantity: "1" },
      { name: "Lettuce and cabbage", quantity: "2 cups" },
      { name: "Sweetcorn", quantity: "¼ cup" },
      { name: "Olive oil dressing", quantity: "1 tbsp" },
    ],
    steps: [
      "Season and grill the chicken, then slice.",
      "Toss greens and corn with the dressing; top with chicken.",
    ],
    plate: [
      { label: "Greens", color: C.salad, share: 0.5, texture: "leafy" },
      { label: "Chicken", color: C.chicken, share: 0.35, texture: "chunks" },
      { label: "Corn", color: C.corn, share: 0.15, texture: "balls" },
    ],
  },
  {
    slug: "spaghetti-jollof",
    name: "Jollof spaghetti with egg",
    description: "One-pot spaghetti in jollof sauce, finished with a boiled egg.",
    mealTypes: ["dinner"],
    cuisine: "Nigerian",
    serving: "1 plate",
    prepMinutes: 30,
    kcal: 560, protein: 20, carbs: 80, fat: 17,
    costLow: 900, costHigh: 1400,
    tags: ["Quick"],
    allergens: ["Wheat", "Eggs"],
    ingredients: [
      { name: "Spaghetti", quantity: "100 g" },
      { name: "Tomato and pepper base", quantity: "½ cup" },
      { name: "Egg", quantity: "1" },
    ],
    steps: [
      "Fry the tomato base, add water and seasoning, and bring to a boil.",
      "Add spaghetti and cook until the sauce is absorbed.",
      "Serve with a boiled egg.",
    ],
    plate: [
      { label: "Spaghetti", color: C.pasta, share: 0.75, texture: "grains" },
      { label: "Egg", color: C.eggWhite, share: 0.25, texture: "smooth" },
    ],
  },
  {
    slug: "roasted-corn-coconut",
    name: "Roasted corn and coconut",
    description: "Street-side favourite: charred corn with fresh coconut pieces.",
    mealTypes: ["snack"],
    cuisine: "Nigerian",
    serving: "1 cob + a few coconut pieces",
    prepMinutes: 20,
    kcal: 260, protein: 6, carbs: 34, fat: 12,
    costLow: 400, costHigh: 700,
    tags: ["Vegan"],
    allergens: [],
    ingredients: [
      { name: "Fresh corn", quantity: "1 cob" },
      { name: "Fresh coconut", quantity: "3–4 pieces" },
    ],
    steps: ["Roast the corn over a grill or open flame, turning often.", "Serve with coconut."],
    plate: [
      { label: "Corn", color: C.corn, share: 0.65, texture: "balls" },
      { label: "Coconut", color: C.coconut, share: 0.35, texture: "chunks" },
    ],
  },
  {
    slug: "plantain-groundnuts",
    name: "Fried plantain with groundnuts",
    description: "Spiced fried plantain cubes with a handful of roasted groundnuts.",
    mealTypes: ["snack"],
    cuisine: "West African",
    serving: "1 small bowl",
    prepMinutes: 15,
    kcal: 320, protein: 7, carbs: 40, fat: 16,
    costLow: 500, costHigh: 800,
    tags: ["Vegan"],
    allergens: ["Peanuts"],
    ingredients: [
      { name: "Ripe plantain", quantity: "1 small" },
      { name: "Ginger and pepper", quantity: "a pinch" },
      { name: "Vegetable oil (for frying)", quantity: "1 tbsp absorbed" },
      { name: "Roasted groundnuts", quantity: "1 small handful" },
    ],
    steps: [
      "Cube the plantain and toss with ginger, pepper and a little salt.",
      "Fry until golden and drain.",
      "Serve with roasted groundnuts.",
    ],
    plate: [
      { label: "Plantain", color: C.plantain, share: 0.65, texture: "chunks" },
      { label: "Groundnuts", color: C.groundnut, share: 0.35, texture: "balls" },
    ],
  },
  {
    slug: "fruit-bowl",
    name: "Fresh fruit bowl",
    description: "Pineapple, watermelon and pawpaw — whatever is in season.",
    mealTypes: ["snack", "breakfast"],
    cuisine: "Nigerian",
    serving: "1 bowl (about 2 cups)",
    prepMinutes: 10,
    kcal: 150, protein: 2, carbs: 36, fat: 1,
    costLow: 600, costHigh: 1000,
    tags: ["Vegan", "Lighter"],
    allergens: [],
    ingredients: [
      { name: "Pineapple", quantity: "¾ cup" },
      { name: "Watermelon", quantity: "¾ cup" },
      { name: "Pawpaw", quantity: "½ cup" },
    ],
    steps: ["Wash, peel and cut the fruit into bite-size pieces."],
    plate: [
      { label: "Watermelon", color: C.watermelon, share: 0.35, texture: "chunks" },
      { label: "Pineapple", color: C.pineapple, share: 0.35, texture: "chunks" },
      { label: "Pawpaw", color: C.pawpaw, share: 0.3, texture: "chunks" },
    ],
  },
  {
    slug: "moi-moi-pap",
    name: "Moi moi with custard",
    description: "Steamed bean pudding with egg, served with warm custard.",
    mealTypes: ["breakfast", "snack"],
    cuisine: "Nigerian",
    serving: "1 wrap moi moi + 1 bowl custard",
    prepMinutes: 70,
    kcal: 410, protein: 17, carbs: 50, fat: 15,
    costLow: 700, costHigh: 1200,
    tags: ["Vegetarian"],
    allergens: ["Eggs", "Milk"],
    ingredients: [
      { name: "Peeled beans", quantity: "½ cup" },
      { name: "Pepper and onion", quantity: "to taste" },
      { name: "Egg", quantity: "½" },
      { name: "Custard powder and milk", quantity: "1 bowl" },
    ],
    steps: [
      "Blend beans with pepper and onion; season and add a little oil.",
      "Pour into wraps or tins with egg and steam for 45–60 minutes.",
      "Make custard with hot water and a little milk.",
    ],
    plate: [
      { label: "Moi moi", color: C.moimoi, share: 0.55, texture: "smooth" },
      { label: "Custard", color: C.yolk, share: 0.45, texture: "smooth" },
    ],
  },
];

/**
 * Real photos, hot-linked from Pexels and Unsplash (both free for commercial use; credit given anyway).
 * Each was matched to its dish from the source's own description. Dishes not listed here have no
 * verified photo yet and fall back to the plate illustration.
 */
const PHOTOS: Record<string, MealPhoto> = {
  "jollof-rice-chicken": {
    src: "https://images.pexels.com/photos/40262791/pexels-photo-40262791.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Grilled chicken with jollof rice and sautéed vegetables on a white plate",
    credit: "Mohammad Fahim", source: "Pexels",
    page: "https://www.pexels.com/photo/grilled-chicken-with-jollof-rice-and-vegetables-40262791/",
  },
  "akara-and-pap": {
    src: "https://images.pexels.com/photos/37624176/pexels-photo-37624176.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Akara, pap, bread and egg in a takeaway box",
    credit: "Tochukwu Ekeh", source: "Pexels",
    page: "https://www.pexels.com/photo/delicious-nigerian-breakfast-with-akara-and-pap-37624176/",
  },
  "yam-and-egg-sauce": {
    src: "https://images.pexels.com/photos/32634871/pexels-photo-32634871.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Nigerian breakfast of yam with egg sauce",
    credit: "mk_photoz", source: "Pexels",
    page: "https://www.pexels.com/photo/nigerian-breakfast-with-yam-and-egg-dish-32634871/",
  },
  "egusi-pounded-yam": {
    src: "https://images.pexels.com/photos/35490114/pexels-photo-35490114.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Egusi soup with red peppers and herbs in a red bowl",
    credit: "Tim Yisa", source: "Pexels",
    page: "https://www.pexels.com/photo/spicy-nigerian-egusi-soup-in-red-bowl-35490114/",
  },
  "efo-riro-eba": {
    src: "https://images.pexels.com/photos/37648017/pexels-photo-37648017.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Spinach stew with meat in a red pepper sauce, served in a white bowl",
    credit: "Tochukwu Ekeh", source: "Pexels",
    page: "https://www.pexels.com/photo/authentic-african-stew-with-spinach-and-meat-37648017/",
  },
  "roasted-corn-coconut": {
    src: "https://images.pexels.com/photos/11572454/pexels-photo-11572454.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Charred corn being roasted by a street vendor in Lagos",
    credit: "Kayode Balogun", source: "Pexels",
    page: "https://www.pexels.com/photo/a-person-holding-a-corn-11572454/",
  },
  "rice-beans-plantain": {
    src: "https://images.pexels.com/photos/27556972/pexels-photo-27556972.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Rice and beans with fried plantain on a white plate",
    credit: "Snappr", source: "Pexels",
    page: "https://www.pexels.com/photo/traditional-caribbean-cuisine-27556972/",
  },
  "plantain-groundnuts": {
    src: "https://images.pexels.com/photos/35136066/pexels-photo-35136066.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Fried plantain cubes with peanuts in a white bowl",
    credit: "ghanawithophelia", source: "Pexels",
    page: "https://www.pexels.com/photo/fried-plantains-with-peanuts-in-a-bowl-35136066/",
  },
  "fruit-bowl": {
    src: "https://images.unsplash.com/photo-1564093497595-593b96d80180?auto=format&fit=crop&w=1600&q=75",
    alt: "Fresh fruit salad on a white plate",
    credit: "Rebecca Hansen", source: "Unsplash",
    page: "https://unsplash.com/photos/fruit-salad-on-white-plate-_WpB9l8_Kn4",
  },
  "chicken-salad": {
    src: "https://images.unsplash.com/photo-1761315600943-d8a5bb0c499f?auto=format&fit=crop&w=1600&q=75",
    alt: "Grilled chicken salad with avocado and tomatoes",
    credit: "Ani Augustine", source: "Unsplash",
    page: "https://unsplash.com/photos/grilled-chicken-salad-with-avocado-and-tomatoes-9TogNg01qzI",
  },
};

for (const m of SAMPLE_MEALS) if (PHOTOS[m.slug]) m.photo = PHOTOS[m.slug];

/** Every photo used, for the credits list. */
export const PHOTO_CREDITS = SAMPLE_MEALS.filter((m) => m.photo).map((m) => ({ meal: m.name, ...m.photo! }));

export const SAMPLE_PROFILE: Profile = {
  displayName: "Amaka",
  birthYear: 1996,
  heightCm: 165,
  weightKg: 79.4,
  units: "metric",
  goal: "lose",
  targetWeightKg: 74,
  activity: "light",
  diet: [],
  allergies: [],
  dislikes: ["Okra"],
  cuisines: ["Nigerian", "International"],
  budget: "medium",
  maxPrepMinutes: 45,
};

/** SAMPLE daily target shown in the prototype. Real calculation arrives in Phase 4. */
export const SAMPLE_DAILY_TARGET = { kcal: 1850, protein: 100, carbs: 210, fat: 62 };

export function sampleWeights(today: Date): WeightEntry[] {
  const values = [82.1, 81.6, 81.8, 81.0, 80.6, 80.7, 80.0, 79.4];
  return values.map((kg, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (values.length - 1 - i) * 7);
    return { id: `sample-w${i}`, date: toISODate(d), kg };
  });
}

export function sampleLogs(today: Date): MealLog[] {
  const date = toISODate(today);
  return [
    { id: "sample-l1", slug: "oats-banana-groundnuts", mealType: "breakfast", portion: 1, date },
    { id: "sample-l2", slug: "fruit-bowl", mealType: "snack", portion: 1, date },
  ];
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD as a local calendar date (avoids timezone shifts). */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
