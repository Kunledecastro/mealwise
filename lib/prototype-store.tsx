"use client";

/**
 * APP STATE
 * - Profile: saved to the database for the signed-in user (Phase 2), via lib/auth.tsx.
 * - Saved meals, "not for me", meal logs and weights: still SAMPLE data in browser memory,
 *   reset on refresh. They become real in Phases 3–4.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth, type SaveResult } from "./auth";
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
  saved: string[];
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
  saved: string[];
  rejected: Record<string, RejectReason>;
  /** null = still showing the dated sample entries, which are derived from today's date. */
  logs: MealLog[] | null;
  weights: WeightEntry[] | null;
}

const initial = (): State => ({
  saved: ["jollof-rice-chicken", "fish-pepper-soup"],
  rejected: {},
  logs: null,
  weights: null,
});

let idCounter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const today = useToday();
  const { profile, saveProfile } = useAuth();
  const [state, setState] = useState(initial);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const store = useMemo<Store>(() => {
    const todayDate = today ? fromISODate(today) : null;
    const logs = state.logs ?? (todayDate ? sampleLogs(todayDate) : []);
    const weights = state.weights ?? (todayDate ? sampleWeights(todayDate) : []);
    // Mutations run in event handlers, so reading the clock here is safe.
    const now = () => new Date();
    return {
      today,
      profile,
      saved: state.saved,
      rejected: state.rejected,
      logs,
      weights,
      setProfile: async (p) => {
        const result = await saveProfile(p);
        if (!result.ok) showToast(result.error);
        return result;
      },
      toggleSaved: (slug) => {
        const willSave = !state.saved.includes(slug);
        setState((s) => ({
          ...s,
          saved: willSave ? [slug, ...s.saved.filter((x) => x !== slug)] : s.saved.filter((x) => x !== slug),
        }));
        return willSave;
      },
      reject: (slug, reason) => setState((s) => ({ ...s, rejected: { ...s.rejected, [slug]: reason } })),
      undoReject: (slug) =>
        setState((s) => {
          const rest = { ...s.rejected };
          delete rest[slug];
          return { ...s, rejected: rest };
        }),
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
  }, [state, today, toast, showToast, profile, saveProfile]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside PrototypeProvider");
  return s;
}
