"use client";

/**
 * The signed-in user's meal plan (table meal_plans, one row per user). Loaded by the plan screens
 * only. Changes show at once and are undone with a message if saving fails.
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import { friendlyError } from "./domain/auth-errors";
import { cleanItems } from "./domain/plan";
import { cleanOwnItems, type OwnItem, type PlanItem, type Tick } from "./domain/shopping";
import { useStore } from "./prototype-store";
import { getSupabase } from "./supabase/client";

export interface Plan {
  startDate: string;
  days: number;
  includeSnacks: boolean;
  items: PlanItem[];
  shopping: Record<string, Tick>;
  /** Items the user added to the shopping list themselves. Kept when a new plan is made. */
  extras: OwnItem[];
}

interface PlanRow {
  start_date: string;
  days: number;
  include_snacks: boolean;
  items: unknown;
  shopping: unknown;
  extras?: unknown;
}

const toPlan = (r: PlanRow): Plan => ({
  startDate: r.start_date,
  days: r.days,
  includeSnacks: r.include_snacks,
  items: cleanItems(r.items, r.days),
  shopping:
    r.shopping && typeof r.shopping === "object" && !Array.isArray(r.shopping)
      ? Object.fromEntries(Object.entries(r.shopping as Record<string, unknown>).filter(([, v]) => v === "have" || v === "bought")) as Record<string, Tick>
      : {},
  extras: cleanOwnItems(r.extras),
});

export function usePlan() {
  const { user } = useAuth();
  const { showToast } = useStore();
  const userId = user?.id ?? null;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getSupabase()
      .from("meal_plans")
      .select("start_date, days, include_snacks, items, shopping, extras")
      .eq("user_id", userId)
      .maybeSingle<PlanRow>()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setStatus("error");
          showToast("Your plan didn't load. " + friendlyError(error));
          return;
        }
        setPlan(data ? toPlan(data) : null);
        setStatus("ready");
      });
    return () => {
      active = false;
    };
  }, [userId, showToast]);

  /** Saves the whole plan (new plan or any change). Returns false, and restores the screen, on failure. */
  const save = useCallback(
    async (next: Plan, failMessage = "That change wasn't saved. "): Promise<boolean> => {
      if (!userId) return false;
      const before = plan;
      setPlan(next);
      const { error } = await getSupabase()
        .from("meal_plans")
        .upsert(
          { user_id: userId, start_date: next.startDate, days: next.days, include_snacks: next.includeSnacks, items: next.items, shopping: next.shopping, extras: next.extras },
          { onConflict: "user_id" },
        );
      if (error) {
        setPlan(before);
        showToast(failMessage + friendlyError(error));
        return false;
      }
      return true;
    },
    [userId, plan, showToast],
  );

  return { plan, status, save };
}
