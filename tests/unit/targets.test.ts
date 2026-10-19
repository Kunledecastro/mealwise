import { describe, expect, it } from "vitest";
import { bmr, calculateTarget, suggestedPortion, slotBandFromTarget, type TargetInput } from "@/lib/domain/targets";
import { kcalBand } from "@/lib/domain/recommend";
import type { Activity, Goal } from "@/lib/types";

// Synthetic people only.
const base: TargetInput = { birthYear: 1996, heightCm: 165, weightKg: 79.4, sex: "female", activity: "light", goal: "lose", year: 2026 };
const ok = (i: Partial<TargetInput>) => {
  const r = calculateTarget({ ...base, ...i });
  if (r.status !== "ok") throw new Error(`expected ok, got ${JSON.stringify(r)}`);
  return r;
};

describe("Mifflin-St Jeor", () => {
  it("T-01 male equation", () => {
    expect(bmr(80, 180, 30, "male")).toBe(800 + 1125 - 150 + 5);
  });
  it("T-02 female equation, and the midpoint when sex isn't given", () => {
    expect(bmr(80, 180, 30, "female")).toBe(1775 - 161);
    expect(bmr(80, 180, 30)).toBe(1775 - 78);
  });
});

describe("daily target", () => {
  it("T-03 worked example: 30-year-old woman, 165 cm, 79.4 kg, lightly active, losing", () => {
    const r = ok({});
    // BMR 1514 × 1.375 = 2082; deficit capped at 20% of needs (416) → 1666 → rounded to 1650.
    expect(r.breakdown.bmr).toBe(1514);
    expect(r.breakdown.tdee).toBe(2082);
    expect(r.kcal).toBe(1650);
    expect(r.breakdown.capApplied).toBe(true);
    // Protein from the weight at BMI 25 (68.1 kg) × 1.4; fat 30%; carbs the rest.
    expect(r.protein).toBe(95);
    expect(r.fat).toBe(55);
    expect(r.carbs).toBe(194);
  });
  it("T-04 sex not given uses the midpoint and says so", () => {
    const r = ok({ sex: undefined });
    expect(r.breakdown.sexMidpoint).toBe(true);
    expect(r.kcal).toBe(1750);
  });
  it("T-05 maintain has no adjustment; gain adds at most 300", () => {
    const m = ok({ goal: "maintain" });
    expect(m.breakdown.plannedAdjustment).toBe(0);
    expect(Math.abs(m.kcal - m.breakdown.tdee)).toBeLessThanOrEqual(25);
    const g = ok({ goal: "gain", weightKg: 60 });
    expect(g.kcal - g.breakdown.tdee).toBeLessThanOrEqual(325);
    expect(g.kcal).toBeGreaterThan(g.breakdown.tdee);
  });
  it("T-06 safety floor: never below 1,200 kcal (female / not given) or 1,500 (male)", () => {
    const small = ok({ birthYear: 1960, heightCm: 150, weightKg: 52, activity: "sedentary" });
    expect(small.kcal).toBe(1200);
    expect(small.breakdown.floorApplied).toBe(true);
    expect(small.notes.join(" ")).toMatch(/minimum|never suggest/);
    const man = ok({ sex: "male", birthYear: 1950, heightCm: 155, weightKg: 52, activity: "sedentary" });
    expect(man.kcal).toBe(1500);
  });
  it("T-07 floor property: across a grid of adults, no target is ever below the floor", () => {
    const acts: Activity[] = ["sedentary", "light", "moderate", "very"];
    const goals: Goal[] = ["lose", "maintain", "gain"];
    for (const sex of ["female", "male", undefined] as const)
      for (const kg of [45, 55, 70, 90, 130])
        for (const cm of [150, 165, 185])
          for (const by of [2008, 1990, 1950])
            for (const activity of acts)
              for (const goal of goals) {
                const r = calculateTarget({ birthYear: by, heightCm: cm, weightKg: kg, sex, activity, goal, year: 2026 });
                if (r.status !== "ok") continue;
                expect(r.kcal).toBeGreaterThanOrEqual(sex === "male" ? 1500 : 1200);
                // Rate cap: implied loss never faster than 1% of body weight a week, gain never above 0.5%.
                expect(r.breakdown.weeklyChangeKg).toBeGreaterThanOrEqual(-0.01 * kg - 0.01);
                if (goal === "gain") expect(r.breakdown.weeklyChangeKg).toBeLessThanOrEqual(0.005 * kg + 0.05);
                // Macros add back up to the energy target (rounding only).
                expect(Math.abs(r.protein * 4 + r.carbs * 4 + r.fat * 9 - r.kcal)).toBeLessThanOrEqual(12);
              }
  });
  it("T-08 rate cap keeps a light person's loss to about 1% a week", () => {
    const r = ok({ weightKg: 50, heightCm: 160, activity: "very" });
    expect(r.breakdown.weeklyChangeKg).toBeGreaterThanOrEqual(-0.5);
  });
});

describe("safety blocks", () => {
  it("T-09 under 18: no target", () => {
    expect(calculateTarget({ ...base, birthYear: 2010 })).toEqual({ status: "blocked", reason: "under18" });
    expect(calculateTarget({ ...base, birthYear: 2008 }).status).toBe("ok"); // turns 18 this year
  });
  it("T-10 BMI under 18.5 with a 'lose' goal: no target; maintain or gain is fine", () => {
    expect(calculateTarget({ ...base, weightKg: 48 })).toEqual({ status: "blocked", reason: "underweight-lose" });
    expect(calculateTarget({ ...base, weightKg: 48, goal: "gain" }).status).toBe("ok");
  });
  it("T-11 pregnancy, breastfeeding or a medical condition: no target, whatever else is entered", () => {
    expect(calculateTarget({ ...base, needsGuidance: true })).toEqual({ status: "blocked", reason: "guidance" });
  });
  it("T-12 missing details are listed, not guessed", () => {
    expect(calculateTarget({ year: 2026, goal: "lose" })).toEqual({ status: "incomplete", missing: ["birthYear", "heightCm", "weightKg", "activity"] });
  });
  it("T-13 warns when a weight-loss target weight is below the healthy range", () => {
    expect(ok({ targetWeightKg: 48 }).notes.join(" ")).toMatch(/below the healthy range/);
    expect(ok({ targetWeightKg: 70 }).notes.join(" ")).not.toMatch(/healthy range/);
  });
});

describe("portions and suggestions from the target", () => {
  it("T-14 suggests a portion that fits the slot's share of the day", () => {
    // Lunch is 35% of 1,650 = 578 kcal. For a 955 kcal plate that's 0.6 of a serving → ½.
    expect(suggestedPortion(955, "lunch", 1650)).toBe(0.5);
    expect(suggestedPortion(600, "lunch", 1650)).toBe(1);
    expect(suggestedPortion(300, "lunch", 2600)).toBe(1.5);
    expect(suggestedPortion(600, "lunch", null)).toBe(1);
  });
  it("T-15 recommendation bands follow the personal target when there is one", () => {
    expect(slotBandFromTarget("lunch", 2000)).toEqual([560, 805]);
    expect(kcalBand("lunch", "lose", 2000)).toEqual([560, 805]);
    expect(kcalBand("lunch", "maintain")).toEqual([450, 700]);
  });
});
