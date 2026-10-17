/** Weight unit helpers. Weights are always stored in kilograms. */

export const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function round(value: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export type WeightUnit = "kg" | "lb";

export function formatWeight(kg: number, unit: WeightUnit): string {
  const v = unit === "kg" ? kg : kgToLb(kg);
  return `${round(v, 1).toFixed(1)} ${unit}`;
}

/** Sensible bounds for adult body weight entries. */
export const MIN_KG = 20;
export const MAX_KG = 400;

export type ParseResult = { ok: true; kg: number } | { ok: false; error: string };

/**
 * Parse a user-typed weight in the given unit and validate it.
 * Returns the value converted to kilograms.
 */
export function parseWeight(input: string, unit: WeightUnit): ParseResult {
  const trimmed = input.trim().replace(",", ".");
  if (trimmed === "") return { ok: false, error: "Enter your weight." };
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return { ok: false, error: "Use numbers only, for example 72.5." };
  const value = Number(trimmed);
  const kg = unit === "kg" ? value : lbToKg(value);
  if (kg < MIN_KG || kg > MAX_KG) {
    const lo = unit === "kg" ? MIN_KG : Math.ceil(kgToLb(MIN_KG));
    const hi = unit === "kg" ? MAX_KG : Math.floor(kgToLb(MAX_KG));
    return { ok: false, error: `Enter a weight between ${lo} and ${hi} ${unit}.` };
  }
  return { ok: true, kg: round(kg, 2) };
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return round((feet * 12 + inches) * 2.54, 1);
}
