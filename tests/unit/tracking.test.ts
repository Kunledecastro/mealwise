import { describe, expect, it } from "vitest";
import { addDays, currentWeight, logSnapshot, rowToLog, rowToWeight, totalsFor, weeklyTrend } from "@/lib/domain/tracking";
import type { MealLog, WeightEntry } from "@/lib/types";

const log = (o: Partial<MealLog>): MealLog => ({ id: "x", slug: "a", mealType: "lunch", portion: 1, date: "2026-10-19", kcal: 500, protein: 20, carbs: 60, fat: 15, ...o });
const w = (date: string, kg: number): WeightEntry => ({ id: date, date, kg });

describe("meal log", () => {
  it("K-01 database rows (numbers as strings) map to app entries", () => {
    expect(rowToLog({ id: "1", meal_slug: "red-red", logged_for: "2026-10-19", meal_type: "lunch", portion: "1.50", kcal: 750, protein_g: "30.0", carbs_g: "90.5", fat_g: "20.0" }))
      .toEqual({ id: "1", slug: "red-red", date: "2026-10-19", mealType: "lunch", portion: 1.5, kcal: 750, protein: 30, carbs: 90.5, fat: 20 });
    expect(rowToWeight({ id: "w", measured_on: "2026-10-19", weight_kg: "79.40" })).toEqual({ id: "w", date: "2026-10-19", kg: 79.4 });
  });
  it("K-02 the saved figures are the meal's values × portion", () => {
    expect(logSnapshot({ kcal: 600, protein: 25.3, carbs: 80, fat: 20.1 }, 0.75)).toEqual({ kcal: 450, protein_g: 19, carbs_g: 60, fat_g: 15.1 });
  });
  it("K-03 day totals use only that day's saved figures", () => {
    const logs = [log({}), log({ kcal: 250, protein: 5, carbs: 30, fat: 12 }), log({ date: "2026-10-18", kcal: 999 })];
    expect(totalsFor(logs, "2026-10-19")).toEqual({ kcal: 750, protein: 25, carbs: 90, fat: 27 });
    expect(totalsFor([], "2026-10-19")).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe("weight", () => {
  it("K-04 current weight is the latest entry, else the setup weight", () => {
    expect(currentWeight([w("2026-10-01", 80), w("2026-10-15", 79), w("2026-10-08", 81)], 85)).toBe(79);
    expect(currentWeight([], 85)).toBe(85);
    expect(currentWeight([], undefined)).toBeUndefined();
  });
  it("K-05 trend needs 3+ entries over 2+ weeks", () => {
    expect(weeklyTrend([w("2026-10-10", 80), w("2026-10-19", 79)], "2026-10-19")).toBeNull();
    expect(weeklyTrend([w("2026-10-12", 80), w("2026-10-15", 79.8), w("2026-10-19", 79)], "2026-10-19")).toBeNull();
  });
  it("K-06 trend is kg per week from a straight line, ignoring entries older than 4 weeks", () => {
    const t = weeklyTrend([w("2026-08-01", 95), w("2026-09-28", 80), w("2026-10-05", 79.5), w("2026-10-12", 79), w("2026-10-19", 78.5)], "2026-10-19")!;
    expect(t.kgPerWeek).toBeCloseTo(-0.5, 2);
    expect(t.days).toBe(21);
    expect(t.tooFast).toBe(false);
  });
  it("K-07 flags loss faster than about 1% of body weight a week", () => {
    const t = weeklyTrend([w("2026-10-01", 80), w("2026-10-08", 78.8), w("2026-10-15", 77.6)], "2026-10-19")!;
    expect(t.kgPerWeek).toBeCloseTo(-1.2, 2);
    expect(t.tooFast).toBe(true);
  });
  it("K-08 date arithmetic crosses months and years", () => {
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});
