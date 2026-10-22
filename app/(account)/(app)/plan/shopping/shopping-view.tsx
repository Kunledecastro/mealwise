"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Share2, X } from "lucide-react";
import { Button, ButtonLink, EmptyState, EstimateTag, PageTitle, SkeletonRows, inputClass } from "@/components/ui";
import { INGREDIENTS, MEALS_BY_SLUG } from "@/catalogue";
import { BUYING_UNITS } from "@/catalogue/buying-units";
import { ALLERGEN_LABEL, PRICE_STALE_DAYS } from "@/lib/domain/catalogue";
import { addOwnItem, allergenIngredients, buildShoppingList, estimateFor, listAsText, newOwnItemId, OWN_NAME_MAX, type OwnItem, type ShoppingLine, type Tick } from "@/lib/domain/shopping";
import { SHOP_PRICES } from "@/catalogue/shop-prices";
import { SHOP_LABEL } from "@/lib/options";
import { addDays } from "@/lib/domain/tracking";
import { fromISODate } from "@/lib/dates";
import { useStore } from "@/lib/prototype-store";
import { usePlan } from "@/lib/use-plan";

const INGREDIENT_MAP = new Map(INGREDIENTS.map((i) => [i.id, i]));
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

export function ShoppingView() {
  const { plan, status, save } = usePlan();
  const { today, showToast, profile } = useStore();
  const lines = useMemo(() => {
    if (!plan) return [];
    const skip = allergenIngredients(INGREDIENTS, profile.allergies, ALLERGEN_LABEL);
    return buildShoppingList(plan.items, MEALS_BY_SLUG, INGREDIENT_MAP, BUYING_UNITS, skip, profile.shop ? SHOP_PRICES[profile.shop] : undefined);
  }, [plan, profile.allergies, profile.shop]);
  const ticks = useMemo(() => plan?.shopping ?? {}, [plan]);
  const estimate = useMemo(() => estimateFor(lines, ticks), [lines, ticks]);

  const back = (
    <Link href="/plan" className="mb-4 inline-flex w-fit items-center gap-1 font-semibold text-accent hover:underline">
      <ArrowLeft size={18} aria-hidden="true" /> Plan
    </Link>
  );
  if (status === "loading" || !today) return (<>{back}<PageTitle>Shopping list</PageTitle><SkeletonRows count={4} /></>);
  if (status === "error")
    return (<>{back}<PageTitle>Shopping list</PageTitle><EmptyState title="Your list didn't load" body="Check your connection, then reload the page." /></>);
  if (!plan || plan.items.length === 0)
    return (
      <>
        {back}
        <PageTitle>Shopping list</PageTitle>
        <EmptyState title="No plan yet" body="Make a meal plan and its shopping list appears here." action={<ButtonLink href="/plan">Make a plan</ButtonLink>} />
      </>
    );

  const toggle = (id: string, tick: Tick) => {
    const next = { ...ticks };
    if (next[id] === tick) delete next[id];
    else next[id] = tick;
    void save({ ...plan, shopping: next }, "That tick wasn't saved. ");
  };

  const own = plan.extras;
  async function addOwn(name: string): Promise<string | null> {
    const r = addOwnItem(own, name, newOwnItemId());
    if (!r.ok) return r.error;
    return (await save({ ...plan!, extras: r.items }, "That item wasn't added. ")) ? null : "";
  }
  function removeOwn(item: OwnItem) {
    const next = { ...ticks };
    delete next[item.id];
    void save({ ...plan!, extras: own.filter((o) => o.id !== item.id), shopping: next }, "That item wasn't removed. ");
  }

  async function share() {
    const text = listAsText(lines, ticks, undefined, own);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Shopping list", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast("List copied. Paste it into WhatsApp or your notes.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") showToast("Couldn't share the list on this device.");
    }
  }

  const end = addDays(plan.startDate, plan.days - 1);
  const label = (iso: string) => fromISODate(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  const stale = estimate.oldest ? (Date.parse(today) - Date.parse(estimate.oldest)) / 86_400_000 > PRICE_STALE_DAYS : false;
  const main = lines.filter((l) => !l.optional);
  const extras = lines.filter((l) => l.optional);
  const sections = [...new Set(main.map((l) => l.section))];
  const left = main.filter((l) => !ticks[l.id]).length + own.filter((o) => !ticks[o.id]).length;
  const total = main.length + own.length;
  const shop = profile.shop;

  return (
    <div className="flex flex-col gap-6">
      <div>
        {back}
        <PageTitle sub={`For your plan, ${plan.days === 1 ? label(plan.startDate) : `${label(plan.startDate)} to ${label(end)}`}. ${left} of ${total} items still to get.`}>
          Shopping list
        </PageTitle>
        {shop && <p className="mt-1 text-sm text-muted">Planned for <span className="font-semibold text-ink">{SHOP_LABEL[shop]}</span>. <Link href="/profile" className="font-semibold text-accent hover:underline">Change</Link></p>}
      </div>

      <section aria-labelledby="estimate-title" className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="estimate-title" className="text-xl">Estimated cost</h2>
          <EstimateTag />
        </div>
        {estimate.priced > 0 ? (
          <p>
            <span className="whitespace-nowrap font-display text-2xl font-semibold sm:text-3xl">{naira(estimate.low)}–{naira(estimate.high)}</span>
          </p>
        ) : (
          <p className="text-muted">None of these items has a price yet.</p>
        )}
        <p className="text-sm text-muted">
          For the amounts your plan uses{estimate.oldest ? `, at ${fromISODate(estimate.oldest).toLocaleDateString("en-NG", { month: "long", year: "numeric" })} prices` : ""}
          {stale ? <span className="text-error"> (may be out of date)</span> : null}. You may need to buy whole packs, so the till total can be higher.
          Items you already have aren&apos;t counted{own.length ? ", and your own items aren't priced" : ""}.
        </p>
        {shop && shop !== "market" && (
          <p className="text-sm text-muted">
            {estimate.shopPriced > 0
              ? `${estimate.shopPriced} of ${estimate.priced} priced items use ${SHOP_LABEL[shop]} prices; the rest use average market prices.`
              : `We haven't collected ${shop === "supermarket" ? "supermarket" : SHOP_LABEL[shop]} prices yet, so these are average market prices. Supermarket prices are often higher.`}
          </p>
        )}
        {estimate.unpriced.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-accent">{estimate.unpriced.length} item{estimate.unpriced.length === 1 ? "" : "s"} not priced yet</summary>
            <p className="mt-2 text-muted">{estimate.unpriced.join(", ")}.</p>
          </details>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={share}><Share2 size={18} aria-hidden="true" /> Share list</Button>
        <Button variant="ghost" onClick={() => { const el = document.getElementById("own-new"); el?.scrollIntoView({ block: "center" }); el?.focus({ preventScroll: true }); }}>
          <Plus size={18} aria-hidden="true" /> Add your own item
        </Button>
      </div>

      {sections.map((s) => (
        <Section key={s} title={s} lines={main.filter((l) => l.section === s)} ticks={ticks} onToggle={toggle} />
      ))}
      {extras.length > 0 && <Section title="Optional extras" note="Not counted in the cost." lines={extras} ticks={ticks} onToggle={toggle} />}
      <OwnItems items={own} ticks={ticks} onToggle={(id) => toggle(id, "bought")} onAdd={addOwn} onRemove={removeOwn} />
    </div>
  );
}

function OwnItems({ items, ticks, onToggle, onAdd, onRemove }: {
  items: OwnItem[]; ticks: Record<string, Tick>; onToggle: (id: string) => void;
  onAdd: (name: string) => Promise<string | null>; onRemove: (item: OwnItem) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const err = await onAdd(name);
    setBusy(false);
    if (err === null) {
      setName("");
      setError(null);
    } else if (err) setError(err);
  }
  return (
    <section aria-labelledby="own-title" className="flex flex-col gap-3">
      <div>
        <h2 id="own-title" className="text-lg">Your own items</h2>
        <p className="text-sm text-muted">Anything else you need this week. Not counted in the cost.</p>
      </div>
      {items.length > 0 && (
        <ul className="divide-y divide-line">
          {items.map((o) => {
            const done = ticks[o.id] === "bought";
            return (
              <li key={o.id} className="flex items-center gap-3 py-3">
                <input type="checkbox" id={`own-${o.id}`} checked={done} onChange={() => onToggle(o.id)} className="size-6 shrink-0 accent-[var(--color-accent)]" />
                <label htmlFor={`own-${o.id}`} className={`min-w-0 flex-1 cursor-pointer font-semibold ${done ? "line-through opacity-60" : ""}`}>{o.name}</label>
                <button type="button" onClick={() => onRemove(o)} aria-label={`Remove ${o.name}`}
                  className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
                  <X size={18} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="own-new" className="text-sm font-semibold">Add an item</label>
        <div className="flex gap-2">
          <input id="own-new" className={inputClass} value={name} maxLength={OWN_NAME_MAX} placeholder="For example, bread or detergent"
            onChange={(e) => { setName(e.target.value); setError(null); }} aria-invalid={!!error} aria-describedby={error ? "own-error" : undefined} />
          <Button type="submit" variant="secondary" disabled={busy}><Plus size={18} aria-hidden="true" /> Add</Button>
        </div>
        {error && <p id="own-error" role="alert" className="text-sm font-medium text-error">{error}</p>}
      </form>
    </section>
  );
}

function Section({ title, note, lines, ticks, onToggle }: { title: string; note?: string; lines: ShoppingLine[]; ticks: Record<string, Tick>; onToggle: (id: string, t: Tick) => void }) {
  const id = `sec-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-lg">{title}</h2>
      {note && <p className="text-sm text-muted">{note}</p>}
      <ul className="divide-y divide-line">
        {lines.map((l) => {
          const t = ticks[l.id];
          return (
            <li key={`${l.optional ? "opt-" : ""}${l.id}`} className="flex items-center gap-3 py-3">
              <input type="checkbox" id={`buy-${id}-${l.id}`} checked={t === "bought"} onChange={() => onToggle(l.id, "bought")}
                className="size-6 shrink-0 accent-[var(--color-accent)]" aria-describedby={`amt-${id}-${l.id}`} />
              <label htmlFor={`buy-${id}-${l.id}`} className={`flex min-w-0 flex-1 cursor-pointer flex-col ${t ? "opacity-60" : ""}`}>
                <span className={`font-semibold ${t ? "line-through" : ""}`}>{l.name}</span>
                <span id={`amt-${id}-${l.id}`} className="text-sm text-muted">
                  {l.amount}
                  {l.low !== null && l.high !== null && !l.optional ? ` · ${naira(l.low)}–${naira(l.high)}` : ""}
                  {t === "have" ? " · already have" : ""}
                </span>
              </label>
              <button type="button" aria-pressed={t === "have"} onClick={() => onToggle(l.id, "have")}
                aria-label={`Have it: ${l.name}`}
                className={`min-h-10 shrink-0 rounded-full border px-3 text-sm font-semibold ${t === "have" ? "border-fresh bg-fresh-soft text-fresh" : "border-line text-muted hover:text-ink"}`}>
                Have it
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
