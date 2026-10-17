import { describe, expect, it } from "vitest";
import { cmToFeetInches, feetInchesToCm, formatWeight, kgToLb, lbToKg, parseWeight } from "@/lib/domain/units";

describe("weight conversion", () => {
  it("converts kg to lb and back within 0.01", () => {
    for (const kg of [20, 45.5, 72.3, 100, 180.25, 400]) {
      expect(Math.abs(lbToKg(kgToLb(kg)) - kg)).toBeLessThan(0.01);
    }
  });

  it("uses the exact international pound", () => {
    expect(lbToKg(1)).toBeCloseTo(0.45359237, 8);
    expect(kgToLb(100)).toBeCloseTo(220.462, 3);
  });

  it("formats to one decimal place", () => {
    expect(formatWeight(79.4, "kg")).toBe("79.4 kg");
    expect(formatWeight(79.4, "lb")).toBe("175.0 lb");
  });
});

describe("parseWeight", () => {
  it("accepts valid kg and lb values", () => {
    expect(parseWeight("72.5", "kg")).toEqual({ ok: true, kg: 72.5 });
    const lb = parseWeight("160", "lb");
    expect(lb.ok && lb.kg).toBeCloseTo(72.57, 2);
  });

  it("accepts a comma as decimal separator", () => {
    expect(parseWeight("72,5", "kg")).toEqual({ ok: true, kg: 72.5 });
  });

  it("rejects empty, non-numeric, negative and out-of-range values", () => {
    expect(parseWeight("", "kg").ok).toBe(false);
    expect(parseWeight("abc", "kg").ok).toBe(false);
    expect(parseWeight("-70", "kg").ok).toBe(false);
    expect(parseWeight("12", "kg").ok).toBe(false);
    expect(parseWeight("401", "kg").ok).toBe(false);
    expect(parseWeight("30", "lb").ok).toBe(false);
  });

  it("gives a helpful message in the user's unit", () => {
    const r = parseWeight("1000", "lb");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/lb/);
  });
});

describe("height conversion", () => {
  it("round-trips feet and inches", () => {
    expect(feetInchesToCm(5, 5)).toBeCloseTo(165.1, 1);
    expect(cmToFeetInches(165.1)).toEqual({ feet: 5, inches: 5 });
  });

  it("never returns 12 inches", () => {
    expect(cmToFeetInches(182.6)).toEqual({ feet: 6, inches: 0 });
  });
});
