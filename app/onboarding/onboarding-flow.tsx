"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo, PrototypeBanner } from "@/components/app-shell";
import { Button, Chip, Field, Segmented, inputClass } from "@/components/ui";
import { feetInchesToCm, parseWeight, round } from "@/lib/domain/units";
import { useStore } from "@/lib/prototype-store";
import { ACTIVITY, ALLERGENS, BUDGET_LABELS, CUISINES, DIETS, GOALS, PREP_LABELS } from "@/lib/options";
import type { Profile, Units } from "@/lib/types";

const STEPS = ["Your goal", "About you", "Activity", "Food you eat", "Budget and time", "Summary"];

function ChoiceCard({ selected, title, body, onClick }: { selected: boolean; title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick}
      className={`flex w-full flex-col items-start gap-1 rounded-[var(--radius-md)] border-2 p-4 text-left transition-colors ${
        selected ? "border-leaf bg-leaf-soft" : "border-line bg-surface hover:border-leaf/50"
      }`}>
      <span className="font-display text-lg font-semibold">{title}</span>
      <span className="text-sm text-muted">{body}</span>
    </button>
  );
}

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function OnboardingFlow() {
  const router = useRouter();
  const { setProfile, showToast, today } = useStore();
  const thisYear = today ? Number(today.slice(0, 4)) : 2100;
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>({ displayName: "", units: "metric", diet: [], allergies: [], dislikes: [], cuisines: [] });
  const [raw, setRaw] = useState({ birthYear: "", cm: "", ft: "", inch: "", weight: "", target: "", dislikes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const update = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));
  const wUnit = p.units === "metric" ? "kg" : "lb";

  const birthYear = Number(raw.birthYear);
  const isMinor = raw.birthYear.length === 4 && birthYear > thisYear - 18 && birthYear <= thisYear;

  function validateAboutYou(): boolean {
    const e: Record<string, string> = {};
    const patch: Partial<Profile> = {};
    if (!/^\d{4}$/.test(raw.birthYear) || birthYear < thisYear - 110 || birthYear > thisYear) {
      e.birthYear = "Enter the year you were born, for example 1994.";
    } else if (isMinor) {
      e.birthYear = "Mealwise is for adults aged 18 and over.";
    } else patch.birthYear = birthYear;

    if (p.units === "metric") {
      const cm = Number(raw.cm);
      if (raw.cm && (!(cm >= 100 && cm <= 250))) e.height = "Enter a height between 100 and 250 cm.";
      else if (raw.cm) patch.heightCm = round(cm, 1);
    } else if (raw.ft || raw.inch) {
      const ft = Number(raw.ft || 0);
      const inch = Number(raw.inch || 0);
      const cm = feetInchesToCm(ft, inch);
      if (!(ft >= 3 && ft <= 8) || !(inch >= 0 && inch < 12) || cm < 100 || cm > 250)
        e.height = "Enter feet (3–8) and inches (0–11).";
      else patch.heightCm = cm;
    }
    for (const [key, field] of [["weight", "weightKg"], ["target", "targetWeightKg"]] as const) {
      if (raw[key]) {
        const r = parseWeight(raw[key], wUnit);
        if (r.ok) patch[field] = r.kg;
        else e[key] = r.error;
      }
    }
    setErrors(e);
    if (Object.keys(e).length) return false;
    update(patch);
    return true;
  }

  function next() {
    if (step === 0 && !p.goal) {
      setErrors({ goal: "Choose a goal to continue." });
      return;
    }
    if (step === 1 && !validateAboutYou()) return;
    if (step === 3) update({ dislikes: raw.dislikes.split(",").map((s) => s.trim()).filter(Boolean) });
    setErrors({});
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  }

  function finish() {
    setProfile({ ...p, displayName: p.displayName.trim() || "Friend" });
    showToast("Setup complete. Showing sample meals.");
    router.push("/home");
  }

  const skippable = step === 3 || step === 4;
  const goalLabel = GOALS.find((g) => g.value === p.goal)?.title;

  return (
    <div className="flex min-h-dvh flex-col">
      <PrototypeBanner />
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Mealwise welcome page"><Logo /></Link>
          <p className="text-sm text-muted" aria-live="polite">Step {step + 1} of {STEPS.length}</p>
        </div>
        <div className="h-1.5 rounded-full bg-line" aria-hidden="true">
          <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <main id="main" className="flex flex-1 flex-col gap-6">
          <h1 className="text-3xl">{STEPS[step]}</h1>

          {step === 0 && (
            <div role="radiogroup" aria-label="Your goal" className="flex flex-col gap-3">
              {GOALS.map((g) => (
                <ChoiceCard key={g.value} selected={p.goal === g.value} title={g.title} body={g.body}
                  onClick={() => { update({ goal: g.value }); setErrors({}); }} />
              ))}
              {errors.goal && <p role="alert" className="font-medium text-error">{errors.goal}</p>}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <Field id="name" label="What should we call you? (optional)">
                <input id="name" className={inputClass} autoComplete="given-name" value={p.displayName}
                  onChange={(e) => update({ displayName: e.target.value })} />
              </Field>
              <Field id="birthYear" label="Year you were born" error={errors.birthYear}
                hint="We only use this to check you're 18 or over and to estimate your energy needs.">
                <input id="birthYear" inputMode="numeric" maxLength={4} className={inputClass} value={raw.birthYear}
                  aria-invalid={!!errors.birthYear}
                  aria-describedby={errors.birthYear ? "birthYear-error" : "birthYear-hint"}
                  onChange={(e) => setRaw({ ...raw, birthYear: e.target.value.replace(/\D/g, "") })} />
              </Field>
              {isMinor && (
                <div role="status" className="rounded-[var(--radius-md)] bg-plantain-soft p-4 text-sm">
                  Mealwise is designed for adults. If you&apos;re under 18 and want help with food or weight, a doctor,
                  school nurse or parent is the best place to start.
                </div>
              )}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Units</span>
                <Segmented<Units> label="Units" value={p.units} onChange={(units) => update({ units })}
                  options={[{ value: "metric", label: "kg and cm" }, { value: "imperial", label: "lb and ft" }]} />
              </div>
              {p.units === "metric" ? (
                <Field id="cm" label="Height in cm (optional)" error={errors.height}>
                  <input id="cm" inputMode="decimal" className={inputClass} value={raw.cm} aria-invalid={!!errors.height}
                    onChange={(e) => setRaw({ ...raw, cm: e.target.value })} />
                </Field>
              ) : (
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="mb-1.5 text-sm font-semibold">Height (optional)</legend>
                  <div className="flex gap-3">
                    <label className="flex flex-1 items-center gap-2">
                      <input aria-label="Feet" inputMode="numeric" className={inputClass} value={raw.ft}
                        onChange={(e) => setRaw({ ...raw, ft: e.target.value })} /> ft
                    </label>
                    <label className="flex flex-1 items-center gap-2">
                      <input aria-label="Inches" inputMode="numeric" className={inputClass} value={raw.inch}
                        onChange={(e) => setRaw({ ...raw, inch: e.target.value })} /> in
                    </label>
                  </div>
                  {errors.height && <p role="alert" className="text-sm font-medium text-error">{errors.height}</p>}
                </fieldset>
              )}
              <Field id="weight" label={`Current weight in ${wUnit} (optional)`} error={errors.weight}>
                <input id="weight" inputMode="decimal" className={inputClass} value={raw.weight} aria-invalid={!!errors.weight}
                  onChange={(e) => setRaw({ ...raw, weight: e.target.value })} />
              </Field>
              {p.goal !== "maintain" && (
                <Field id="target" label={`Target weight in ${wUnit} (optional)`} error={errors.target}>
                  <input id="target" inputMode="decimal" className={inputClass} value={raw.target} aria-invalid={!!errors.target}
                    onChange={(e) => setRaw({ ...raw, target: e.target.value })} />
                </Field>
              )}
            </div>
          )}

          {step === 2 && (
            <div role="radiogroup" aria-label="Activity level" className="flex flex-col gap-3">
              {ACTIVITY.map((a) => (
                <ChoiceCard key={a.value} selected={p.activity === a.value} title={a.title} body={a.body}
                  onClick={() => update({ activity: a.value })} />
              ))}
              <p className="text-sm text-muted">Not sure? Pick the closest one. You can change it later.</p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <ChipGroup label="Do you follow any of these?" options={DIETS} value={p.diet} onChange={(diet) => update({ diet })} />
              <ChipGroup label="Allergies or foods you can't eat" options={ALLERGENS} value={p.allergies}
                onChange={(allergies) => update({ allergies })} />
              <Field id="dislikes" label="Foods you don't like" hint="Separate with commas, for example okra, liver.">
                <input id="dislikes" className={inputClass} value={raw.dislikes} aria-describedby="dislikes-hint"
                  onChange={(e) => setRaw({ ...raw, dislikes: e.target.value })} />
              </Field>
              <ChipGroup label="Cuisines you enjoy" options={CUISINES} value={p.cuisines} onChange={(cuisines) => update({ cuisines })} />
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6">
              <ChipGroup label="Food budget per meal" single
                options={["low", "medium", "high"]} labels={BUDGET_LABELS}
                value={p.budget ? [p.budget] : []} onChange={(v) => update({ budget: v[0] as Profile["budget"] })} />
              <ChipGroup label="Most time you want to spend cooking" single
                options={["15", "30", "45", "60", "0"]} labels={PREP_LABELS}
                value={p.maxPrepMinutes !== undefined ? [String(p.maxPrepMinutes)] : []}
                onChange={(v) => update({ maxPrepMinutes: v[0] === undefined ? undefined : Number(v[0]) })} />
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-4">
              <dl className="divide-y divide-line rounded-[var(--radius-md)] border border-line bg-surface">
                {[
                  ["Goal", goalLabel],
                  ["Name", p.displayName || "Not given"],
                  ["Born", p.birthYear],
                  ["Activity", ACTIVITY.find((a) => a.value === p.activity)?.title ?? "Not given"],
                  ["Eating style", p.diet.join(", ") || "No restrictions"],
                  ["Allergies", p.allergies.join(", ") || "None given"],
                  ["Dislikes", p.dislikes.join(", ") || "None given"],
                  ["Budget", p.budget ? BUDGET_LABELS[p.budget] : "Not given"],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right font-medium">{String(v)}</dd>
                  </div>
                ))}
              </dl>
              <p className="rounded-[var(--radius-md)] bg-plantain-soft p-4 text-sm">
                In the full app, your daily calorie target is worked out from these answers and explained step by step.
                This prototype doesn&apos;t calculate it yet, so you&apos;ll see sample figures.
              </p>
            </div>
          )}
        </main>

        <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-paper py-4">
          {step > 0 && (
            <Button variant="ghost" onClick={() => { setErrors({}); setStep((s) => s - 1); }} aria-label="Back">
              <ArrowLeft size={18} aria-hidden="true" /> Back
            </Button>
          )}
          <div className="flex-1" />
          {skippable && <Button variant="secondary" onClick={() => setStep((s) => s + 1)}>Skip</Button>}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={step === 1 && isMinor}>Continue</Button>
          ) : (
            <Button onClick={finish}>Show me meals</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChipGroup({
  label, options, value, onChange, labels, single,
}: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void;
  labels?: Record<string, string>; single?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} selected={value.includes(o)}
            onClick={() => onChange(single ? (value.includes(o) ? [] : [o]) : toggle(value, o))}>
            {labels?.[o] ?? o}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
