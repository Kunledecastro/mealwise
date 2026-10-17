"use client";

import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { DemoStateView, MealRow, useDemoState } from "@/components/meal-bits";
import { Button, Chip, EmptyState, PageTitle, SampleTag } from "@/components/ui";
import { filterMeals } from "@/lib/domain/meals";
import { useStore } from "@/lib/prototype-store";
import { SAMPLE_MEALS } from "@/lib/sample-data";
import { MEAL_TYPES, MEAL_TYPE_LABEL, type MealType } from "@/lib/types";

const TIMES = [15, 30, 45];
const COSTS = [1000, 1500, 2500];
const TAGS = ["Vegetarian", "Vegan", "High protein", "Lighter", "Quick"];

export function SearchView() {
  const demo = useDemoState();
  const { profile } = useStore();
  const [query, setQuery] = useState("");
  const [mealType, setMealType] = useState<MealType | "any">("any");
  const [maxPrep, setMaxPrep] = useState<number | undefined>();
  const [maxCost, setMaxCost] = useState<number | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [hideAllergens, setHideAllergens] = useState(true);

  const results = useMemo(
    () => (demo === "empty" ? [] : filterMeals(SAMPLE_MEALS, {
      query, mealType, maxPrep, maxCost, tags,
      excludeAllergens: hideAllergens ? profile.allergies : [],
    })),
    [demo, query, mealType, maxPrep, maxCost, tags, hideAllergens, profile.allergies],
  );
  const filtersOn = mealType !== "any" || maxPrep || maxCost || tags.length > 0;

  function clear() {
    setQuery(""); setMealType("any"); setMaxPrep(undefined); setMaxCost(undefined); setTags([]);
  }

  return (
    <div>
      <PageTitle>Search meals</PageTitle>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
        <label className="relative block">
          <span className="sr-only">Search by meal or ingredient</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Try beans, plantain or soup"
            className="min-h-13 w-full rounded-full border border-line bg-surface pl-12 pr-4 text-base focus:border-accent" />
        </label>

        <div className="flex flex-col gap-4">
          <FilterRow label="Meal">
            <Chip selected={mealType === "any"} onClick={() => setMealType("any")}>Any</Chip>
            {MEAL_TYPES.map((t) => (
              <Chip key={t} selected={mealType === t} onClick={() => setMealType(t)}>{MEAL_TYPE_LABEL[t]}</Chip>
            ))}
          </FilterRow>
          <FilterRow label="Time">
            {TIMES.map((t) => (
              <Chip key={t} selected={maxPrep === t} onClick={() => setMaxPrep(maxPrep === t ? undefined : t)}>Under {t} min</Chip>
            ))}
          </FilterRow>
          <FilterRow label="Budget">
            {COSTS.map((c) => (
              <Chip key={c} selected={maxCost === c} onClick={() => setMaxCost(maxCost === c ? undefined : c)}>
                Up to ₦{c.toLocaleString()}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="Type">
            {TAGS.map((t) => (
              <Chip key={t} selected={tags.includes(t)}
                onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</Chip>
            ))}
          </FilterRow>
          {profile.allergies.length > 0 && (
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={hideAllergens} onChange={(e) => setHideAllergens(e.target.checked)} />
              Hide meals with my allergies ({profile.allergies.join(", ")})
            </label>
          )}
        </div>
      </form>

      <div className="mt-8" aria-live="polite">
        {demo && demo !== "empty" ? (
          <DemoStateView state={demo} />
        ) : results.length === 0 ? (
          <EmptyState
            title="No meals match"
            body={query ? `Nothing matches “${query}” with these filters. Try a different word or remove a filter.` : "Try removing a filter."}
            action={<Button variant="secondary" onClick={clear}>Clear search and filters</Button>}
          />
        ) : (
          <>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
              {results.length} {results.length === 1 ? "meal" : "meals"}{filtersOn || query ? " match" : ""}
              <SampleTag>Sample meals</SampleTag>
            </p>
            <ul className="divide-y divide-line">{results.map((m) => <MealRow key={m.slug} meal={m} />)}</ul>
          </>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-sm font-semibold text-muted">{label}</span>
      <div className="-my-1 flex gap-2 overflow-x-auto py-1">{children}</div>
    </div>
  );
}
