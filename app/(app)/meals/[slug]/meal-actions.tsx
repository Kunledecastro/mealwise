"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Bookmark, BookmarkCheck, Check } from "lucide-react";
import { NotForMe, sampleReasons } from "@/components/meal-bits";
import { Button, Chip } from "@/components/ui";
import { slotForHour } from "@/lib/domain/meals";
import { useStore } from "@/lib/prototype-store";
import { SAMPLE_MEALS } from "@/lib/sample-data";
import { MEAL_TYPES, MEAL_TYPE_LABEL, type MealType } from "@/lib/types";

const PORTIONS = [0.5, 1, 1.5, 2];
const portionLabel = (p: number) => (p === 0.5 ? "½" : p === 1.5 ? "1½" : String(p));
const portionSpoken = (p: number) =>
  p === 0.5 ? "Half a serving" : p === 1.5 ? "One and a half servings" : p === 1 ? "1 serving" : `${p} servings`;

export function MealActions({ slug }: { slug: string }) {
  const meal = SAMPLE_MEALS.find((m) => m.slug === slug)!;
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
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-[var(--radius-lg)] bg-surface p-0 text-ink backdrop:bg-ink/40">
        <form method="dialog" className="sheet-up flex flex-col gap-5 p-6" onSubmit={(e) => { e.preventDefault(); log(); }}>
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
            <p className="text-sm text-muted">One serving is {meal.serving.toLowerCase()}. That&apos;s about {Math.round(meal.kcal * portion)} kcal (sample figure).</p>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">Which meal was it?</legend>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((t) => (
                <Chip key={t} selected={mealType === t} onClick={() => setMealType(t)}>{MEAL_TYPE_LABEL[t]}</Chip>
              ))}
            </div>
          </fieldset>
          <p className="text-sm text-muted">Prototype: this log stays in this browser tab only.</p>
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
  const meal = SAMPLE_MEALS.find((m) => m.slug === slug)!;
  const { profile } = useStore();
  const reasons = sampleReasons(meal, profile);
  if (!reasons.length) return null;
  return (
    <section aria-labelledby="why-title" className="flex flex-col gap-3">
      <h2 id="why-title" className="text-xl">Why this may suit you</h2>
      <ul className="flex flex-wrap gap-2">
        {reasons.map((r) => <li key={r} className="rounded-full bg-leaf-soft px-3 py-1.5 font-medium text-leaf">{r}</li>)}
      </ul>
    </section>
  );
}
