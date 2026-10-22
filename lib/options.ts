import type { Activity, Appliance, Goal, Mood, Shop } from "./types";

export const DIETS = ["Vegetarian", "Vegan", "Pescatarian", "No pork", "Halal"];
export const ALLERGENS = ["Peanuts", "Tree nuts", "Shellfish", "Fish", "Eggs", "Milk", "Soy", "Wheat", "Sesame"];
export const CUISINES = ["Nigerian", "Ghanaian", "International", "Asian", "Mediterranean"];

export const GOALS: { value: Goal; title: string; body: string }[] = [
  { value: "lose", title: "Lose weight", body: "Gradually, with meals that keep you full." },
  { value: "maintain", title: "Maintain my weight", body: "Eat consistently and stay where you are." },
  { value: "gain", title: "Gain weight", body: "Add healthy energy and protein." },
];

export const ACTIVITY: { value: Activity; title: string; body: string }[] = [
  { value: "sedentary", title: "Mostly sitting", body: "Desk job, little exercise." },
  { value: "light", title: "Lightly active", body: "Some walking, light exercise 1–3 days a week." },
  { value: "moderate", title: "Active", body: "Exercise 3–5 days a week or on your feet at work." },
  { value: "very", title: "Very active", body: "Hard exercise most days or physical work." },
];

export const BUDGET_LABELS: Record<string, string> = {
  low: "Under ₦1,500",
  medium: "₦1,500–3,000",
  high: "Over ₦3,000",
};

export const PREP_LABELS: Record<string, string> = {
  "15": "15 min",
  "30": "30 min",
  "45": "45 min",
  "60": "1 hour",
  "0": "No limit",
};

export const APPLIANCES: { value: Appliance; label: string }[] = [
  { value: "stove", label: "Stove or cooker" },
  { value: "oven", label: "Oven" },
  { value: "grill", label: "Charcoal grill" },
  { value: "airfryer", label: "Air fryer" },
  { value: "blender", label: "Blender" },
];

/** Short names for sentences: "Needs an oven or a charcoal grill". */
export const APPLIANCE_NOUN: Record<Appliance, string> = {
  stove: "a stove or cooker",
  oven: "an oven",
  grill: "a charcoal grill",
  airfryer: "an air fryer",
  blender: "a blender",
};

export const MOODS: { value: Mood; label: string; body: string }[] = [
  { value: "quick", label: "Quick", body: "Ready in 30 minutes or less" },
  { value: "light", label: "Light", body: "Smaller portions of energy" },
  { value: "protein", label: "Protein-packed", body: "Plenty of protein" },
  { value: "budget", label: "Budget-friendly", body: "Under ₦1,500 a plate" },
  { value: "classic", label: "West African classics", body: "Nigerian and Ghanaian favourites" },
  { value: "different", label: "Something different", body: "International, Asian and Mediterranean" },
];

export const MAX_MOODS = 3;

export const SHOPS: { value: Shop; label: string }[] = [
  { value: "market", label: "Open market" },
  { value: "shoprite", label: "Shoprite" },
  { value: "spar", label: "Spar" },
  { value: "supermarket", label: "Another supermarket" },
];

export const SHOP_LABEL: Record<Shop, string> = { market: "Open market", shoprite: "Shoprite", spar: "Spar", supermarket: "Another supermarket" };
