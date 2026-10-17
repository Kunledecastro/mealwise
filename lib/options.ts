import type { Activity, Goal } from "./types";

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
