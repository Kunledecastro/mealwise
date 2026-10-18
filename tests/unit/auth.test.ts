import { beforeAll, describe, expect, it, vi } from "vitest";
import { friendlyError } from "@/lib/domain/auth-errors";
import { EMPTY_PROFILE, profileToUpdate, rowToProfile, type ProfileRow } from "@/lib/domain/profile";
import { safeNext } from "@/lib/auth";
import type { Profile } from "@/lib/types";

// Synthetic data only.
const row: ProfileRow = {
  id: "11111111-1111-1111-1111-111111111111",
  display_name: "Test Ada",
  birth_year: 1990,
  height_cm: "170.5",
  current_weight_kg: "82.40",
  target_weight_kg: null,
  units: "metric",
  goal: "lose",
  activity_level: "light",
  diet: ["vegetarian"],
  allergies: ["peanuts"],
  dislikes: ["okra"],
  cuisines: ["nigerian"],
  budget_band: "low",
  max_prep_minutes: 30,
  consent_version: "2026-10-18",
  consent_at: "2026-10-18T07:00:00Z",
  onboarding_completed_at: null,
  created_at: "2026-10-18T07:00:00Z",
  updated_at: "2026-10-18T07:00:00Z",
};

describe("profile mapping", () => {
  it("U2-01 converts database numeric strings to numbers and nulls to undefined", () => {
    const p = rowToProfile(row);
    expect(p.heightCm).toBe(170.5);
    expect(p.weightKg).toBe(82.4);
    expect(p.targetWeightKg).toBeUndefined();
    expect(p.displayName).toBe("Test Ada");
    expect(p.onboarded).toBe(false);
  });

  it("U2-02 marks onboarded when setup has been completed", () => {
    expect(rowToProfile({ ...row, onboarding_completed_at: "2026-10-18T08:00:00Z" }).onboarded).toBe(true);
  });

  it("U2-03 a fresh row maps to an empty profile with safe defaults", () => {
    const fresh: ProfileRow = { ...row, display_name: null, birth_year: null, height_cm: null, current_weight_kg: null,
      goal: null, activity_level: null, diet: [], allergies: [], dislikes: [], cuisines: [], budget_band: null, max_prep_minutes: null };
    const p = rowToProfile(fresh);
    expect(p.displayName).toBe("");
    expect(p.goal).toBeUndefined();
    expect(p.diet).toEqual([]);
  });

  it("U2-04 rejects non-numeric values instead of producing NaN", () => {
    expect(rowToProfile({ ...row, height_cm: "abc" }).heightCm).toBeUndefined();
  });

  it("U2-05 builds an update with trimmed, de-duplicated lists and nulls for cleared values", () => {
    const p: Profile = { ...EMPTY_PROFILE, displayName: "  Ada  ", allergies: [" peanuts", "peanuts", ""], dislikes: [" okra "] };
    const u = profileToUpdate(p);
    expect(u.display_name).toBe("Ada");
    expect(u.allergies).toEqual(["peanuts"]);
    expect(u.dislikes).toEqual(["okra"]);
    expect(u.goal).toBeNull();
    expect(u.current_weight_kg).toBeNull();
    expect(u.onboarding_completed_at).toBeUndefined();
  });

  it("U2-06 limits dislikes to 30 items of at most 40 characters (matches the database rule)", () => {
    const many = Array.from({ length: 35 }, (_, i) => `food-${i}-${"x".repeat(50)}`);
    const u = profileToUpdate({ ...EMPTY_PROFILE, dislikes: many });
    expect(u.dislikes).toHaveLength(30);
    expect(u.dislikes!.every((d) => d.length <= 40)).toBe(true);
  });

  it("U2-07 never sends columns the database owns (id, consent, timestamps)", () => {
    const u = profileToUpdate(rowToProfile(row), { completeOnboarding: true });
    expect(Object.keys(u)).not.toEqual(expect.arrayContaining(["id"]));
    for (const k of ["id", "consent_version", "consent_at", "created_at", "updated_at"]) expect(u).not.toHaveProperty(k);
    expect(typeof u.onboarding_completed_at).toBe("string");
  });

  it("U2-08 an empty name is stored as null, not blank text", () => {
    expect(profileToUpdate({ ...EMPTY_PROFILE, displayName: "   " }).display_name).toBeNull();
  });
});

describe("safeNext (redirect after sign-in)", () => {
  it("U2-09 allows paths on this site", () => {
    expect(safeNext("/progress")).toBe("/progress");
    expect(safeNext("/meals?slot=lunch")).toBe("/meals?slot=lunch");
  });
  it("U2-10 blocks other websites and odd input", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null, undefined])
      expect(safeNext(bad)).toBe("/home");
  });
});

describe("friendlyError", () => {
  it("U2-11 wrong password does not reveal whether the account exists", () => {
    const m = friendlyError({ code: "invalid_credentials", message: "Invalid login credentials" });
    expect(m).toMatch(/don't match/);
    expect(m).not.toMatch(/no account|not found|exists/i);
  });
  it("U2-12 maps common cases to plain language", () => {
    expect(friendlyError({ code: "email_not_confirmed" })).toMatch(/confirm your email/);
    expect(friendlyError({ code: "weak_password" })).toMatch(/stronger password/);
    expect(friendlyError({ status: 429, message: "" })).toMatch(/Too many attempts/);
    expect(friendlyError({ code: "otp_expired" })).toMatch(/expired/);
    expect(friendlyError({ code: "bad_code_verifier" })).toMatch(/different browser/);
    expect(friendlyError({ message: "Failed to fetch" })).toMatch(/internet connection/);
  });
  it("U2-17 an expired email link is explained as expired, not as a bad email address", () => {
    expect(friendlyError({ code: "otp_expired", message: "Email link is invalid or has expired" })).toMatch(/expired/);
    expect(friendlyError({ message: "Email link is invalid or has expired" })).toMatch(/expired/);
    expect(friendlyError({ code: "email_address_invalid", message: 'Email address "x@y" is invalid' })).toBe("Enter a valid email address.");
  });
  it("U2-18 reusing the current password is not reported as a weak password", () => {
    expect(friendlyError({ code: "same_password", message: "New password should be different from the old password." })).toMatch(/must be different/);
    expect(friendlyError({ message: "New password should be different from the old password." })).toMatch(/must be different/);
  });
  it("U2-13 database age rule is explained", () => {
    expect(friendlyError({ code: "23514", message: "Mealwise is for adults aged 18 and over" })).toMatch(/18 and over/);
    expect(friendlyError({ code: "23514", message: "violates check constraint profiles_height" })).toMatch(/allowed range/);
  });
  it("U2-14 unknown errors fall back to a generic message without technical detail", () => {
    expect(friendlyError({ message: "PGRST301 JWT secret mismatch" })).toBe("Something went wrong. Please try again.");
    expect(friendlyError(null)).toBe("Something went wrong. Please try again.");
  });
});

describe("hasSessionCookie (sign-in check used by the proxy)", () => {
  let has: (names: string[]) => boolean;
  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefgh.supabase.co");
    vi.resetModules();
    has = (await import("@/lib/supabase/config")).hasSessionCookie;
  });
  it("U2-15 recognises the session cookie and its chunks", () => {
    expect(has(["sb-abcdefgh-auth-token"])).toBe(true);
    expect(has(["other", "sb-abcdefgh-auth-token.0"])).toBe(true);
  });
  it("U2-16 ignores the PKCE verifier, other projects, and look-alikes", () => {
    expect(has(["sb-abcdefgh-auth-token-code-verifier"])).toBe(false);
    expect(has(["sb-zzzz-auth-token"])).toBe(false);
    expect(has(["sb-abcdefgh-auth-token.x"])).toBe(false);
    expect(has([])).toBe(false);
  });
});
