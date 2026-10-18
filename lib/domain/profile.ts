import type { Activity, Goal, Profile, Units } from "../types";

/** Shape of a row in public.profiles (see supabase/migrations). */
export interface ProfileRow {
  id: string;
  display_name: string | null;
  birth_year: number | null;
  height_cm: number | string | null;
  current_weight_kg: number | string | null;
  target_weight_kg: number | string | null;
  units: Units;
  goal: Goal | null;
  activity_level: Activity | null;
  diet: string[];
  allergies: string[];
  dislikes: string[];
  cuisines: string[];
  budget_band: "low" | "medium" | "high" | null;
  max_prep_minutes: number | null;
  consent_version: string | null;
  consent_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Columns a user may change. Everything else is set by the database. */
export type ProfileUpdate = Partial<
  Pick<
    ProfileRow,
    | "display_name" | "birth_year" | "height_cm" | "current_weight_kg" | "target_weight_kg" | "units" | "goal"
    | "activity_level" | "diet" | "allergies" | "dislikes" | "cuisines" | "budget_band" | "max_prep_minutes"
    | "onboarding_completed_at"
  >
>;

// Postgres numeric columns arrive as strings; convert safely.
const num = (v: number | string | null | undefined): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export function rowToProfile(row: ProfileRow): Profile {
  return {
    displayName: row.display_name ?? "",
    birthYear: row.birth_year ?? undefined,
    heightCm: num(row.height_cm),
    weightKg: num(row.current_weight_kg),
    targetWeightKg: num(row.target_weight_kg),
    units: row.units ?? "metric",
    goal: row.goal ?? undefined,
    activity: row.activity_level ?? undefined,
    diet: row.diet ?? [],
    allergies: row.allergies ?? [],
    dislikes: row.dislikes ?? [],
    cuisines: row.cuisines ?? [],
    budget: row.budget_band ?? undefined,
    maxPrepMinutes: row.max_prep_minutes ?? undefined,
    onboarded: !!row.onboarding_completed_at,
  };
}

/** The editable columns for a profile. `null` clears a value the user removed. */
export function profileToUpdate(p: Profile, opts: { completeOnboarding?: boolean } = {}): ProfileUpdate {
  const clean = (list: string[]) => [...new Set(list.map((s) => s.trim()).filter(Boolean))];
  const update: ProfileUpdate = {
    display_name: p.displayName.trim() || null,
    birth_year: p.birthYear ?? null,
    height_cm: p.heightCm ?? null,
    current_weight_kg: p.weightKg ?? null,
    target_weight_kg: p.targetWeightKg ?? null,
    units: p.units,
    goal: p.goal ?? null,
    activity_level: p.activity ?? null,
    diet: clean(p.diet),
    allergies: clean(p.allergies),
    dislikes: clean(p.dislikes).slice(0, 30).map((d) => d.slice(0, 40)),
    cuisines: clean(p.cuisines),
    budget_band: p.budget ?? null,
    max_prep_minutes: p.maxPrepMinutes ?? null,
  };
  if (opts.completeOnboarding) update.onboarding_completed_at = new Date().toISOString();
  return update;
}

/** An empty profile for a brand-new account (before setup). */
export const EMPTY_PROFILE: Profile = {
  displayName: "",
  units: "metric",
  diet: [],
  allergies: [],
  dislikes: [],
  cuisines: [],
  onboarded: false,
};
