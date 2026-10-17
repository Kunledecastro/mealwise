"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { DemoStateView, useDemoState } from "@/components/meal-bits";
import { PlateArt } from "@/components/plate-art";
import { ButtonLink, EmptyState, PageTitle, SampleTag, SkeletonRows } from "@/components/ui";
import { useStore } from "@/lib/prototype-store";
import { SAMPLE_DAILY_TARGET, SAMPLE_MEALS, fromISODate } from "@/lib/sample-data";
import { MEAL_TYPES, MEAL_TYPE_LABEL } from "@/lib/types";

export function TodayView() {
  const demo = useDemoState();
  const { logs, removeLog, showToast, today } = useStore();
  const entries = (demo === "empty" ? [] : logs.filter((l) => l.date === today)).map((l) => ({
    log: l,
    meal: SAMPLE_MEALS.find((m) => m.slug === l.slug)!,
  }));

  const total = (k: "kcal" | "protein" | "carbs" | "fat") =>
    Math.round(entries.reduce((s, e) => s + e.meal[k] * e.log.portion, 0));
  const rows = [
    { key: "kcal" as const, label: "Energy", unit: "kcal", color: "bg-leaf" },
    { key: "protein" as const, label: "Protein", unit: "g", color: "bg-leaf" },
    { key: "carbs" as const, label: "Carbs", unit: "g", color: "bg-plantain" },
    { key: "fat" as const, label: "Fat", unit: "g", color: "bg-pepper" },
  ];

  const dateLabel = today ? fromISODate(today).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" }) : "";

  return (
    <div className="flex flex-col gap-8">
      <PageTitle sub={dateLabel}>Today</PageTitle>
      {today === null ? (
        <SkeletonRows count={3} />
      ) : demo && demo !== "empty" ? (
        <DemoStateView state={demo} />
      ) : (
        <>
          <section aria-labelledby="totals-title" className="rounded-[var(--radius-lg)] bg-surface p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 id="totals-title" className="text-xl">Estimated totals</h2>
              <SampleTag>Sample target and figures</SampleTag>
            </div>
            <dl className="flex flex-col gap-4">
              {rows.map((r) => {
                const value = total(r.key);
                const target = SAMPLE_DAILY_TARGET[r.key];
                return (
                  <div key={r.key} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5">
                    <dt className="font-semibold">{r.label}</dt>
                    <dd className="text-right"><span className="font-semibold">{value.toLocaleString()}</span> <span className="text-muted">of about {target.toLocaleString()} {r.unit}</span></dd>
                    <dd className="col-span-2 h-2 rounded-full bg-line" aria-hidden="true">
                      <div className={`h-full rounded-full ${r.color}`} style={{ width: `${Math.min(100, (value / target) * 100)}%` }} />
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-4 text-sm text-muted">
              These are estimates to guide you, not exact measurements. Your real target will be worked out from your profile in a later version.
            </p>
          </section>

          <section aria-labelledby="logged-title">
            <h2 id="logged-title" className="mb-2 text-xl">What you&apos;ve logged</h2>
            {entries.length === 0 ? (
              <EmptyState title="Nothing logged today" body="When you eat a meal, open it and tap “I ate this” to add it here."
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
                        {group.map(({ log, meal }) => (
                          <li key={log.id} className="flex items-center gap-3 py-3">
                            <PlateArt parts={meal.plate} seed={meal.slug} size={52} title={meal.name} />
                            <div className="flex min-w-0 flex-1 flex-col">
                              <Link href={`/meals/${meal.slug}`} className="font-semibold hover:underline">{meal.name}</Link>
                              <span className="text-sm text-muted">
                                {log.portion} serving{log.portion === 1 ? "" : "s"}, about {Math.round(meal.kcal * log.portion)} kcal
                              </span>
                            </div>
                            <button type="button" aria-label={`Remove ${meal.name} from today`}
                              onClick={() => { removeLog(log.id); showToast(`Removed ${meal.name}`); }}
                              className="grid size-11 place-items-center rounded-full text-muted hover:bg-error-soft hover:text-error">
                              <Trash2 size={18} aria-hidden="true" />
                            </button>
                          </li>
                        ))}
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
