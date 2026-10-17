import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PlateArt } from "@/components/plate-art";
import { SampleTag } from "@/components/ui";
import { formatMinutes, formatNairaRange } from "@/lib/domain/meals";
import { SAMPLE_MEALS } from "@/lib/sample-data";
import { MEAL_TYPE_LABEL } from "@/lib/types";
import { MealActions, WhyThisSuits } from "./meal-actions";

export function generateStaticParams() {
  return SAMPLE_MEALS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata(props: PageProps<"/meals/[slug]">) {
  const { slug } = await props.params;
  return { title: SAMPLE_MEALS.find((m) => m.slug === slug)?.name ?? "Meal not found" };
}

export default async function MealPage(props: PageProps<"/meals/[slug]">) {
  const { slug } = await props.params;
  const meal = SAMPLE_MEALS.find((m) => m.slug === slug);
  if (!meal) notFound();

  const macros = [
    { label: "Protein", g: meal.protein, kcal: meal.protein * 4, color: "bg-leaf" },
    { label: "Carbs", g: meal.carbs, kcal: meal.carbs * 4, color: "bg-plantain" },
    { label: "Fat", g: meal.fat, kcal: meal.fat * 9, color: "bg-pepper" },
  ];
  const macroKcal = macros.reduce((s, m) => s + m.kcal, 0);

  return (
    <article className="flex flex-col gap-8">
      <Link href={`/meals?slot=${meal.mealTypes[0]}`} className="inline-flex w-fit items-center gap-1 font-semibold text-leaf hover:underline">
        <ArrowLeft size={18} aria-hidden="true" /> Meal ideas
      </Link>

      <header className="grid items-center gap-6 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <PlateArt parts={meal.plate} seed={meal.slug} size={320} animate className="mx-auto h-auto w-full max-w-80" title={meal.name} />
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-leaf">
            Good for {meal.mealTypes.map((t) => MEAL_TYPE_LABEL[t].toLowerCase()).join(" or ")}
          </p>
          <h1 className="text-3xl sm:text-4xl">{meal.name}</h1>
          <p className="text-lg text-muted">{meal.description}</p>
          <ul className="flex flex-wrap gap-2" aria-label="Cuisine and dietary tags">
            {[meal.cuisine, ...meal.tags].map((t) => <li key={t} className="rounded-full border border-line px-3 py-1 text-sm">{t}</li>)}
          </ul>
          <MealActions slug={meal.slug} />
        </div>
      </header>

      <WhyThisSuits slug={meal.slug} />

      <section aria-labelledby="facts-title" className="rounded-[var(--radius-lg)] bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="facts-title" className="text-xl">Per serving</h2>
          <SampleTag />
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><dt className="text-sm text-muted">Serving</dt><dd className="font-semibold">{meal.serving}</dd></div>
          <div><dt className="text-sm text-muted">Time</dt><dd className="font-semibold">{formatMinutes(meal.prepMinutes)}</dd></div>
          <div><dt className="text-sm text-muted">Estimated cost</dt><dd className="font-semibold">{formatNairaRange(meal.costLow, meal.costHigh)}</dd></div>
          <div><dt className="text-sm text-muted">Estimated energy</dt><dd className="font-semibold">about {meal.kcal} kcal</dd></div>
        </dl>
        <div className="mt-5 flex h-3 overflow-hidden rounded-full" aria-hidden="true">
          {macros.map((m) => <div key={m.label} className={m.color} style={{ width: `${(m.kcal / macroKcal) * 100}%` }} />)}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {macros.map((m) => (
            <li key={m.label} className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${m.color}`} aria-hidden="true" />
              {m.label} <span className="font-semibold">about {m.g} g</span>
            </li>
          ))}
        </ul>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-semibold text-leaf">How these figures are estimated</summary>
          <p className="mt-2 max-w-prose text-muted">
            In this prototype, these numbers are placeholders. In the full app they are calculated from each
            ingredient&apos;s weight and published food-composition data, with the source shown here. Cooking oil, portion
            size and recipe differences can change the real values, so treat them as estimates. Prices are ranges with
            the date they were checked.
          </p>
        </details>
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="ing-title">
          <h2 id="ing-title" className="mb-3 text-xl">Ingredients</h2>
          <ul className="divide-y divide-line">
            {meal.ingredients.map((i) => (
              <li key={i.name} className="flex justify-between gap-4 py-2.5">
                <span>{i.name}</span>
                <span className="text-right text-muted">{i.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">
            {meal.allergens.length ? `Contains: ${meal.allergens.join(", ")}.` : "No common allergens listed in this sample."}{" "}
            Always check labels if you have an allergy.
          </p>
        </section>
        <section aria-labelledby="steps-title">
          <h2 id="steps-title" className="mb-3 text-xl">How to make it</h2>
          <ol className="flex flex-col gap-3">
            {meal.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-leaf-soft text-sm font-bold text-leaf" aria-hidden="true">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}
