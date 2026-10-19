"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, BookmarkCheck, Clock, Flame, Wallet, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, ErrorState, SkeletonRows } from "./ui";
import { formatMinutes, formatNairaRange } from "@/lib/domain/meals";
import { useStore, type RejectReason } from "@/lib/prototype-store";
import { checkMeal, type RecommendContext } from "@/lib/domain/recommend";
import type { Meal, MealType } from "@/lib/types";
import { MealVisual } from "./meal-visual";

export type DemoState = "loading" | "empty" | "error" | null;

/** Lets testers preview loading / empty / error states via ?demo=… (prototype only). */
export function useDemoState(): DemoState {
  const d = useSearchParams().get("demo");
  return d === "loading" || d === "empty" || d === "error" ? d : null;
}

export function DemoStateView({ state }: { state: DemoState }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = new URLSearchParams(useSearchParams());
  params.delete("demo");
  const retryHref = params.size ? `${pathname}?${params}` : pathname;
  if (state === "loading") return <SkeletonRows count={4} />;
  if (state === "error")
    return (
      <ErrorState
        title="Meals didn't load"
        body="We couldn't reach the meal list. Check your connection and try again. (This is a preview of the error state.)"
        action={<Button variant="secondary" onClick={() => router.replace(retryHref)}>Try again</Button>}
      />
    );
  return null;
}

export function MealFacts({ meal, className = "" }: { meal: Meal; className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted ${className}`}>
      <span className="inline-flex items-center gap-1">
        <Flame size={14} aria-hidden="true" />
        {meal.kcal} kcal
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock size={14} aria-hidden="true" />
        {formatMinutes(meal.prepMinutes)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Wallet size={14} aria-hidden="true" />
        {meal.costLow === null && meal.readyMade ? (
          <>
            <span className="sr-only">Typical price to buy</span>
            <span aria-hidden="true">Buy </span>
            {formatNairaRange(meal.readyMade.low, meal.readyMade.high)}
          </>
        ) : (
          <>
            <span className="sr-only">Estimated cost to cook</span>
            {formatNairaRange(meal.costLow, meal.costHigh)}
          </>
        )}
      </span>
    </p>
  );
}

/** Recommendation context from the signed-in user's profile, choices and (sample) logs. */
export function useRecommendContext(slot: MealType): RecommendContext {
  const { profile, rejected, saved, logs, today } = useStore();
  return useMemo(() => {
    const recent = new Map<string, number>();
    if (today) {
      const t = Date.parse(today);
      for (const l of logs) {
        const days = Math.round((t - Date.parse(l.date)) / 86_400_000);
        if (days >= 0 && days < 7 && (recent.get(l.slug) ?? 99) > days) recent.set(l.slug, days);
      }
    }
    return { profile, slot, rejected: new Set(Object.keys(rejected)), saved: new Set(saved), recent };
  }, [profile, slot, rejected, saved, logs, today]);
}

/** Warns when a meal clashes with the user's allergies, diet or dislikes (e.g. opened from search or a link). */
export function ProfileClash({ meal }: { meal: Meal }) {
  const { profile } = useStore();
  const v = checkMeal(meal, profile);
  if (v.ok) return null;
  const allergy = v.reason === "allergy" || v.reason === "allergy_unknown";
  return (
    <p role="alert" className={`rounded-[var(--radius-md)] border px-4 py-3 font-semibold ${allergy ? "border-error/50 bg-error/10 text-error" : "border-line bg-surface text-ink"}`}>
      {allergy ? "Allergy warning: " : "Heads up: "}
      {v.detail}. We don&apos;t suggest this meal to you.
    </p>
  );
}

export function MealRow({ meal, actions = true }: { meal: Meal; actions?: boolean }) {
  const { saved, toggleSaved, showToast } = useStore();
  const isSaved = saved.includes(meal.slug);
  return (
    <li className="flex items-center gap-4 py-4">
      <MealVisual meal={meal} size={84} decorative />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link href={`/meals/${meal.slug}`} className="font-display text-lg font-semibold leading-tight hover:text-accent hover:underline">
          {meal.name}
        </Link>
        <MealFacts meal={meal} />
      </div>
      {actions && (
        <button
          type="button"
          onClick={() => showToast(toggleSaved(meal.slug) ? `Saved ${meal.name}` : `Removed ${meal.name} from saved`)}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Remove ${meal.name} from saved` : `Save ${meal.name}`}
          className="grid size-11 shrink-0 place-items-center rounded-full text-accent hover:bg-accent-soft"
        >
          {isSaved ? <BookmarkCheck size={22} aria-hidden="true" /> : <Bookmark size={22} aria-hidden="true" />}
        </button>
      )}
    </li>
  );
}

const REASONS: { value: RejectReason; label: string }[] = [
  { value: "dislike", label: "I don't like it" },
  { value: "too_expensive", label: "Too expensive" },
  { value: "too_long", label: "Takes too long" },
  { value: "allergy", label: "I can't eat it" },
  { value: "other", label: "Something else" },
];

export function NotForMe({ meal, onDone }: { meal: Meal; onDone?: () => void }) {
  const { reject, showToast } = useStore();
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button variant="ghost" className="w-fit -ml-3" onClick={() => setOpen(true)}>
        <X size={18} aria-hidden="true" /> Not for me
      </Button>
    );
  return (
    <fieldset className="flex w-full flex-col gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-4">
      <legend className="sr-only">Why isn&apos;t {meal.name} for you?</legend>
      <p className="font-semibold">What&apos;s the reason? This helps us suggest better meals.</p>
      <div className="flex flex-wrap gap-2">
        {REASONS.map((r) => (
          <button key={r.value} type="button" className="min-h-10 rounded-full border border-line px-4 text-sm font-medium hover:border-accent"
            onClick={() => { reject(meal.slug, r.value); showToast(`We'll show ${meal.name} less`); setOpen(false); onDone?.(); }}>
            {r.label}
          </button>
        ))}
        <button type="button" className="min-h-10 px-3 text-sm font-semibold text-muted" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </fieldset>
  );
}
