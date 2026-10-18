import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EstimateTag } from "@/components/ui";
import { CATALOGUE_VERSION, MEALS, getMeal } from "@/catalogue";
import { NUTRITION_SOURCES } from "@/catalogue/sources";
import { formatMinutes, formatNairaRange } from "@/lib/domain/meals";
import { MEAL_TYPE_LABEL } from "@/lib/types";
import { MealActions, PriceNote, ProfileClashFor, WhyThisSuits } from "./meal-actions";
import { MealVisual, PhotoCredit } from "@/components/meal-visual";

export function generateStaticParams() {
  return MEALS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata(props: PageProps<"/meals/[slug]">) {
  const { slug } = await props.params;
  return { title: getMeal(slug)?.name ?? "Meal not found" };
}

export default async function MealPage(props: PageProps<"/meals/[slug]">) {
  const { slug } = await props.params;
  const meal = getMeal(slug);
  if (!meal) notFound();
  const sources = NUTRITION_SOURCES.filter((s) => meal.sources?.includes(s.shortName));
  const halalNote = meal.containsMeat;

  const macros = [
    { label: "Protein", g: meal.protein, kcal: meal.protein * 4, color: "bg-fresh" },
    { label: "Carbs", g: meal.carbs, kcal: meal.carbs * 4, color: "bg-accent" },
    { label: "Fat", g: meal.fat, kcal: meal.fat * 9, color: "bg-pepper" },
  ];
  const macroKcal = macros.reduce((s, m) => s + m.kcal, 0);

  return (
    <article className="flex flex-col gap-8">
      <Link href={`/meals?slot=${meal.mealTypes[0]}`} className="inline-flex w-fit items-center gap-1 font-semibold text-accent hover:underline">
        <ArrowLeft size={18} aria-hidden="true" /> Meal ideas
      </Link>

      <header className="grid items-center gap-6 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative mx-auto w-full max-w-80">
          <div className="aura" aria-hidden="true" />
          <MealVisual meal={meal} size={320} shape="card" animate priority sizes="(max-width: 640px) 92vw, 320px" className="relative w-full" />
          <PhotoCredit meal={meal} className="relative mt-3" />
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-accent">
            Good for {meal.mealTypes.map((t) => MEAL_TYPE_LABEL[t].toLowerCase()).join(" or ")}
          </p>
          <h1 className="text-4xl sm:text-5xl">{meal.name}</h1>
          <p className="text-lg text-muted">{meal.description}</p>
          <ul className="flex flex-wrap gap-2" aria-label="Cuisine and dietary tags">
            {[meal.cuisine, ...meal.tags].map((t) => <li key={t} className="rounded-full border border-line bg-surface px-3 py-1 text-sm">{t}</li>)}
          </ul>
          <MealActions slug={meal.slug} />
          <ProfileClashFor slug={meal.slug} />
        </div>
      </header>

      <WhyThisSuits slug={meal.slug} />

      <section aria-labelledby="facts-title" className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="facts-title" className="text-xl">Per serving</h2>
          <EstimateTag />
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><dt className="text-sm text-muted">Serving</dt><dd className="font-semibold">{meal.serving}</dd></div>
          <div><dt className="text-sm text-muted">Time</dt><dd className="font-semibold">{formatMinutes(meal.prepMinutes)}</dd></div>
          <div><dt className="text-sm text-muted">Estimated cost</dt><dd className="font-semibold">{formatNairaRange(meal.costLow, meal.costHigh)}<PriceNote priceDate={meal.priceDate ?? null} /></dd></div>
          <div><dt className="text-sm text-muted">Estimated energy</dt><dd className="font-semibold">about {meal.kcal} kcal</dd></div>
        </dl>
        <div className="mt-5 flex h-3 overflow-hidden rounded-full" aria-hidden="true">
          {macros.map((m) => <div key={m.label} className={m.color} style={{ width: `${(m.kcal / macroKcal) * 100}%` }} />)}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {macros.map((m) => (
            <li key={m.label} className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${m.color}`} aria-hidden="true" />
              {m.label} <span className="font-semibold">about {Math.round(m.g)} g</span>
            </li>
          ))}
          {meal.fibre !== undefined && (
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full border border-muted" aria-hidden="true" />
              Fibre <span className="font-semibold">about {Math.round(meal.fibre)} g</span>
            </li>
          )}
        </ul>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-semibold text-accent">How these figures are estimated</summary>
          <div className="mt-2 flex max-w-prose flex-col gap-3 text-muted">
            <p>
              We add up each ingredient&apos;s weight multiplied by its published food-composition values. Real meals vary
              with portion size, cooking oil and recipe, so treat these as estimates, not exact counts. Optional
              ingredients aren&apos;t counted.
            </p>
            {meal.assumptions && meal.assumptions.length > 0 && (
              <div>
                <p className="font-semibold text-ink">Assumptions for this meal</p>
                <ul className="mt-1 list-disc pl-5">{meal.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
              </div>
            )}
            {meal.substitutes && meal.substitutes.length > 0 && (
              <div>
                <p className="font-semibold text-ink">Close matches used</p>
                <ul className="mt-1 list-disc pl-5">{meal.substitutes.map((a) => <li key={a}>{a}</li>)}</ul>
              </div>
            )}
            <div>
              <p className="font-semibold text-ink">Sources</p>
              <ul className="mt-1 list-disc pl-5">
                {sources.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">{s.shortName}</a>
                    {s.id === "wafct" ? " (© FAO, used with acknowledgement for non-commercial purposes)" : ""}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs">Catalogue edition {CATALOGUE_VERSION}.</p>
          </div>
        </details>
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="ing-title">
          <h2 id="ing-title" className="mb-3 text-xl">Ingredients</h2>
          <ul className="divide-y divide-line">
            {meal.ingredients.map((i) => (
              <li key={i.id ?? i.name} className="flex justify-between gap-4 py-2.5">
                <span>{i.name}{i.optional && <span className="text-muted"> (optional)</span>}</span>
                <span className="text-right text-muted">{i.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-1 text-sm text-muted">
            <p>
              {meal.allergens.length ? <>Contains: <span className="font-semibold text-ink">{meal.allergens.join(", ")}</span>.</> : "Contains none of the 9 common allergens we track."}
              {meal.mayContain && meal.mayContain.length > 0 && <> May contain: <span className="font-semibold text-ink">{meal.mayContain.join(", ")}</span> (from seasoning, bread or similar).</>}
            </p>
            {halalNote && <p>If you eat halal, check the meat is from a halal source.</p>}
            <p>Always check product labels if you have an allergy.</p>
          </div>
        </section>
        <section aria-labelledby="steps-title">
          <h2 id="steps-title" className="mb-3 text-xl">How to make it</h2>
          <ol className="flex flex-col gap-3">
            {meal.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent" aria-hidden="true">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}
