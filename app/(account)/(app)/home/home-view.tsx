"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { MealFacts, MealRow, NotForMe, useRecommendContext } from "@/components/meal-bits";
import { Button, ButtonLink, Chip, EmptyState, EstimateTag, SkeletonRows } from "@/components/ui";
import { slotForHour } from "@/lib/domain/meals";
import { useStore } from "@/lib/prototype-store";
import { MEALS } from "@/catalogue";
import { rankMeals } from "@/lib/domain/recommend";
import { totalsFor } from "@/lib/domain/tracking";
import { useHour } from "@/lib/use-today";
import { MEAL_TYPES, MEAL_TYPE_LABEL, type MealType } from "@/lib/types";
import { MealVisual } from "@/components/meal-visual";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeView() {
  const { profile, logs, today, showToast, choicesStatus, dailyKcal, trackingStatus } = useStore();
  const router = useRouter();

  // Arriving from the "set a new password" screen.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("updated") === "password") {
      showToast("Password updated");
      router.replace("/home");
    }
  }, [showToast, router]);
  // Time of day is read on the client (null during server render) so the suggestion matches the user's clock.
  const hour = useHour();
  const [chosenSlot, setChosenSlot] = useState<MealType | null>(null);
  const slot: MealType = chosenSlot ?? (hour === null ? "lunch" : slotForHour(hour));
  const [index, setIndex] = useState(0);

  const ctx = useRecommendContext(slot);
  const ranked = useMemo(() => rankMeals(MEALS, ctx), [ctx]);
  const meals = ranked.map((r) => r.meal);
  const heroRank = ranked.length ? ranked[index % ranked.length] : undefined;
  const hero = heroRank?.meal;
  const others = meals.filter((m) => m !== hero).slice(0, 3);

  const kcalToday = today ? totalsFor(logs, today).kcal : 0;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <p className="text-muted">{hour === null ? "Hello" : greeting(hour)}{profile.displayName ? `, ${profile.displayName}` : ""}</p>
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

        {choicesStatus === "loading" ? (
          <div aria-busy="true" className="rounded-[var(--radius-lg)] border border-line bg-surface p-5"><SkeletonRows count={2} /></div>
        ) : hero ? (
          <div className="relative grid items-center gap-6 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:p-7">
            <Link href={`/meals/${hero.slug}`} className="relative mx-auto block w-full max-w-72" tabIndex={-1} aria-hidden="true">
              <div className="aura" />
              <MealVisual key={hero.slug} meal={hero} size={300} shape="card" animate priority sizes="(max-width: 640px) 88vw, 300px" className="relative w-full" decorative />
            </Link>
            <div key={hero.slug} className="swap-in relative flex flex-col gap-3">
              <p className="text-sm font-semibold text-accent">{MEAL_TYPE_LABEL[slot]} idea</p>
              <h2 id="hero-title" className="text-2xl sm:text-3xl">
                <Link href={`/meals/${hero.slug}`} className="hover:text-accent">{hero.name}</Link>
              </h2>
              <p className="text-muted">{hero.description}</p>
              <MealFacts meal={hero} />
              {heroRank!.reasons.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Why this may suit you">
                  {heroRank!.reasons.map((r) => (
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
            body="Every meal for this time is ruled out by your allergies, diet, dislikes or “Not for me” choices. Try another meal time or review your preferences."
            action={<ButtonLink href="/profile" variant="secondary">Review preferences</ButtonLink>}
          />
        )}
        <p className="flex items-center gap-2 text-sm text-muted">
          <EstimateTag /> Calories and prices are estimates from ingredient data.
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
        {trackingStatus === "loading" ? (
          <SkeletonRows count={1} />
        ) : (
          <>
            <p>
              <span className="font-display text-2xl font-semibold">{kcalToday.toLocaleString()}</span>{" "}
              <span className="text-muted">{dailyKcal ? `of about ${dailyKcal.toLocaleString()} kcal logged` : "kcal logged"}</span>
            </p>
            {dailyKcal ? (
              <div className="h-2 rounded-full bg-line" aria-hidden="true">
                <div className="bg-glow h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, (kcalToday / dailyKcal) * 100)}%` }} />
              </div>
            ) : (
              <p className="text-sm text-muted">
                <Link href="/profile#target" className="font-semibold text-accent hover:underline">See your daily target</Link>
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
