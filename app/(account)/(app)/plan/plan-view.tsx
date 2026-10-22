"use client";

import { SHOP_LABEL } from "@/lib/options";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Check, Minus, Plus, RefreshCw, ShoppingBasket } from "lucide-react";
import { useRecommendContext } from "@/components/meal-bits";
import { MealVisual } from "@/components/meal-visual";
import { Button, ButtonLink, EmptyState, EstimateTag, PageTitle, Segmented, SkeletonRows } from "@/components/ui";
import { MEALS, MEALS_BY_SLUG } from "@/catalogue";
import { fromISODate } from "@/lib/dates";
import { formatMinutes } from "@/lib/domain/meals";
import { dayKcal, generatePlan, setMeal, setServings, slotsFor, swapOptions, SERVINGS_MAX, SERVINGS_MIN } from "@/lib/domain/plan";
import { addDays } from "@/lib/domain/tracking";
import { useStore } from "@/lib/prototype-store";
import { usePlan, type Plan } from "@/lib/use-plan";
import { MEAL_TYPE_LABEL, type MealType } from "@/lib/types";

const servingsText = (n: number) => (n === 0.5 ? "½" : Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`);
const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions) => fromISODate(iso).toLocaleDateString("en-NG", opts);

export function PlanView() {
  const { plan, status, save } = usePlan();
  const { today, dailyKcal, target } = useStore();
  const [making, setMaking] = useState(false);

  if (status === "loading" || !today) return (<><PageTitle>Plan</PageTitle><SkeletonRows count={3} /></>);
  if (status === "error")
    return (
      <>
        <PageTitle>Plan</PageTitle>
        <EmptyState title="Your plan didn't load" body="Check your connection, then reload the page." />
      </>
    );

  const ended = plan ? addDays(plan.startDate, plan.days - 1) < today : false;
  if (!plan || making || ended || plan.items.length === 0)
    return (
      <>
        <PageTitle sub="Meals for the days ahead, fitted to your preferences and daily target.">Plan</PageTitle>
        {ended && !making && <p className="mb-4 rounded-[var(--radius-md)] bg-plantain-soft px-4 py-3 text-sm">Your last plan has ended. Make a new one below.</p>}
        <NewPlanForm
          today={today}
          hasPlan={!!plan && !ended && plan.items.length > 0}
          defaultSnacks={plan?.includeSnacks ?? false}
          noTarget={target?.status !== "ok"}
          onCancel={plan && !ended && plan.items.length > 0 ? () => setMaking(false) : undefined}
          onMake={async (p) => {
            // Items the user added to the list themselves are kept; their ticks start fresh.
            if (await save({ ...p, extras: plan?.extras ?? [] }, "Your plan wasn't saved. ")) setMaking(false);
          }}
          dailyKcal={dailyKcal}
        />
      </>
    );

  return <PlanDays plan={plan} today={today} dailyKcal={dailyKcal} save={save} onNew={() => setMaking(true)} />;
}

function NewPlanForm({
  today, hasPlan, defaultSnacks, noTarget, onMake, onCancel, dailyKcal,
}: {
  today: string; hasPlan: boolean; defaultSnacks: boolean; noTarget: boolean; dailyKcal: number | null;
  onMake: (p: Omit<Plan, "extras">) => Promise<void>; onCancel?: () => void;
}) {
  const [days, setDays] = useState<"1" | "3" | "7">("7");
  const [snacks, setSnacks] = useState(defaultSnacks);
  const [busy, setBusy] = useState(false);
  const ctx = useRecommendContext("lunch");

  async function make() {
    setBusy(true);
    const items = generatePlan(MEALS, ctx, { days: Number(days), includeSnacks: snacks, dailyKcal, recent: ctx.recent });
    await onMake({ startDate: today, days: Number(days), includeSnacks: snacks, items, shopping: {} });
    setBusy(false);
  }

  return (
    <section aria-labelledby="new-plan-title" className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-line bg-surface p-5 sm:p-6">
      <h2 id="new-plan-title" className="text-xl">{hasPlan ? "Make a new plan" : "Plan your meals"}</h2>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">How many days, starting today?</span>
        <Segmented<"1" | "3" | "7"> label="Days to plan" value={days} onChange={setDays}
          options={[{ value: "1", label: "Today" }, { value: "3", label: "3 days" }, { value: "7", label: "A week" }]} />
      </div>
      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" checked={snacks} onChange={(e) => setSnacks(e.target.checked)} className="size-5 shrink-0 accent-[var(--color-accent)]" />
        <span>Include a snack each day</span>
      </label>
      <p className="text-sm text-muted">
        We use your allergies, diet, dislikes, kitchen, mood, budget and cooking time{noTarget ? "" : ", and fit each day to your daily target"}. You can swap any meal
        afterwards.{noTarget ? " Without a daily target, days aren't fitted to a calorie total." : ""}
      </p>
      {hasPlan && <p role="note" className="rounded-[var(--radius-md)] bg-plantain-soft px-4 py-3 text-sm">This replaces your current plan and its shopping list ticks.</p>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={make} disabled={busy}>{busy ? "Planning…" : hasPlan ? "Replace my plan" : "Make my plan"}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel} disabled={busy}>Keep current plan</Button>}
      </div>
    </section>
  );
}

function PlanDays({ plan, today, dailyKcal, save, onNew }: { plan: Plan; today: string; dailyKcal: number | null; save: (p: Plan) => Promise<boolean>; onNew: () => void }) {
  const { addLog, showToast, profile } = useStore();
  const shop = profile.shop;
  const dates = Array.from({ length: plan.days }, (_, i) => addDays(plan.startDate, i));
  const todayIndex = dates.indexOf(today);
  const [day, setDay] = useState(Math.max(0, todayIndex));
  const [swapping, setSwapping] = useState<MealType | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const ctx = useRecommendContext(swapping ?? "lunch");
  const options = useMemo(
    () => (swapping ? swapOptions(MEALS, ctx, plan.items, day, swapping, dailyKcal) : []),
    [swapping, ctx, plan.items, day, dailyKcal],
  );

  const kcal = dayKcal(plan.items, day, MEALS_BY_SLUG);
  const slots = slotsFor(plan.includeSnacks);
  const end = dates[dates.length - 1];

  function openSwap(slot: MealType) {
    setSwapping(slot);
    dialog.current?.showModal();
  }

  async function choose(slug: string) {
    if (!swapping) return;
    dialog.current?.close();
    const name = MEALS_BY_SLUG.get(slug)?.name ?? "meal";
    if (await save({ ...plan, items: setMeal(plan.items, day, swapping, slug) })) showToast(`Swapped in ${name}`);
    setSwapping(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle sub={plan.days === 1 ? `For ${dayLabel(plan.startDate, { weekday: "long", day: "numeric", month: "long" })}` : `${dayLabel(plan.startDate, { day: "numeric", month: "short" })} to ${dayLabel(end, { day: "numeric", month: "short" })}`}>
        Your plan
      </PageTitle>

      {plan.days > 1 && (
        <div role="group" aria-label="Day" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {dates.map((d, i) => (
            <button key={d} type="button" onClick={() => setDay(i)} aria-pressed={i === day}
              className={`flex min-h-14 min-w-16 shrink-0 flex-col items-center justify-center rounded-[1rem] border px-3 text-sm font-semibold transition-colors ${
                i === day ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted hover:text-ink"
              }`}>
              <span>{d === today ? "Today" : dayLabel(d, { weekday: "short" })}</span>
              <span className="text-xs font-normal">{dayLabel(d, { day: "numeric", month: "short" })}</span>
            </button>
          ))}
        </div>
      )}

      <section aria-labelledby="day-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="day-title" className="text-xl">{dates[day] === today ? "Today" : dayLabel(dates[day], { weekday: "long", day: "numeric", month: "long" })}</h2>
          <p className="text-sm">
            <span className="font-semibold">About {kcal.toLocaleString()} kcal</span>
            <span className="text-muted">{dailyKcal ? ` · target about ${dailyKcal.toLocaleString()}` : ""}</span>
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {slots.map((slot) => {
            const item = plan.items.find((i) => i.day === day && i.slot === slot);
            const meal = item ? MEALS_BY_SLUG.get(item.slug) : undefined;
            return (
              <li key={slot} className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4">
                <div className="flex items-center gap-3">
                  {meal && <MealVisual meal={meal} size={60} decorative />}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-accent">{MEAL_TYPE_LABEL[slot]}</span>
                    {meal ? (
                      <>
                        <Link href={`/meals/${meal.slug}`} className="font-semibold hover:underline">{meal.name}</Link>
                        <span className="text-sm text-muted">About {meal.kcal} kcal a serving · {formatMinutes(meal.prepMinutes)}</span>
                      </>
                    ) : (
                      <span className="text-muted">{item ? "This meal is no longer in the catalogue." : "No meal fits your preferences for this slot."}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item && (
                    <div className="flex items-center gap-1 rounded-full border border-line px-1" role="group" aria-label={`Cooking for, ${MEAL_TYPE_LABEL[slot]}`}>
                      <button type="button" aria-label={`Fewer servings of ${meal?.name ?? "this meal"}`} disabled={item.servings <= SERVINGS_MIN}
                        onClick={() => void save({ ...plan, items: setServings(plan.items, day, slot, item.servings - (item.servings <= 1 ? 0.5 : 1)) })}
                        className="grid size-10 place-items-center rounded-full text-muted hover:text-ink disabled:opacity-40"><Minus size={16} aria-hidden="true" /></button>
                      <span className="min-w-20 text-center text-sm" aria-live="polite">Cooking for {servingsText(item.servings)}</span>
                      <button type="button" aria-label={`More servings of ${meal?.name ?? "this meal"}`} disabled={item.servings >= SERVINGS_MAX}
                        onClick={() => void save({ ...plan, items: setServings(plan.items, day, slot, item.servings + (item.servings < 1 ? 0.5 : 1)) })}
                        className="grid size-10 place-items-center rounded-full text-muted hover:text-ink disabled:opacity-40"><Plus size={16} aria-hidden="true" /></button>
                    </div>
                  )}
                  <Button variant="secondary" className="min-h-10 px-4 text-sm" onClick={() => openSwap(slot)} aria-label={`${item ? "Swap" : "Choose"} ${MEAL_TYPE_LABEL[slot].toLowerCase()}`}>
                    <RefreshCw size={16} aria-hidden="true" /> {item ? "Swap" : "Choose"}
                  </Button>
                  {meal && dates[day] === today && (
                    <Button variant="ghost" className="min-h-10 px-3 text-sm" aria-label={`I ate ${meal.name}`}
                      onClick={async () => { if (await addLog(meal, slot, 1)) showToast(`Logged ${meal.name} to today`); }}>
                      <Check size={16} aria-hidden="true" /> I ate this
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="flex items-center gap-2 text-sm text-muted">
          <EstimateTag /> Calories are for one serving each. &ldquo;Cooking for&rdquo; only changes the shopping list.
        </p>
      </section>

      {shop && <p className="-mb-3 text-sm text-muted">Shopping planned for <span className="font-semibold text-ink">{SHOP_LABEL[shop]}</span></p>}
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/plan/shopping"><ShoppingBasket size={18} aria-hidden="true" /> Shopping list</ButtonLink>
        <Button variant="secondary" onClick={onNew}>New plan</Button>
      </div>

      <dialog ref={dialog} aria-labelledby="swap-title" onClose={() => setSwapping(null)}
        className="mx-auto mb-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-[1.75rem] border border-line bg-surface-2 p-0 text-ink backdrop:bg-black/65 backdrop:backdrop-blur-sm sm:m-auto sm:w-[30rem] sm:rounded-[1.75rem]">
        <div className="sheet-up flex flex-col gap-4 p-6 pb-8 sm:pb-6">
          <h2 id="swap-title" className="text-2xl">{swapping ? `Choose a ${MEAL_TYPE_LABEL[swapping].toLowerCase()}` : "Choose a meal"}</h2>
          {options.length === 0 ? (
            <p className="text-muted">No other meals fit your preferences for this slot.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {options.map((m) => (
                <li key={m.slug}>
                  <button type="button" onClick={() => void choose(m.slug)} className="flex w-full items-center gap-3 py-3 text-left hover:text-accent">
                    <MealVisual meal={m} size={48} decorative />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{m.name}</span>
                      <span className="text-sm text-muted">About {m.kcal} kcal · {formatMinutes(m.prepMinutes)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button variant="ghost" className="self-end" onClick={() => dialog.current?.close()}>Cancel</Button>
        </div>
      </dialog>
    </div>
  );
}
