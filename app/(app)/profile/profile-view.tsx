"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Settings } from "lucide-react";
import { Button, Chip, Field, PageTitle, inputClass } from "@/components/ui";
import { formatWeight } from "@/lib/domain/units";
import { ACTIVITY, ALLERGENS, BUDGET_LABELS, CUISINES, DIETS, GOALS, PREP_LABELS } from "@/lib/options";
import { useStore } from "@/lib/prototype-store";
import type { Profile } from "@/lib/types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function ProfileView() {
  const { profile, setProfile, showToast } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile>(profile);
  const [dislikes, setDislikes] = useState(profile.dislikes.join(", "));
  const unit = profile.units === "metric" ? "kg" : "lb";
  const toggle = (key: "diet" | "allergies" | "cuisines", v: string) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v] }));

  function save() {
    setProfile({ ...draft, displayName: draft.displayName.trim() || profile.displayName, dislikes: dislikes.split(",").map((s) => s.trim()).filter(Boolean) });
    setEditing(false);
    showToast("Changes saved for this session");
  }

  if (editing)
    return (
      <div className="flex flex-col gap-6">
        <PageTitle sub="Changes apply to your suggestions straight away.">Edit preferences</PageTitle>
        <Field id="p-name" label="Name">
          <input id="p-name" className={inputClass} value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} />
        </Field>
        <Group label="Goal">
          {GOALS.map((g) => <Chip key={g.value} selected={draft.goal === g.value} onClick={() => setDraft({ ...draft, goal: g.value })}>{g.title}</Chip>)}
        </Group>
        <Group label="Activity">
          {ACTIVITY.map((a) => <Chip key={a.value} selected={draft.activity === a.value} onClick={() => setDraft({ ...draft, activity: a.value })}>{a.title}</Chip>)}
        </Group>
        <Group label="Eating style">{DIETS.map((d) => <Chip key={d} selected={draft.diet.includes(d)} onClick={() => toggle("diet", d)}>{d}</Chip>)}</Group>
        <Group label="Allergies or foods you can't eat">{ALLERGENS.map((d) => <Chip key={d} selected={draft.allergies.includes(d)} onClick={() => toggle("allergies", d)}>{d}</Chip>)}</Group>
        <Field id="p-dislikes" label="Foods you don't like" hint="Separate with commas.">
          <input id="p-dislikes" className={inputClass} value={dislikes} onChange={(e) => setDislikes(e.target.value)} aria-describedby="p-dislikes-hint" />
        </Field>
        <Group label="Cuisines you enjoy">{CUISINES.map((d) => <Chip key={d} selected={draft.cuisines.includes(d)} onClick={() => toggle("cuisines", d)}>{d}</Chip>)}</Group>
        <Group label="Budget per meal">
          {Object.entries(BUDGET_LABELS).map(([k, v]) => (
            <Chip key={k} selected={draft.budget === k} onClick={() => setDraft({ ...draft, budget: draft.budget === k ? undefined : (k as Profile["budget"]) })}>{v}</Chip>
          ))}
        </Group>
        <Group label="Most time to spend cooking">
          {Object.entries(PREP_LABELS).map(([k, v]) => (
            <Chip key={k} selected={String(draft.maxPrepMinutes) === k} onClick={() => setDraft({ ...draft, maxPrepMinutes: Number(k) })}>{v}</Chip>
          ))}
        </Group>
        <div className="sticky bottom-20 flex gap-2 border-t border-line bg-paper py-4 lg:bottom-0">
          <Button onClick={save}>Save changes</Button>
          <Button variant="ghost" onClick={() => { setDraft(profile); setDislikes(profile.dislikes.join(", ")); setEditing(false); }}>Cancel</Button>
        </div>
      </div>
    );

  const list = (v: string[], none: string) => (v.length ? v.join(", ") : none);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageTitle sub="Your goal and food preferences shape your suggestions.">{profile.displayName}</PageTitle>
        <Button variant="secondary" onClick={() => { setDraft(profile); setEditing(true); }}>Edit</Button>
      </div>
      <section aria-labelledby="goal-title">
        <h2 id="goal-title" className="mb-2 text-xl">Goal and body</h2>
        <dl className="divide-y divide-line rounded-[var(--radius-md)] border border-line bg-surface">
          <Row label="Goal" value={GOALS.find((g) => g.value === profile.goal)?.title ?? "Not set"} />
          <Row label="Current weight" value={profile.weightKg ? formatWeight(profile.weightKg, unit) : "Not given"} />
          <Row label="Target weight" value={profile.targetWeightKg ? formatWeight(profile.targetWeightKg, unit) : "Not set"} />
          <Row label="Activity" value={ACTIVITY.find((a) => a.value === profile.activity)?.title ?? "Not given"} />
        </dl>
      </section>
      <section aria-labelledby="food-title">
        <h2 id="food-title" className="mb-2 text-xl">Food</h2>
        <dl className="divide-y divide-line rounded-[var(--radius-md)] border border-line bg-surface">
          <Row label="Eating style" value={list(profile.diet, "No restrictions")} />
          <Row label="Allergies" value={list(profile.allergies, "None")} />
          <Row label="Dislikes" value={list(profile.dislikes, "None")} />
          <Row label="Cuisines" value={list(profile.cuisines, "Any")} />
          <Row label="Budget per meal" value={profile.budget ? BUDGET_LABELS[profile.budget] : "Not set"} />
          <Row label="Cooking time" value={profile.maxPrepMinutes !== undefined ? PREP_LABELS[String(profile.maxPrepMinutes)] ?? `${profile.maxPrepMinutes} min` : "Not set"} />
        </dl>
      </section>
      <Link href="/settings" className="flex min-h-14 items-center gap-3 rounded-[var(--radius-md)] border border-line bg-surface px-4 font-semibold hover:border-leaf">
        <Settings size={20} aria-hidden="true" className="text-leaf" /> <span className="flex-1">Settings</span> <ChevronRight size={20} aria-hidden="true" />
      </Link>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
