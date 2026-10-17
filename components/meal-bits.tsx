"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, BookmarkCheck, Clock, Flame, Wallet, X } from "lucide-react";
import { useState } from "react";
import { PlateArt } from "./plate-art";
import { Button, ErrorState, SkeletonRows } from "./ui";
import { formatMinutes, formatNairaRange } from "@/lib/domain/meals";
import { useStore, type RejectReason } from "@/lib/prototype-store";
import type { Meal, Profile } from "@/lib/types";

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
        <span className="sr-only">Estimated cost</span>
        {formatNairaRange(meal.costLow, meal.costHigh)}
      </span>
    </p>
  );
}

/** Plain-language reasons computed from the sample meal and the profile. */
export function sampleReasons(meal: Meal, profile: Profile): string[] {
  const r: string[] = [];
  const budgetCap = profile.budget === "low" ? 1500 : profile.budget === "medium" ? 3000 : undefined;
  if (budgetCap && meal.costHigh <= budgetCap) r.push("Fits your budget");
  if (profile.maxPrepMinutes && meal.prepMinutes <= profile.maxPrepMinutes) r.push(`Ready in ${formatMinutes(meal.prepMinutes)}`);
  if (profile.goal === "gain" && meal.protein >= 25) r.push("Good protein for gaining");
  if (profile.goal === "lose" && meal.kcal <= 450) r.push("Lighter option for your goal");
  if (profile.goal === "lose" && meal.protein >= 30) r.push("High protein keeps you full");
  if (profile.cuisines.includes(meal.cuisine.split(" ")[0])) r.push(`${meal.cuisine.split(" ")[0]} food you enjoy`);
  return r.slice(0, 3);
}

/** Meals that clash with the profile's allergies, diet or dislikes are hidden. */
export function suitsProfile(meal: Meal, profile: Profile): boolean {
  if (meal.allergens.some((a) => profile.allergies.includes(a))) return false;
  const text = `${meal.name} ${meal.ingredients.map((i) => i.name).join(" ")}`.toLowerCase();
  if (profile.dislikes.some((d) => d && text.includes(d.toLowerCase()))) return false;
  if (profile.diet.includes("Vegetarian") && !meal.tags.some((t) => t.startsWith("Vegetarian") || t === "Vegan")) return false;
  if (profile.diet.includes("Vegan") && !meal.tags.includes("Vegan")) return false;
  return true;
}

export function MealRow({ meal, actions = true }: { meal: Meal; actions?: boolean }) {
  const { saved, toggleSaved, showToast } = useStore();
  const isSaved = saved.includes(meal.slug);
  return (
    <li className="flex items-center gap-4 py-4">
      <PlateArt parts={meal.plate} seed={meal.slug} size={84} className="shrink-0" title={meal.name} />
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
