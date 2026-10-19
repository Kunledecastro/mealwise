"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Bookmark, BookmarkCheck, Check } from "lucide-react";
import { NotForMe, ProfileClash, useRecommendContext } from "@/components/meal-bits";
import { Button, Chip } from "@/components/ui";
import { slotForHour } from "@/lib/domain/meals";
import { useStore } from "@/lib/prototype-store";
import { getMeal } from "@/catalogue";
import { PRICE_STALE_DAYS } from "@/lib/domain/catalogue";
import { checkMeal, factorsFor, reasonsFor } from "@/lib/domain/recommend";
import { MEAL_TYPES, MEAL_TYPE_LABEL, type MealType } from "@/lib/types";

const PORTIONS = [0.5, 1, 1.5, 2];
const portionLabel = (p: number) => (p === 0.5 ? "½" : p === 1.5 ? "1½" : String(p));
const portionSpoken = (p: number) =>
  p === 0.5 ? "Half a serving" : p === 1.5 ? "One and a half servings" : p === 1 ? "1 serving" : `${p} servings`;

export function MealActions({ slug }: { slug: string }) {
  const meal = getMeal(slug)!;
  const router = useRouter();
  const { saved, toggleSaved, addLog, showToast } = useStore();
  const isSaved = saved.includes(slug);
  const dialog = useRef<HTMLDialogElement>(null);
  const [portion, setPortion] = useState(1);
  const [mealType, setMealType] = useState<MealType>(meal.mealTypes[0]);

  function openLog() {
    const now = slotForHour(new Date().getHours());
    setMealType(meal.mealTypes.includes(now) ? now : meal.mealTypes[0]);
    setPortion(1);
    dialog.current?.showModal();
  }

  function log() {
    addLog(slug, mealType, portion);
    dialog.current?.close();
    showToast(`Logged ${meal.name} to today`);
  }

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button onClick={openLog}>
          <Check size={18} aria-hidden="true" /> I ate this
        </Button>
        <Button variant="secondary" aria-pressed={isSaved}
          onClick={() => showToast(toggleSaved(slug) ? `Saved ${meal.name}` : `Removed ${meal.name} from saved`)}>
          {isSaved ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
          {isSaved ? "Saved" : "Save"}
        </Button>
      </div>
      <NotForMe meal={meal} onDone={() => router.push(`/meals?slot=${meal.mealTypes[0]}`)} />

      <dialog ref={dialog} aria-labelledby="log-title"
        className="mx-auto mb-0 mt-auto w-full max-w-none rounded-t-[1.75rem] border border-line bg-surface-2 p-0 text-ink backdrop:bg-black/65 backdrop:backdrop-blur-sm sm:m-auto sm:w-[28rem] sm:rounded-[1.75rem]">
        <form method="dialog" className="sheet-up flex flex-col gap-5 p-6 pb-8 sm:pb-6" onSubmit={(e) => { e.preventDefault(); log(); }}>
          <h2 id="log-title" className="text-2xl">Log {meal.name}</h2>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">How much did you have?</legend>
            <div className="flex flex-wrap gap-2">
              {PORTIONS.map((p) => (
                <Chip key={p} selected={portion === p} onClick={() => setPortion(p)} aria-label={portionSpoken(p)}>
                  {portionLabel(p)}
                </Chip>
              ))}
            </div>
            <p className="text-sm text-muted">One serving is {meal.serving.toLowerCase()}. That&apos;s about {Math.round(meal.kcal * portion)} kcal (estimate).</p>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">Which meal was it?</legend>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((t) => (
                <Chip key={t} selected={mealType === t} onClick={() => setMealType(t)}>{MEAL_TYPE_LABEL[t]}</Chip>
              ))}
            </div>
          </fieldset>
          <p className="text-sm text-muted">Test version: meal logs stay in this browser tab only until Phase 4.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => dialog.current?.close()}>Cancel</Button>
            <Button type="submit">Log meal</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function WhyThisSuits({ slug }: { slug: string }) {
  const meal = getMeal(slug)!;
  const { profile } = useStore();
  const ctx = useRecommendContext(meal.mealTypes[0]);
  if (!checkMeal(meal, profile).ok) return null;
  const reasons = reasonsFor(meal, factorsFor(meal, ctx), ctx);
  if (!reasons.length) return null;
  return (
    <section aria-labelledby="why-title" className="flex flex-col gap-3">
      <h2 id="why-title" className="text-xl">Why this may suit you</h2>
      <ul className="flex flex-wrap gap-2">
        {reasons.map((r) => <li key={r} className="rounded-full bg-fresh-soft px-3 py-1.5 font-semibold text-fresh">{r}</li>)}
      </ul>
    </section>
  );
}

export function ProfileClashFor({ slug }: { slug: string }) {
  return <ProfileClash meal={getMeal(slug)!} />;
}

/** "Prices checked <date>", flagged when older than 90 days. Uses the user's clock. */
export function PriceNote({ priceDate }: { priceDate: string | null }) {
  const { today } = useStore();
  if (!priceDate) return <span className="block text-xs font-normal text-muted">Prices for some ingredients haven&apos;t been collected yet.</span>;
  const days = today ? Math.round((Date.parse(today) - Date.parse(priceDate)) / 86_400_000) : 0;
  const label = new Date(priceDate).toLocaleDateString("en-NG", { month: "short", year: "numeric" });
  return (
    <span className={`block text-xs font-normal ${days > PRICE_STALE_DAYS ? "text-error" : "text-muted"}`}>
      Prices from {label}{days > PRICE_STALE_DAYS ? ", may be out of date" : ""}
    </span>
  );
}

/** Source and date for a ready-made price; flags it when older than 90 days. */
export function ReadyMadeNote({ observedOn, note }: { observedOn: string; note?: string }) {
  const { today } = useStore();
  const days = today ? Math.round((Date.parse(today) - Date.parse(observedOn)) / 86_400_000) : 0;
  const label = new Date(observedOn).toLocaleDateString("en-NG", { month: "short", year: "numeric" });
  return (
    <p className={`text-xs ${days > PRICE_STALE_DAYS ? "text-error" : "text-muted"}`}>
      Checked {label}{days > PRICE_STALE_DAYS ? ", may be out of date" : ""}.{note ? ` ${note}` : ""}
    </p>
  );
}
