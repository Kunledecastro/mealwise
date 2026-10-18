"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { DemoStateView, MealRow, useDemoState, useRecommendContext } from "@/components/meal-bits";
import { ButtonLink, EmptyState, EstimateTag, PageTitle, SkeletonRows } from "@/components/ui";
import { MEALS } from "@/catalogue";
import { checkMeal, rankMeals } from "@/lib/domain/recommend";
import { useStore } from "@/lib/prototype-store";
import { MEAL_TYPES, MEAL_TYPE_LABEL, type MealType } from "@/lib/types";

export function MealsView() {
  const params = useSearchParams();
  const demo = useDemoState();
  const { profile, rejected, undoReject, choicesStatus } = useStore();
  const raw = params.get("slot");
  const slot: MealType = MEAL_TYPES.includes(raw as MealType) ? (raw as MealType) : "breakfast";

  const ctx = useRecommendContext(slot);
  const ranked = useMemo(() => rankMeals(MEALS, ctx), [ctx]);
  const meals = demo === "empty" ? [] : ranked.map((r) => r.meal);
  const inSlot = MEALS.filter((m) => m.mealTypes.includes(slot));
  const hidden = inSlot.filter((m) => rejected[m.slug]);
  // Meals left out by allergies, diet or dislikes (not by "Not for me").
  const filteredOut = inSlot.filter((m) => !rejected[m.slug] && !checkMeal(m, profile).ok).length;

  return (
    <div>
      <PageTitle sub={<span className="flex flex-wrap items-center gap-2">Best matches for your goal and preferences first. <EstimateTag /></span>}>
        Meal ideas
      </PageTitle>
      <nav aria-label="Meal times" className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {MEAL_TYPES.map((t) => (
          <Link key={t} href={`/meals?slot=${t}`} aria-current={t === slot ? "page" : undefined}
            className={`-mb-px border-b-[3px] px-4 py-3 font-semibold whitespace-nowrap ${
              t === slot ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"
            }`}>
            {MEAL_TYPE_LABEL[t]}
          </Link>
        ))}
      </nav>

      {choicesStatus === "loading" && !demo ? (
        <div aria-busy="true"><SkeletonRows count={4} /></div>
      ) : demo && demo !== "empty" ? (
        <DemoStateView state={demo} />
      ) : meals.length === 0 ? (
        <EmptyState
          title={`No ${MEAL_TYPE_LABEL[slot].toLowerCase()} ideas match right now`}
          body="Your preferences or the meals you've ruled out leave nothing to show here. Adjust your preferences or bring back hidden meals."
          action={<ButtonLink href="/profile" variant="secondary">Review preferences</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-line" aria-label={`${MEAL_TYPE_LABEL[slot]} ideas`}>
          {meals.map((m) => <MealRow key={m.slug} meal={m} />)}
        </ul>
      )}

      {filteredOut > 0 && !demo && (
        <p className="mt-4 text-sm text-muted">
          {filteredOut} {filteredOut === 1 ? "meal is" : "meals are"} not shown because of your allergies, diet or dislikes.{" "}
          <Link href="/profile" className="font-semibold text-accent hover:underline">Review preferences</Link>
        </p>
      )}

      {hidden.length > 0 && !demo && (
        <section className="mt-8 rounded-[var(--radius-md)] border border-line p-4" aria-labelledby="hidden-title">
          <h2 id="hidden-title" className="text-lg">Meals you said weren&apos;t for you</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {hidden.map((m) => (
              <li key={m.slug} className="flex items-center justify-between gap-3">
                <span>{m.name}</span>
                <button type="button" className="min-h-10 px-3 font-semibold text-accent hover:underline" onClick={() => undoReject(m.slug)}>
                  Show again
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
