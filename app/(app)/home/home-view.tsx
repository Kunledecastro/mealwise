"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { MealFacts, MealRow, NotForMe, sampleReasons, suitsProfile } from "@/components/meal-bits";
import { PlateArt } from "@/components/plate-art";
import { Button, ButtonLink, Chip, EmptyState, SampleTag } from "@/components/ui";
import { slotForHour } from "@/lib/domain/meals";
import { useStore } from "@/lib/prototype-store";
import { SAMPLE_DAILY_TARGET, SAMPLE_MEALS } from "@/lib/sample-data";
import { useHour } from "@/lib/use-today";
import { MEAL_TYPES, MEAL_TYPE_LABEL, type MealType } from "@/lib/types";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeView() {
  const { profile, rejected, logs, today } = useStore();
  // Time of day is read on the client (null during server render) so the suggestion matches the user's clock.
  const hour = useHour();
  const [chosenSlot, setChosenSlot] = useState<MealType | null>(null);
  const slot: MealType = chosenSlot ?? (hour === null ? "lunch" : slotForHour(hour));
  const [index, setIndex] = useState(0);

  const meals = useMemo(
    () => SAMPLE_MEALS.filter((m) => m.mealTypes.includes(slot) && !rejected[m.slug] && suitsProfile(m, profile)),
    [slot, rejected, profile],
  );
  const hero = meals.length ? meals[index % meals.length] : undefined;
  const others = meals.filter((m) => m !== hero).slice(0, 3);

  const kcalToday = logs
    .filter((l) => l.date === today)
    .reduce((sum, l) => sum + (SAMPLE_MEALS.find((m) => m.slug === l.slug)?.kcal ?? 0) * l.portion, 0);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <p className="text-muted">{hour === null ? "Hello" : greeting(hour)}, {profile.displayName}</p>
        <h1 className="text-4xl sm:text-5xl">What can I eat next?</h1>
      </header>

      <section aria-labelledby="hero-title" className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Meal time">
          {MEAL_TYPES.map((t) => (
            <Chip key={t} selected={slot === t} onClick={() => { setChosenSlot(t); setIndex(0); }}>
              {MEAL_TYPE_LABEL[t]}
            </Chip>
          ))}
        </div>

        {hero ? (
          <div className="relative grid items-center gap-6 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:p-7">
            <Link href={`/meals/${hero.slug}`} className="relative mx-auto block w-full max-w-72" tabIndex={-1} aria-hidden="true">
              <div className="aura" />
              <PlateArt key={hero.slug} parts={hero.plate} seed={hero.slug} size={300} animate className="relative h-auto w-full" />
            </Link>
            <div key={hero.slug} className="swap-in relative flex flex-col gap-3">
              <p className="text-sm font-semibold text-accent">{MEAL_TYPE_LABEL[slot]} idea</p>
              <h2 id="hero-title" className="text-2xl sm:text-3xl">
                <Link href={`/meals/${hero.slug}`} className="hover:text-accent">{hero.name}</Link>
              </h2>
              <p className="text-muted">{hero.description}</p>
              <MealFacts meal={hero} />
              {sampleReasons(hero, profile).length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Why this may suit you">
                  {sampleReasons(hero, profile).map((r) => (
                    <li key={r} className="rounded-full bg-fresh-soft px-3 py-1 text-sm font-semibold text-fresh">{r}</li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ButtonLink href={`/meals/${hero.slug}`}>See meal</ButtonLink>
                <Button variant="secondary" onClick={() => setIndex((i) => i + 1)} disabled={meals.length < 2}>
                  <RefreshCw size={16} aria-hidden="true" /> Show another
                </Button>
              </div>
              <NotForMe meal={hero} />
            </div>
          </div>
        ) : (
          <EmptyState
            title={`No ${MEAL_TYPE_LABEL[slot].toLowerCase()} ideas left`}
            body="You've ruled out every sample meal for this time, or none match your food preferences. Try another meal time or adjust your preferences."
            action={<ButtonLink href="/profile" variant="secondary">Review preferences</ButtonLink>}
          />
        )}
        <p className="flex items-center gap-2 text-sm text-muted">
          <SampleTag>Sample meals</SampleTag> Suggestions and figures are examples, not yet personalised.
        </p>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="more-title">
          <div className="flex items-baseline justify-between">
            <h2 id="more-title" className="text-xl">More {MEAL_TYPE_LABEL[slot].toLowerCase()} ideas</h2>
            <Link href={`/meals?slot=${slot}`} className="font-semibold text-accent hover:underline">See all</Link>
          </div>
          <ul className="divide-y divide-line">
            {others.map((m) => <MealRow key={m.slug} meal={m} />)}
          </ul>
        </section>
      )}

      <section aria-labelledby="day-title" className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-baseline justify-between">
          <h2 id="day-title" className="text-xl">Your day so far</h2>
          <Link href="/today" className="font-semibold text-accent hover:underline">Open today</Link>
        </div>
        <p>
          <span className="font-display text-2xl font-semibold">{Math.round(kcalToday).toLocaleString()}</span>{" "}
          <span className="text-muted">of about {SAMPLE_DAILY_TARGET.kcal.toLocaleString()} kcal logged</span>
        </p>
        <div className="h-2 rounded-full bg-line" aria-hidden="true">
          <div className="bg-glow h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, (kcalToday / SAMPLE_DAILY_TARGET.kcal) * 100)}%` }} />
        </div>
        <SampleTag />
      </section>
    </div>
  );
}
