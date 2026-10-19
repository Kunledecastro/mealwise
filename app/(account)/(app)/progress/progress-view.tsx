"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DemoStateView, useDemoState } from "@/components/meal-bits";
import { Button, EmptyState, Field, PageTitle, Segmented, SkeletonRows, inputClass } from "@/components/ui";
import { weeklyTrend } from "@/lib/domain/tracking";
import { formatWeight, kgToLb, parseWeight, round, type WeightUnit } from "@/lib/domain/units";
import { useStore } from "@/lib/prototype-store";
import { fromISODate } from "@/lib/dates";
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
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" />
          <text x={P.l - 8} y={y(v) + 4} textAnchor="end" fontSize="13" fill="var(--color-muted)">{round(v, 0)}</text>
        </g>
      ))}
      {targetKg && (
        <g>
          <line x1={P.l} x2={W - P.r} y1={y(conv(targetKg))} y2={y(conv(targetKg))} stroke="var(--color-fresh)" strokeWidth="2" strokeDasharray="6 5" />
          <text x={W - P.r} y={y(conv(targetKg)) - 6} textAnchor="end" fontSize="13" fill="var(--color-fresh)">Target</text>
        </g>
      )}
      <defs>
        <linearGradient id="weight-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f6b23c" stopOpacity="0.32" />
          <stop offset="1" stopColor="#f6b23c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${pts[0][0]},${H - P.b} ${pts.map((p) => `L${p[0]},${p[1]}`).join(" ")} L${pts[pts.length - 1][0]},${H - P.b} Z`} fill="url(#weight-fill)" />
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" className="draw-line" pathLength={400} />
      {pts.map(([px, py], i) => <circle key={i} cx={px} cy={py} r={i === pts.length - 1 ? 6 : 4} fill={i === pts.length - 1 ? "var(--color-accent)" : "var(--color-paper)"} stroke="var(--color-accent)" strokeWidth="2" />)}
      <text x={P.l} y={H - 8} fontSize="13" fill="var(--color-muted)">{fmtDate(entries[0].date)}</text>
      <text x={W - P.r} y={H - 8} textAnchor="end" fontSize="13" fill="var(--color-muted)">{fmtDate(entries[entries.length - 1].date)}</text>
    </svg>
  );
}

export function ProgressView() {
  const demo = useDemoState();
  const { weights, upsertWeight, removeWeight, profile, setProfile, showToast, today: todayOrNull, trackingStatus } = useStore();
  const unit: WeightUnit = profile.units === "metric" ? "kg" : "lb";
  const entries = demo === "empty" ? [] : weights;
  const today = todayOrNull ?? "";

  const [editing, setEditing] = useState<string | undefined>();
  const [chosenDate, setDate] = useState("");
  const date = chosenDate || today;
  const [value, setValue] = useState("");
  const [errors, setErrors] = useState<{ date?: string; value?: string }>({});
  const [confirmDelete, setConfirmDelete] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function startEdit(e: WeightEntry) {
    setEditing(e.id);
    setDate(e.date);
    setValue(String(round(unit === "kg" ? e.kg : kgToLb(e.kg))));
    setErrors({});
    document.getElementById("weight-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const errs: typeof errors = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errs.date = "Choose a date.";
    else if (date > today) errs.date = "The date can't be in the future.";
    const parsed = parseWeight(value, unit);
    if (!parsed.ok) errs.value = parsed.error;
    setErrors(errs);
    if (Object.keys(errs).length || !parsed.ok) return;
    setSaving(true);
    const saved = await upsertWeight(date, parsed.kg, unit, editing);
    setSaving(false);
    if (!saved) return;
    showToast(editing ? "Weight updated" : "Weight added");
    setEditing(undefined);
    setValue("");
    setDate("");
  }

  const latest = entries[entries.length - 1];
  const trend = todayOrNull ? weeklyTrend(entries, todayOrNull) : null;
  const change = entries.length > 1 ? latest.kg - entries[0].kg : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle sub="Your weight over time.">Progress</PageTitle>
        <Segmented<WeightUnit> label="Weight unit" value={unit}
          onChange={(u) => setProfile({ ...profile, units: u === "kg" ? "metric" : "imperial" })}
          options={[{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }]} />
      </div>

      {todayOrNull === null || trackingStatus === "loading" ? (
        <SkeletonRows count={2} />
      ) : demo && demo !== "empty" ? (
        <DemoStateView state={demo} />
      ) : trackingStatus === "error" ? (
        <EmptyState title="Your weights didn't load" body="Check your connection, then reload the page." />
      ) : entries.length === 0 ? (
        <EmptyState title="No weights yet" body="Add your first weight below to start seeing your trend. Weekly is plenty." />
      ) : (
        <section aria-labelledby="trend-title" className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="trend-title" className="text-xl">Trend</h2>
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
          {trend && (
            <p className="mt-3">
              Over the last {Math.round(trend.days / 7)} weeks:{" "}
              <span className="font-semibold">
                {Math.abs(trend.kgPerWeek) < 0.05 ? "steady" : `about ${formatWeight(Math.abs(trend.kgPerWeek), unit)} a week ${trend.kgPerWeek < 0 ? "down" : "up"}`}
              </span>
            </p>
          )}
          {trend?.tooFast && (
            <p role="note" className="mt-3 rounded-[var(--radius-md)] bg-plantain-soft px-4 py-3 text-sm">
              You&apos;re losing more than about 1% of your weight a week. Slower loss is usually easier to keep off and safer.
              If you&apos;re not trying to lose this fast, or you feel unwell, talk to a doctor.
            </p>
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
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add weight"}</Button>
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
                    <Button variant="danger" onClick={async () => { setConfirmDelete(undefined); if (await removeWeight(e.id)) showToast("Weight deleted"); }}>Delete</Button>
                    <Button variant="ghost" onClick={() => setConfirmDelete(undefined)}>Keep</Button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => startEdit(e)} disabled={e.id.startsWith("pending-")} aria-label={`Edit weight for ${e.date}`}
                      className="grid size-11 place-items-center rounded-full text-accent hover:bg-accent-soft"><Pencil size={18} aria-hidden="true" /></button>
                    <button type="button" onClick={() => setConfirmDelete(e.id)} disabled={e.id.startsWith("pending-")} aria-label={`Delete weight for ${e.date}`}
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
