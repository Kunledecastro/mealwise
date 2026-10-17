"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DemoStateView, useDemoState } from "@/components/meal-bits";
import { Button, EmptyState, Field, PageTitle, SampleTag, Segmented, SkeletonRows, inputClass } from "@/components/ui";
import { formatWeight, kgToLb, parseWeight, round, type WeightUnit } from "@/lib/domain/units";
import { useStore } from "@/lib/prototype-store";
import { fromISODate } from "@/lib/sample-data";
import type { WeightEntry } from "@/lib/types";

function WeightChart({ entries, unit, targetKg }: { entries: WeightEntry[]; unit: WeightUnit; targetKg?: number }) {
  const W = 400, H = 220, P = { l: 40, r: 12, t: 18, b: 30 };
  const conv = (kg: number) => (unit === "kg" ? kg : kgToLb(kg));
  const values = entries.map((e) => conv(e.kg));
  const all = targetKg ? [...values, conv(targetKg)] : values;
  const min = Math.floor(Math.min(...all) - 1);
  const max = Math.ceil(Math.max(...all) + 1);
  const times = entries.map((e) => fromISODate(e.date).getTime());
  const t0 = times[0], t1 = times[times.length - 1];
  const x = (t: number) => P.l + (t1 === t0 ? (W - P.l - P.r) / 2 : ((t - t0) / (t1 - t0)) * (W - P.l - P.r));
  const y = (v: number) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const pts = entries.map((e, i) => [x(times[i]), y(values[i])] as const);
  const fmtDate = (d: string) => fromISODate(d).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  const first = values[0], last = values[values.length - 1];
  const summary = `Weight chart, ${entries.length} entries from ${fmtDate(entries[0].date)} to ${fmtDate(entries[entries.length - 1].date)}, from ${round(first)} to ${round(last)} ${unit}.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={summary}>
      {[min, (min + max) / 2, max].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="#d9e1d6" />
          <text x={P.l - 8} y={y(v) + 4} textAnchor="end" fontSize="13" fill="#55645a">{round(v, 0)}</text>
        </g>
      ))}
      {targetKg && (
        <g>
          <line x1={P.l} x2={W - P.r} y1={y(conv(targetKg))} y2={y(conv(targetKg))} stroke="#f4b53f" strokeWidth="2" strokeDasharray="6 5" />
          <text x={W - P.r} y={y(conv(targetKg)) - 6} textAnchor="end" fontSize="13" fill="#7a5410">Target</text>
        </g>
      )}
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#1e5b3c" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([px, py], i) => <circle key={i} cx={px} cy={py} r={i === pts.length - 1 ? 6 : 4} fill={i === pts.length - 1 ? "#1e5b3c" : "#fff"} stroke="#1e5b3c" strokeWidth="2" />)}
      <text x={P.l} y={H - 8} fontSize="13" fill="#55645a">{fmtDate(entries[0].date)}</text>
      <text x={W - P.r} y={H - 8} textAnchor="end" fontSize="13" fill="#55645a">{fmtDate(entries[entries.length - 1].date)}</text>
    </svg>
  );
}

export function ProgressView() {
  const demo = useDemoState();
  const { weights, upsertWeight, removeWeight, profile, setProfile, showToast, today: todayOrNull } = useStore();
  const unit: WeightUnit = profile.units === "metric" ? "kg" : "lb";
  const entries = demo === "empty" ? [] : weights;
  const today = todayOrNull ?? "";

  const [editing, setEditing] = useState<string | undefined>();
  const [chosenDate, setDate] = useState("");
  const date = chosenDate || today;
  const [value, setValue] = useState("");
  const [errors, setErrors] = useState<{ date?: string; value?: string }>({});
  const [confirmDelete, setConfirmDelete] = useState<string | undefined>();

  function startEdit(e: WeightEntry) {
    setEditing(e.id);
    setDate(e.date);
    setValue(String(round(unit === "kg" ? e.kg : kgToLb(e.kg))));
    setErrors({});
    document.getElementById("weight-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const errs: typeof errors = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errs.date = "Choose a date.";
    else if (date > today) errs.date = "The date can't be in the future.";
    const parsed = parseWeight(value, unit);
    if (!parsed.ok) errs.value = parsed.error;
    setErrors(errs);
    if (Object.keys(errs).length || !parsed.ok) return;
    upsertWeight(date, parsed.kg, editing);
    showToast(editing ? "Weight updated" : "Weight added");
    setEditing(undefined);
    setValue("");
    setDate("");
  }

  const latest = entries[entries.length - 1];
  const change = entries.length > 1 ? latest.kg - entries[0].kg : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle sub="Your weight over time.">Progress</PageTitle>
        <Segmented<WeightUnit> label="Weight unit" value={unit}
          onChange={(u) => setProfile({ ...profile, units: u === "kg" ? "metric" : "imperial" })}
          options={[{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }]} />
      </div>

      {todayOrNull === null ? (
        <SkeletonRows count={2} />
      ) : demo && demo !== "empty" ? (
        <DemoStateView state={demo} />
      ) : entries.length === 0 ? (
        <EmptyState title="No weights yet" body="Add your first weight below to start seeing your trend. Weekly is plenty." />
      ) : (
        <section aria-labelledby="trend-title" className="rounded-[var(--radius-lg)] bg-surface p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="trend-title" className="text-xl">Trend</h2>
            <SampleTag>Sample entries</SampleTag>
          </div>
          <p className="mb-4">
            <span className="font-display text-3xl font-semibold">{formatWeight(latest.kg, unit)}</span>
            {entries.length > 1 && (
              <span className="ml-2 text-muted">
                {Math.abs(change) < 0.05 ? "no change" : `${change < 0 ? "down" : "up"} ${formatWeight(Math.abs(change), unit)}`} since{" "}
                {fromISODate(entries[0].date).toLocaleDateString("en-NG", { day: "numeric", month: "long" })}
              </span>
            )}
          </p>
          {entries.length > 1 ? (
            <WeightChart entries={entries} unit={unit} targetKg={profile.targetWeightKg} />
          ) : (
            <p className="text-muted">Add another entry to see your trend line.</p>
          )}
          <p className="mt-3 text-sm text-muted">Day-to-day weight naturally moves up and down. Look at the overall direction over weeks.</p>
        </section>
      )}

      <section aria-labelledby="add-title" className="rounded-[var(--radius-lg)] border border-line p-5">
        <h2 id="add-title" className="mb-4 text-xl">{editing ? "Edit weight" : "Add weight"}</h2>
        <form id="weight-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
          <Field id="w-date" label="Date" error={errors.date}>
            <input id="w-date" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)}
              className={inputClass} aria-invalid={!!errors.date} aria-describedby={errors.date ? "w-date-error" : undefined} />
          </Field>
          <Field id="w-value" label={`Weight (${unit})`} error={errors.value}>
            <input id="w-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)}
              className={inputClass} aria-invalid={!!errors.value} aria-describedby={errors.value ? "w-value-error" : undefined} />
          </Field>
          <div className="flex gap-2 sm:pt-7">
            <Button type="submit">{editing ? "Save changes" : "Add weight"}</Button>
            {editing && <Button type="button" variant="ghost" onClick={() => { setEditing(undefined); setValue(""); setDate(""); setErrors({}); }}>Cancel</Button>}
          </div>
        </form>
        <p className="mt-3 text-sm text-muted">One entry per day. Adding a weight on a date that already has one replaces it.</p>
      </section>

      {entries.length > 0 && !demo && (
        <section aria-labelledby="history-title">
          <h2 id="history-title" className="mb-2 text-xl">History</h2>
          <ul className="divide-y divide-line">
            {[...entries].reverse().map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span className="flex-1">
                  <span className="block font-semibold">{formatWeight(e.kg, unit)}</span>
                  <span className="text-sm text-muted">{fromISODate(e.date).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                </span>
                {confirmDelete === e.id ? (
                  <>
                    <Button variant="danger" onClick={() => { removeWeight(e.id); setConfirmDelete(undefined); showToast("Weight deleted"); }}>Delete</Button>
                    <Button variant="ghost" onClick={() => setConfirmDelete(undefined)}>Keep</Button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => startEdit(e)} aria-label={`Edit weight for ${e.date}`}
                      className="grid size-11 place-items-center rounded-full text-leaf hover:bg-leaf-soft"><Pencil size={18} aria-hidden="true" /></button>
                    <button type="button" onClick={() => setConfirmDelete(e.id)} aria-label={`Delete weight for ${e.date}`}
                      className="grid size-11 place-items-center rounded-full text-muted hover:bg-error-soft hover:text-error"><Trash2 size={18} aria-hidden="true" /></button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
