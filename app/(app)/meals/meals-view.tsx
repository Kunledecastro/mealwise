"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DemoStateView, MealRow, suitsProfile, useDemoState } from "@/components/meal-bits";
import { ButtonLink, EmptyState, PageTitle, SampleTag } from "@/components/ui";
import { useStore } from "@/lib/prototype-store";
import { SAMPLE_MEALS } from "@/lib/sample-data";
import { MEAL_TYPES, MEAL_TYPE_LABEL, type MealType } from "@/lib/types";

export function MealsView() {
  const params = useSearchParams();
  const demo = useDemoState();
  const { profile, rejected, undoReject } = useStore();
  const raw = params.get("slot");
  const slot: MealType = MEAL_TYPES.includes(raw as MealType) ? (raw as MealType) : "breakfast";

  const meals = demo === "empty" ? [] : SAMPLE_MEALS.filter((m) => m.mealTypes.includes(slot) && !rejected[m.slug] && suitsProfile(m, profile));
  const hidden = SAMPLE_MEALS.filter((m) => m.mealTypes.includes(slot) && rejected[m.slug]);

  return (
    <div>
      <PageTitle sub={<span className="flex flex-wrap items-center gap-2">Ideas that match your preferences. <SampleTag>Sample meals</SampleTag></span>}>
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

      {demo && demo !== "empty" ? (
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
