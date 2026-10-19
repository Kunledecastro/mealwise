"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { DemoStateView, useDemoState } from "@/components/meal-bits";
import { ButtonLink, EmptyState, EstimateTag, PageTitle, SkeletonRows } from "@/components/ui";
import { TargetMessage } from "@/components/target-bits";
import { useStore, LOG_DAYS } from "@/lib/prototype-store";
import { getMeal } from "@/catalogue";
import { fromISODate } from "@/lib/dates";
import { addDays, totalsFor } from "@/lib/domain/tracking";
import { MEAL_TYPES, MEAL_TYPE_LABEL } from "@/lib/types";
import { MealVisual } from "@/components/meal-visual";

const portionText = (p: number) => {
  const words: Record<number, string> = { 0.25: "¼ serving", 0.5: "½ serving", 0.75: "¾ serving", 1: "1 serving", 1.5: "1½ servings" };
  return words[p] ?? `${p} servings`;
};

export function TodayView() {
  const demo = useDemoState();
  const { logs, removeLog, showToast, today, target, trackingStatus } = useStore();
  const [offset, setOffset] = useState(0);
  const day = today ? addDays(today, -offset) : null;
  const entries = (demo === "empty" || !day ? [] : logs.filter((l) => l.date === day)).map((l) => ({ log: l, meal: getMeal(l.slug) }));
  const totals = day ? totalsFor(demo === "empty" ? [] : logs, day) : { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const goal = target?.status === "ok" ? target : null;

  const rows = [
    { key: "kcal" as const, label: "Energy", unit: "kcal", color: "bg-glow" },
    { key: "protein" as const, label: "Protein", unit: "g", color: "bg-fresh" },
    { key: "carbs" as const, label: "Carbs", unit: "g", color: "bg-accent" },
    { key: "fat" as const, label: "Fat", unit: "g", color: "bg-pepper" },
  ];

  const isToday = offset === 0;
  const dateLabel = day ? fromISODate(day).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" }) : "";
  const kcalLeft = goal ? goal.kcal - totals.kcal : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle sub={dateLabel}>{isToday ? "Today" : offset === 1 ? "Yesterday" : "Your day"}</PageTitle>
        {today && (
          <div className="flex items-center gap-1" role="group" aria-label="Choose a day">
            <button type="button" onClick={() => setOffset((o) => o + 1)} disabled={offset >= LOG_DAYS} aria-label="Previous day"
              className="grid size-11 place-items-center rounded-full border border-line hover:border-accent disabled:opacity-40">
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={isToday} aria-label="Next day"
              className="grid size-11 place-items-center rounded-full border border-line hover:border-accent disabled:opacity-40">
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            {!isToday && (
              <button type="button" onClick={() => setOffset(0)} className="ml-1 min-h-11 rounded-full px-3 font-semibold text-accent hover:underline">
                Back to today
              </button>
            )}
          </div>
        )}
      </div>
      {today === null || trackingStatus === "loading" ? (
        <SkeletonRows count={3} />
      ) : demo && demo !== "empty" ? (
        <DemoStateView state={demo} />
      ) : trackingStatus === "error" ? (
        <EmptyState title="Your meal log didn't load" body="Check your connection, then reload the page." />
      ) : (
        <>
          <section aria-labelledby="totals-title" className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 id="totals-title" className="text-xl">Estimated totals</h2>
              <EstimateTag />
            </div>
            {goal && isToday && (
              <p className="mb-4">
                <span className="font-display text-2xl font-semibold">{Math.abs(kcalLeft).toLocaleString()} kcal</span>{" "}
                <span className="text-muted">{kcalLeft >= 0 ? "left of your daily target" : "over your daily target"}</span>
              </p>
            )}
            <dl className="flex flex-col gap-4">
              {rows.map((r) => {
                const value = totals[r.key];
                const aim = goal?.[r.key];
                return (
                  <div key={r.key} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5">
                    <dt className="font-semibold">{r.label}</dt>
                    <dd className="text-right">
                      <span className="font-semibold">{value.toLocaleString()}</span>{" "}
                      <span className="text-muted">{aim ? `of about ${aim.toLocaleString()} ${r.unit}` : r.unit}</span>
                    </dd>
                    {aim ? (
                      <dd className="col-span-2 h-2 rounded-full bg-line" aria-hidden="true">
                        <div className={`h-full rounded-full ${r.color}`} style={{ width: `${Math.min(100, (value / aim) * 100)}%` }} />
                      </dd>
                    ) : null}
                  </div>
                );
              })}
            </dl>
            {target && target.status !== "ok" ? (
              <div className="mt-4 border-t border-line pt-4 text-sm"><TargetMessage target={target} /></div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Estimates to guide you, not exact measurements.{" "}
                <Link href="/profile#target" className="font-semibold text-accent hover:underline">How we worked out your target</Link>
              </p>
            )}
          </section>

          <section aria-labelledby="logged-title">
            <h2 id="logged-title" className="mb-2 text-xl">What you logged</h2>
            {entries.length === 0 ? (
              <EmptyState title={isToday ? "Nothing logged today" : "Nothing logged this day"}
                body="When you eat a meal, open it and tap “I ate this” to add it here."
                action={<ButtonLink href="/home">Find a meal</ButtonLink>} />
            ) : (
              <div className="flex flex-col gap-6">
                {MEAL_TYPES.map((t) => {
                  const group = entries.filter((e) => e.log.mealType === t);
                  if (!group.length) return null;
                  return (
                    <div key={t}>
                      <h3 className="text-sm font-semibold text-muted">{MEAL_TYPE_LABEL[t]}</h3>
                      <ul className="divide-y divide-line">
                        {group.map(({ log, meal }) => {
                          const name = meal?.name ?? "A meal no longer in the catalogue";
                          return (
                            <li key={log.id} className="flex items-center gap-3 py-3">
                              {meal && <MealVisual meal={meal} size={52} decorative />}
                              <div className="flex min-w-0 flex-1 flex-col">
                                {meal ? <Link href={`/meals/${meal.slug}`} className="font-semibold hover:underline">{name}</Link> : <span className="font-semibold">{name}</span>}
                                <span className="text-sm text-muted">{portionText(log.portion)}, about {log.kcal.toLocaleString()} kcal</span>
                              </div>
                              <button type="button" aria-label={`Remove ${name} from this day`} disabled={log.id.startsWith("pending-")}
                                onClick={async () => { if (await removeLog(log.id)) showToast(`Removed ${name}`); }}
                                className="grid size-11 place-items-center rounded-full text-muted hover:bg-error-soft hover:text-error disabled:opacity-40">
                                <Trash2 size={18} aria-hidden="true" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
