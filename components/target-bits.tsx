"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { formatWeight, type WeightUnit } from "@/lib/domain/units";
import { MISSING_LABEL, type TargetResult } from "@/lib/domain/targets";
import { ACTIVITY } from "@/lib/options";
import type { Profile } from "@/lib/types";

type Ok = Extract<TargetResult, { status: "ok" }>;

const list = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** Why there's no number: missing details, or a safety rule. Supportive, never judgemental. */
export function TargetMessage({ target, compact = false }: { target: Exclude<TargetResult, Ok>; compact?: boolean }) {
  if (target.status === "incomplete")
    return (
      <div className="flex flex-col gap-3">
        <p>To work out your daily target we need your {list(target.missing.map((m) => MISSING_LABEL[m]))}.</p>
        {!compact && <ButtonLink href="/onboarding" variant="secondary" className="w-fit">Add your details</ButtonLink>}
      </div>
    );
  const text = {
    guidance:
      "You told us you're pregnant, breastfeeding or have a condition that affects what you eat, so we don't set a calorie target. A doctor, midwife or registered dietitian can give you one that's right for you. You can still use meal ideas and log what you eat.",
    "underweight-lose":
      "Your weight is already below the healthy range for your height, so we don't set a weight-loss target. If you're worried about your weight or eating, a doctor or registered dietitian can help. You can change your goal to maintain or gain at any time.",
    under18:
      "Mealwise doesn't set calorie targets for anyone under 18. A doctor, school nurse or parent is the best place to start.",
  }[target.reason];
  return (
    <div className="flex flex-col gap-3">
      <p>{text}</p>
      {!compact && target.reason !== "under18" && (
        <Link href="/profile" className="w-fit font-semibold text-accent hover:underline">Review your profile</Link>
      )}
    </div>
  );
}

/** "How we worked this out": every step of the calculation in plain words. */
export function TargetExplainer({ target, profile, unit }: { target: Ok; profile: Profile; unit: WeightUnit }) {
  const b = target.breakdown;
  const act = ACTIVITY.find((a) => a.value === profile.activity)?.title.toLowerCase() ?? "";
  const change =
    b.adjustment === 0 || profile.goal === "maintain"
      ? "No change, because your goal is to stay at your weight."
      : `${b.adjustment > 0 ? "+" : "−"}${Math.abs(b.adjustment).toLocaleString()} kcal a day for your goal${b.capApplied ? ` (we usually use ${b.plannedAdjustment > 0 ? "+" : "−"}${Math.abs(b.plannedAdjustment)}, but kept it smaller to stay at a safe pace)` : ""}.`;
  const pace = Math.abs(b.weeklyChangeKg) < 0.05 ? null : `That's roughly ${formatWeight(Math.abs(b.weeklyChangeKg), unit)} a week ${b.weeklyChangeKg < 0 ? "lost" : "gained"}, if the estimate is right for you.`;
  return (
    <details className="group rounded-[var(--radius-md)] border border-line bg-paper/40 px-4 py-3">
      <summary className="cursor-pointer font-semibold text-accent">How we worked this out</summary>
      <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm">
        <li>
          Energy your body uses at rest: about <strong>{b.bmr.toLocaleString()} kcal</strong>, from your age ({b.age}), height, weight
          and {b.sexMidpoint ? "the average of the male and female equations, because you haven't told us your sex" : `sex (${profile.sex})`}.
          We use the Mifflin-St Jeor equation, a widely used method.
        </li>
        <li>
          Multiplied by {b.activityFactor} for being {act}: about <strong>{b.tdee.toLocaleString()} kcal</strong> a day to stay the same weight.
        </li>
        <li>{change} {pace}</li>
        {b.floorApplied && <li>We never suggest less than {b.floor.toLocaleString()} kcal a day, so your target is set at that.</li>}
        <li>
          Rounded to the nearest 50: <strong>{target.kcal.toLocaleString()} kcal</strong>.
        </li>
        <li>
          Protein about {b.proteinPerKg} g per kg of {b.bmi > 25 ? `a healthy reference weight for your height (${formatWeight(b.proteinRefKg, unit)})` : "body weight"} ({target.protein} g),
          fat about 30% of energy ({target.fat} g), and carbohydrate the rest ({target.carbs} g). This is a guide, not a prescription.
        </li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        Everyone&apos;s body is different, so treat this as a starting point. Watch your weight trend over a few weeks and adjust. Mealwise isn&apos;t
        medical advice; a doctor or registered dietitian can give you personal guidance.
      </p>
    </details>
  );
}

/** The daily target card used on the profile page. */
export function TargetCard({ target, profile, unit }: { target: TargetResult; profile: Profile; unit: WeightUnit }) {
  return (
    <section id="target" aria-labelledby="target-title" className="flex scroll-mt-24 flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-5">
      <h2 id="target-title" className="text-xl">Daily target</h2>
      {target.status === "ok" ? (
        <>
          <p className="flex flex-col">
            <span className="font-display text-3xl font-semibold">About {target.kcal.toLocaleString()} kcal</span>
            <span className="text-muted">a day (estimate)</span>
          </p>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {([["Protein", target.protein], ["Carbs", target.carbs], ["Fat", target.fat]] as const).map(([k, v]) => (
              <div key={k} className="rounded-[var(--radius-md)] bg-surface-2 px-2 py-3">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="font-semibold">{v} g</dd>
              </div>
            ))}
          </dl>
          {target.notes.map((n) => (
            <p key={n} role="note" className="rounded-[var(--radius-md)] bg-plantain-soft px-4 py-3 text-sm">{n}</p>
          ))}
          <TargetExplainer target={target} profile={profile} unit={unit} />
        </>
      ) : (
        <TargetMessage target={target} />
      )}
    </section>
  );
}

/** One yes/no answer. We store only that guidance is needed, never which condition. */
export function GuidanceCheck({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-4">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]" />
      <span className="flex flex-col gap-1">
        <span className="font-semibold">I&apos;m pregnant or breastfeeding, or I have a medical condition that affects what I eat</span>
        <span className="text-sm text-muted">
          If so, we won&apos;t set a calorie target, because you need personal advice from a doctor, midwife or dietitian. We don&apos;t
          ask or store which one applies.
        </span>
      </span>
    </label>
  );
}
