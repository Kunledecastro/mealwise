"use client";

import { DemoStateView, MealRow, useDemoState } from "@/components/meal-bits";
import { ButtonLink, EmptyState, PageTitle } from "@/components/ui";
import { useStore } from "@/lib/prototype-store";
import { SAMPLE_MEALS } from "@/lib/sample-data";

export function SavedView() {
  const demo = useDemoState();
  const { saved } = useStore();
  const meals = demo === "empty" ? [] : saved.map((s) => SAMPLE_MEALS.find((m) => m.slug === s)).filter((m) => !!m);

  return (
    <div>
      <PageTitle sub="Meals you want to come back to.">Saved meals</PageTitle>
      {demo && demo !== "empty" ? (
        <DemoStateView state={demo} />
      ) : meals.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          body="Tap the bookmark on any meal to keep it here for later."
          action={<ButtonLink href="/home">Find a meal</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-line">{meals.map((m) => <MealRow key={m.slug} meal={m} />)}</ul>
      )}
    </div>
  );
}
