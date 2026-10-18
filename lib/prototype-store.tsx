"use client";

/**
 * APP STATE
 * - Profile: saved to the database for the signed-in user (Phase 2), via lib/auth.tsx.
 * - Saved meals and "Not for me": saved to the database (Phase 3, table meal_preferences).
 * - Meal logs and weights: still SAMPLE data in browser memory, reset on refresh (Phase 4).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth, type SaveResult } from "./auth";
import { friendlyError } from "./domain/auth-errors";
import { getSupabase } from "./supabase/client";
import { fromISODate, sampleLogs, sampleWeights, toISODate } from "./sample-data";
import type { MealLog, MealType, Profile, WeightEntry } from "./types";
import { useToday } from "./use-today";

export type RejectReason = "dislike" | "too_expensive" | "too_long" | "allergy" | "other";

interface Store {
  /** Today's date on the user's clock; null until the page has loaded in the browser. */
  today: string | null;
  profile: Profile;
  /** Saves the profile to the database; shows a message if it fails. */
  setProfile: (p: Profile) => Promise<SaveResult>;
  /** Saved meal slugs, most recent first. */
  saved: string[];
  /** "ready" once the user's saved and hidden meals have loaded from their account. */
  choicesStatus: "loading" | "ready" | "error";
  toggleSaved: (slug: string) => boolean;
  rejected: Record<string, RejectReason>;
  reject: (slug: string, reason: RejectReason) => void;
  undoReject: (slug: string) => void;
  logs: MealLog[];
  addLog: (slug: string, mealType: MealType, portion: number) => void;
  removeLog: (id: string) => void;
  weights: WeightEntry[];
  upsertWeight: (date: string, kg: number, id?: string) => void;
  removeWeight: (id: string) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

interface State {
  /** null = still showing the dated sample entries = still showing the dated sample entries, which are derived from today's date. */
  logs: MealLog[] | null;
  weights: WeightEntry[] | null;
}

const initial = (): State => ({
  logs: null,
  weights: null,
});

let idCounter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

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

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const today = useToday();
  const { profile, saveProfile, user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState(initial);
  const [choices, setChoices] = useState<Choices>(NO_CHOICES);
  const [choicesStatus, setChoicesStatus] = useState<Store["choicesStatus"]>("loading");
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

  const store = useMemo<Store>(() => {
    const todayDate = today ? fromISODate(today) : null;
    const logs = state.logs ?? (todayDate ? sampleLogs(todayDate) : []);
    const weights = state.weights ?? (todayDate ? sampleWeights(todayDate) : []);
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
      addLog: (slug, mealType, portion) =>
        setState((s) => ({
          ...s,
          logs: [...(s.logs ?? sampleLogs(now())), { id: newId("log"), slug, mealType, portion, date: toISODate(now()) }],
        })),
      removeLog: (id) => setState((s) => ({ ...s, logs: (s.logs ?? sampleLogs(now())).filter((l) => l.id !== id) })),
      upsertWeight: (date, kg, id) =>
        setState((s) => {
          // One entry per day: editing, or adding on a date that already has one, replaces it.
          const current = s.weights ?? sampleWeights(now());
          const others = current.filter((w) => w.id !== id && w.date !== date);
          const entry = { id: id ?? newId("w"), date, kg };
          return { ...s, weights: [...others, entry].sort((a, b) => a.date.localeCompare(b.date)) };
        }),
      removeWeight: (id) => setState((s) => ({ ...s, weights: (s.weights ?? sampleWeights(now())).filter((w) => w.id !== id) })),
      toast,
      showToast,
      reset: () => setState(initial()),
    };
  }, [state, choices, choicesStatus, writeChoice, today, toast, showToast, profile, saveProfile]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside PrototypeProvider");
  return s;
}
