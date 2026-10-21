import { describe, expect, it } from "vitest";
import { MEALS } from "@/catalogue";
import { EMPTY_PROFILE } from "@/lib/domain/profile";
import { dayFit, kcalBand, rankMeals, type DaySoFar } from "@/lib/domain/recommend";
import { generatePlan } from "@/lib/domain/plan";
import type { Profile } from "@/lib/types";

const profile: Profile = { ...EMPTY_PROFILE, onboarded: true, goal: "lose" };
const TARGET = 2000;

describe("fitting the next meal to what is left of today", () => {
  it("DF-01 changes nothing when there is no target or nothing logged today", () => {
    expect(dayFit("dinner", null, { kcal: 900, slots: ["lunch"] })).toBeNull();
    expect(dayFit("dinner", TARGET, undefined)).toBeNull();
    expect(dayFit("dinner", TARGET, { kcal: 0, slots: [] })).toBeNull();
    expect(kcalBand("dinner", "lose", TARGET, { kcal: 0, slots: [] })).toEqual(kcalBand("dinner", "lose", TARGET));
  });

  it("DF-02 after a heavy lunch, dinner is sized down to its fair share of what is left", () => {
    // 1,500 of 2,000 logged; 500 left shared by dinner (0.30) and snack (0.10) = 375 for dinner.
    const fit = dayFit("dinner", TARGET, { kcal: 1500, slots: ["breakfast", "lunch"] })!;
    expect(fit).toEqual({ band: [300, 431], left: 500, shift: "lighter" });
  });

  it("DF-03 after a small breakfast, lunch may be a little bigger, capped at 1.5 times its usual share", () => {
    // 200 logged; 1,800 left shared by lunch, dinner and snack (0.75): lunch gets 840 (usual 700).
    expect(dayFit("lunch", TARGET, { kcal: 200, slots: ["breakfast"] })).toEqual({ band: [672, 966], left: 1800, shift: "bigger" });
    // Tiny breakfast and lunch logged: dinner's fair share (1,425) is capped at 1.5 × 600 = 900.
    expect(dayFit("dinner", TARGET, { kcal: 100, slots: ["breakfast", "lunch"] })!.band).toEqual([720, 1035]);
    // Meal times not logged keep their share: the app doesn't assume a meal was skipped just because it wasn't logged.
    expect(dayFit("dinner", TARGET, { kcal: 150, slots: ["snack"] })!.shift).toBe("usual");
  });

  it("DF-04 over the target never means skipping: dinner keeps at least half its usual share", () => {
    const fit = dayFit("dinner", TARGET, { kcal: 2300, slots: ["breakfast", "lunch"] })!;
    expect(fit.left).toBe(-300);
    expect(fit.band).toEqual([240, 345]); // half of 600 = 300, ±
    expect(fit.shift).toBe("lighter");
  });

  it("DF-05 a meal time already logged still gets a share (a second lunch is not squeezed to nothing)", () => {
    const fit = dayFit("lunch", TARGET, { kcal: 700, slots: ["lunch"] })!;
    expect(fit.band[0]).toBeGreaterThanOrEqual(280);
  });

  it("DF-06 real catalogue: after a heavy day, dinner suggestions are lighter and say why", () => {
    const base = { profile, slot: "dinner" as const, dailyKcal: TARGET };
    const heavy: DaySoFar = { kcal: 1500, slots: ["breakfast", "lunch"] };
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const usual = rankMeals(MEALS, base).slice(0, 5).map((r) => r.meal.kcal);
    const after = rankMeals(MEALS, { ...base, daySoFar: heavy });
    expect(avg(after.slice(0, 5).map((r) => r.meal.kcal))).toBeLessThan(avg(usual));
    expect(after.some((r) => r.reasons.includes("Fits the 500 kcal left today"))).toBe(true);
    // Every reason list stays at three at most.
    for (const r of after) expect(r.reasons.length).toBeLessThanOrEqual(3);
  });

  it("DF-07 plans ignore today's log: a plan is for days ahead", () => {
    const withToday = { profile, daySoFar: { kcal: 1900, slots: ["breakfast", "lunch"] } } as unknown as { profile: Profile };
    const opts = { days: 3, includeSnacks: true, dailyKcal: TARGET };
    expect(generatePlan(MEALS, withToday, opts)).toEqual(generatePlan(MEALS, { profile }, opts));
  });
});
