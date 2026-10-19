"use client";

/**
 * APP STATE — everything here is the signed-in user's own data, saved to their account.
 * - Profile (Phase 2), via lib/auth.tsx.
 * - Saved meals and "Not for me" (Phase 3, table meal_preferences).
 * - Meal log (meal_logs) and weight history (weight_entries) (Phase 4).
 * - Daily target: calculated in the browser from the profile and latest weight (lib/domain/targets.ts).
 * Changes show straight away and are undone with a message if saving fails.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth, type SaveResult } from "./auth";
import { friendlyError } from "./domain/auth-errors";
import { calculateTarget, type TargetResult } from "./domain/targets";
import { addDays, currentWeight, logSnapshot, rowToLog, rowToWeight, type MealLogRow, type WeightRow } from "./domain/tracking";
import { getSupabase } from "./supabase/client";
import type { Meal, MealLog, MealType, Profile, WeightEntry } from "./types";
import { useToday } from "./use-today";

export type RejectReason = "dislike" | "too_expensive" | "too_long" | "allergy" | "other";
type Status = "loading" | "ready" | "error";

/** How many days of meal log are loaded (enough for variety and the recent history). */
export const LOG_DAYS = 60;

interface Store {
  /** Today's date on the user's clock; null until the page has loaded in the browser. */
  today: string | null;
  profile: Profile;
  /** Saves the profile to the database; shows a message if it fails. */
  setProfile: (p: Profile) => Promise<SaveResult>;
  /** Saved meal slugs, most recent first. */
  saved: string[];
  /** "ready" once the user's saved and hidden meals have loaded from their account. */
  choicesStatus: Status;
  toggleSaved: (slug: string) => boolean;
  rejected: Record<string, RejectReason>;
  reject: (slug: string, reason: RejectReason) => void;
  undoReject: (slug: string) => void;
  /** Meal log for the last LOG_DAYS days, oldest first. */
  logs: MealLog[];
  /** Weight history, oldest first. */
  weights: WeightEntry[];
  /** "ready" once the meal log and weights have loaded. */
  trackingStatus: Status;
  addLog: (meal: Pick<Meal, "slug" | "kcal" | "protein" | "carbs" | "fat">, mealType: MealType, portion: number, date?: string) => Promise<boolean>;
  removeLog: (id: string) => Promise<boolean>;
  upsertWeight: (date: string, kg: number, unit: "kg" | "lb", id?: string) => Promise<boolean>;
  removeWeight: (id: string) => Promise<boolean>;
  /** Latest logged weight, else the setup weight. */
  weightKg: number | undefined;
  /** Daily target from the profile; null until today's date is known. */
  target: TargetResult | null;
  /** The target's kcal when one could be calculated, else null. */
  dailyKcal: number | null;
  toast: string | null;
  showToast: (msg: string) => void;
}

const Ctx = createContext<Store | null>(null);

interface Choices {
  saved: string[];
  rejected: Record<string, RejectReason>;
}

interface ChoiceRow {
  meal_slug: string;
  saved_at: string | null;
  rejected_at: string | null;
  reject_reason: RejectReason | null;
}

const NO_CHOICES: Choices = { saved: [], rejected: {} };
const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date);
let tempCounter = 0;
const tempId = () => `pending-${++tempCounter}`;

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const today = useToday();
  const { profile, saveProfile, user } = useAuth();
  const userId = user?.id ?? null;
  const [choices, setChoices] = useState<Choices>(NO_CHOICES);
  const [choicesStatus, setChoicesStatus] = useState<Status>("loading");
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [trackingStatus, setTrackingStatus] = useState<Status>("loading");
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Load the signed-in user's saved and hidden meals; forget them on sign-out.
  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset local copy when the user changes
      setChoices(NO_CHOICES);
      setChoicesStatus("loading");
      return;
    }
    let active = true;
    getSupabase()
      .from("meal_preferences")
      .select("meal_slug, saved_at, rejected_at, reject_reason")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setChoicesStatus("error");
          showToast("Your saved meals didn't load. " + friendlyError(error));
          return;
        }
        const rows = (data ?? []) as ChoiceRow[];
        setChoices({
          saved: rows
            .filter((r) => r.saved_at)
            .sort((a, b) => b.saved_at!.localeCompare(a.saved_at!))
            .map((r) => r.meal_slug),
          rejected: Object.fromEntries(rows.filter((r) => r.rejected_at).map((r) => [r.meal_slug, r.reject_reason ?? "other"])),
        });
        setChoicesStatus("ready");
      });
    return () => {
      active = false;
    };
  }, [userId, showToast]);

  // Load the meal log (recent days) and the whole weight history.
  useEffect(() => {
    if (!userId || !today) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset local copy when the user changes
      setLogs([]);
      setWeights([]);
      setTrackingStatus("loading");
      return;
    }
    let active = true;
    const db = getSupabase();
    Promise.all([
      db
        .from("meal_logs")
        .select("id, meal_slug, logged_for, meal_type, portion, kcal, protein_g, carbs_g, fat_g, created_at")
        .eq("user_id", userId)
        .gte("logged_for", addDays(today, -LOG_DAYS))
        .order("logged_for")
        .order("created_at"),
      db.from("weight_entries").select("id, measured_on, weight_kg, entered_unit").eq("user_id", userId).order("measured_on"),
    ]).then(([l, w]) => {
      if (!active) return;
      const error = l.error ?? w.error;
      if (error) {
        setTrackingStatus("error");
        showToast("Your meal log and weights didn't load. " + friendlyError(error));
        return;
      }
      setLogs(((l.data ?? []) as MealLogRow[]).map(rowToLog));
      setWeights(((w.data ?? []) as WeightRow[]).map(rowToWeight));
      setTrackingStatus("ready");
    });
    return () => {
      active = false;
    };
  }, [userId, today, showToast]);

  /** Optimistic update: change the screen now, save, and undo with a message if saving fails. */
  const writeChoice = useCallback(
    async (slug: string, change: Partial<Omit<ChoiceRow, "meal_slug">>, next: (c: Choices) => Choices, before: Choices) => {
      if (!userId) return;
      setChoices(next);
      const { error } = await getSupabase()
        .from("meal_preferences")
        .upsert({ user_id: userId, meal_slug: slug, ...change }, { onConflict: "user_id,meal_slug" });
      if (error) {
        setChoices(before);
        showToast("That wasn't saved. " + friendlyError(error));
      }
    },
    [userId, showToast],
  );

  const addLog = useCallback<Store["addLog"]>(
    async (meal, mealType, portion, date) => {
      const slug = meal.slug;
      const day = date ?? today;
      if (!userId || !day) return false;
      const snap = logSnapshot(meal, portion);
      const id = tempId();
      const entry: MealLog = { id, slug, mealType, portion, date: day, kcal: snap.kcal, protein: snap.protein_g, carbs: snap.carbs_g, fat: snap.fat_g };
      setLogs((ls) => [...ls, entry].sort(byDate));
      const { data, error } = await getSupabase()
        .from("meal_logs")
        .insert({ user_id: userId, meal_slug: slug, logged_for: day, meal_type: mealType, portion, ...snap })
        .select("id, meal_slug, logged_for, meal_type, portion, kcal, protein_g, carbs_g, fat_g")
        .single<MealLogRow>();
      if (error || !data) {
        setLogs((ls) => ls.filter((l) => l.id !== id));
        showToast("That meal wasn't logged. " + friendlyError(error ?? { message: "" }));
        return false;
      }
      setLogs((ls) => ls.map((l) => (l.id === id ? rowToLog(data) : l)));
      return true;
    },
    [userId, today, showToast],
  );

  const removeLog = useCallback<Store["removeLog"]>(
    async (id) => {
      if (!userId) return false;
      const before = logs;
      setLogs((ls) => ls.filter((l) => l.id !== id));
      const { error } = await getSupabase().from("meal_logs").delete().eq("id", id);
      if (error) {
        setLogs(before);
        showToast("That entry wasn't removed. " + friendlyError(error));
        return false;
      }
      return true;
    },
    [userId, logs, showToast],
  );

  const upsertWeight = useCallback<Store["upsertWeight"]>(
    async (date, kg, unit, id) => {
      if (!userId) return false;
      const before = weights;
      // One entry per day: editing, or adding on a date that already has one, replaces it.
      const moved = id ? weights.find((w) => w.id === id && w.date !== date) : undefined;
      const tmp = tempId();
      setWeights((ws) => [...ws.filter((w) => w.id !== id && w.date !== date), { id: tmp, date, kg }].sort(byDate));
      const db = getSupabase();
      const { data, error } = await db
        .from("weight_entries")
        .upsert({ user_id: userId, measured_on: date, weight_kg: kg, entered_unit: unit }, { onConflict: "user_id,measured_on" })
        .select("id, measured_on, weight_kg, entered_unit")
        .single<WeightRow>();
      // If an entry was moved to a new date, the old date's row goes.
      const removal = !error && moved ? await db.from("weight_entries").delete().eq("id", moved.id) : { error: null };
      if (error || !data || removal.error) {
        setWeights(before);
        showToast("That weight wasn't saved. " + friendlyError(error ?? removal.error ?? { message: "" }));
        return false;
      }
      setWeights((ws) => ws.map((w) => (w.id === tmp ? rowToWeight(data) : w)));
      return true;
    },
    [userId, weights, showToast],
  );

  const removeWeight = useCallback<Store["removeWeight"]>(
    async (id) => {
      if (!userId) return false;
      const before = weights;
      setWeights((ws) => ws.filter((w) => w.id !== id));
      const { error } = await getSupabase().from("weight_entries").delete().eq("id", id);
      if (error) {
        setWeights(before);
        showToast("That weight wasn't removed. " + friendlyError(error));
        return false;
      }
      return true;
    },
    [userId, weights, showToast],
  );

  const weightKg = currentWeight(weights, profile.weightKg);
  const target = useMemo<TargetResult | null>(
    () =>
      today
        ? calculateTarget({
            birthYear: profile.birthYear,
            heightCm: profile.heightCm,
            weightKg,
            sex: profile.sex,
            activity: profile.activity,
            goal: profile.goal,
            targetWeightKg: profile.targetWeightKg,
            needsGuidance: profile.needsGuidance,
            year: Number(today.slice(0, 4)),
          })
        : null,
    [today, profile, weightKg],
  );

  const store = useMemo<Store>(() => {
    // Mutations run in event handlers, so reading the clock here is safe.
    const now = () => new Date();
    return {
      today,
      profile,
      saved: choices.saved,
      rejected: choices.rejected,
      choicesStatus,
      logs,
      weights,
      trackingStatus,
      addLog,
      removeLog,
      upsertWeight,
      removeWeight,
      weightKg,
      target,
      dailyKcal: target?.status === "ok" ? target.kcal : null,
      setProfile: async (p) => {
        const result = await saveProfile(p);
        if (!result.ok) showToast(result.error);
        return result;
      },
      toggleSaved: (slug) => {
        const willSave = !choices.saved.includes(slug);
        void writeChoice(slug, { saved_at: willSave ? now().toISOString() : null }, (c) => ({
          ...c,
          saved: willSave ? [slug, ...c.saved.filter((x) => x !== slug)] : c.saved.filter((x) => x !== slug),
        }), choices);
        return willSave;
      },
      reject: (slug, reason) =>
        void writeChoice(slug, { rejected_at: now().toISOString(), reject_reason: reason }, (c) => ({
          ...c,
          rejected: { ...c.rejected, [slug]: reason },
        }), choices),
      undoReject: (slug) =>
        void writeChoice(slug, { rejected_at: null, reject_reason: null }, (c) => {
          const rest = { ...c.rejected };
          delete rest[slug];
          return { ...c, rejected: rest };
        }, choices),
      toast,
      showToast,
    };
  }, [today, profile, choices, choicesStatus, logs, weights, trackingStatus, addLog, removeLog, upsertWeight, removeWeight, weightKg, target, writeChoice, toast, showToast, saveProfile]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside PrototypeProvider");
  return s;
}
