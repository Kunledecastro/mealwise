"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, LogOut, Settings } from "lucide-react";
import { Button, Chip, Field, PageTitle, inputClass } from "@/components/ui";
import { cmToFeetInches, formatWeight } from "@/lib/domain/units";
import { GuidanceCheck, TargetCard } from "@/components/target-bits";
import { ACTIVITY, ALLERGENS, APPLIANCES, BUDGET_LABELS, CUISINES, DIETS, GOALS, MAX_MOODS, MOODS, PREP_LABELS, SHOPS, SHOP_LABEL } from "@/lib/options";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/prototype-store";
import type { Appliance, Mood, Profile } from "@/lib/types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function ProfileView() {
  const { profile, setProfile, showToast, target, weightKg } = useStore();
  const { signOut } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Profile>(profile);
  const [dislikes, setDislikes] = useState(profile.dislikes.join(", "));
  const unit = profile.units === "metric" ? "kg" : "lb";
  const toggle = (key: "diet" | "allergies" | "cuisines", v: string) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v] }));

  async function save() {
    setSaving(true);
    setSaveError(null);
    const result = await setProfile({ ...draft, displayName: draft.displayName.trim() || profile.displayName, dislikes: dislikes.split(",").map((s) => s.trim()).filter(Boolean) });
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setEditing(false);
    showToast("Changes saved");
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  if (editing)
    return (
      <div className="flex flex-col gap-6">
        <PageTitle sub="Saved to your account. Changes apply to your suggestions straight away.">Edit preferences</PageTitle>
        <Field id="p-name" label="Name">
          <input id="p-name" className={inputClass} value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} />
        </Field>
        <Group label="Goal">
          {GOALS.map((g) => <Chip key={g.value} selected={draft.goal === g.value} onClick={() => setDraft({ ...draft, goal: g.value })}>{g.title}</Chip>)}
        </Group>
        <Group label="Activity">
          {ACTIVITY.map((a) => <Chip key={a.value} selected={draft.activity === a.value} onClick={() => setDraft({ ...draft, activity: a.value })}>{a.title}</Chip>)}
        </Group>
        <Group label="Sex (optional)">
          {([["female", "Female"], ["male", "Male"], [undefined, "Prefer not to say"]] as const).map(([v, label]) => (
            <Chip key={label} selected={draft.sex === v} onClick={() => setDraft({ ...draft, sex: v })}>{label}</Chip>
          ))}
        </Group>
        <p className="-mt-3 text-sm text-muted">Only used to estimate your daily energy needs. If you prefer not to say, we use an average.</p>
        <GuidanceCheck checked={!!draft.needsGuidance} onChange={(v) => setDraft({ ...draft, needsGuidance: v })} />
        <p className="text-sm">
          To change your height, year of birth or target weight,{" "}
          <Link href="/onboarding" className="font-semibold text-accent hover:underline">go through setup again</Link>. Log new weights on{" "}
          <Link href="/progress" className="font-semibold text-accent hover:underline">Progress</Link>.
        </p>
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
        <Group label={`In the mood for (up to ${MAX_MOODS})`}>
          {MOODS.map((m) => {
            const on = (draft.moods ?? []).includes(m.value);
            return (
              <Chip key={m.value} selected={on} disabled={!on && (draft.moods ?? []).length >= MAX_MOODS}
                onClick={() => setDraft({ ...draft, moods: on ? (draft.moods ?? []).filter((x) => x !== m.value) : [...(draft.moods ?? []), m.value as Mood] })}>
                {m.label}
              </Chip>
            );
          })}
        </Group>
        <Group label="What you cook with">
          {APPLIANCES.map((a) => {
            const have = draft.appliances ?? [];
            const on = have.includes(a.value);
            const next = on ? have.filter((x) => x !== a.value) : [...have, a.value as Appliance];
            return <Chip key={a.value} selected={on} onClick={() => setDraft({ ...draft, appliances: next.length ? next : undefined })}>{a.label}</Chip>;
          })}
        </Group>
        <p className="-mt-3 text-sm text-muted">Meals that need something you don&apos;t have are hidden. Leave all unticked to see every meal.</p>
        <Group label="Where you usually shop">
          {SHOPS.map((x) => (
            <Chip key={x.value} selected={draft.shop === x.value} onClick={() => setDraft({ ...draft, shop: draft.shop === x.value ? undefined : x.value })}>{x.label}</Chip>
          ))}
        </Group>
        <div className="sticky bottom-20 flex gap-2 border-t border-line bg-paper py-4 lg:bottom-0">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          <Button variant="ghost" disabled={saving} onClick={() => { setDraft(profile); setDislikes(profile.dislikes.join(", ")); setSaveError(null); setEditing(false); }}>Cancel</Button>
        </div>
        {saveError && <p role="alert" className="text-error">{saveError}</p>}
      </div>
    );

  const list = (v: string[], none: string) => (v.length ? v.join(", ") : none);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageTitle sub="Your goal and food preferences shape your suggestions.">{profile.displayName || "Your profile"}</PageTitle>
        <Button variant="secondary" onClick={() => { setDraft(profile); setEditing(true); }}>Edit</Button>
      </div>
      <section aria-labelledby="goal-title">
        <h2 id="goal-title" className="mb-2 text-xl">Goal and body</h2>
        <dl className="divide-y divide-line rounded-[var(--radius-md)] border border-line bg-surface">
          <Row label="Goal" value={GOALS.find((g) => g.value === profile.goal)?.title ?? "Not set"} />
          <Row label="Current weight" value={weightKg ? formatWeight(weightKg, unit) : "Not given"} />
          <Row label="Target weight" value={profile.targetWeightKg ? formatWeight(profile.targetWeightKg, unit) : "Not set"} />
          <Row label="Height" value={!profile.heightCm ? "Not given" : profile.units === "metric" ? `${profile.heightCm} cm` : (({ feet, inches }) => `${feet} ft ${inches} in`)(cmToFeetInches(profile.heightCm))} />
          <Row label="Year of birth" value={profile.birthYear ? String(profile.birthYear) : "Not given"} />
          <Row label="Sex" value={profile.sex === "female" ? "Female" : profile.sex === "male" ? "Male" : "Not given"} />
          <Row label="Activity" value={ACTIVITY.find((a) => a.value === profile.activity)?.title ?? "Not given"} />
        </dl>
      </section>
      {target && <TargetCard target={target} profile={profile} unit={unit} />}
      <section aria-labelledby="food-title">
        <h2 id="food-title" className="mb-2 text-xl">Food</h2>
        <dl className="divide-y divide-line rounded-[var(--radius-md)] border border-line bg-surface">
          <Row label="Eating style" value={list(profile.diet, "No restrictions")} />
          <Row label="Allergies" value={list(profile.allergies, "None")} />
          <Row label="Dislikes" value={list(profile.dislikes, "None")} />
          <Row label="Cuisines" value={list(profile.cuisines, "Any")} />
          <Row label="Budget per meal" value={profile.budget ? BUDGET_LABELS[profile.budget] : "Not set"} />
          <Row label="Mood" value={profile.moods?.length ? profile.moods.map((m) => MOODS.find((x) => x.value === m)!.label).join(", ") : "Anything"} />
          <Row label="Kitchen" value={profile.appliances?.length ? profile.appliances.map((a) => APPLIANCES.find((x) => x.value === a)!.label).join(", ") : "Not given"} />
          <Row label="Shop" value={profile.shop ? SHOP_LABEL[profile.shop] : "Not given"} />
          <Row label="Cooking time" value={profile.maxPrepMinutes !== undefined ? PREP_LABELS[String(profile.maxPrepMinutes)] ?? `${profile.maxPrepMinutes} min` : "Not set"} />
        </dl>
      </section>
      <Link href="/settings" className="flex min-h-14 items-center gap-3 rounded-[var(--radius-md)] border border-line bg-surface px-4 font-semibold hover:border-accent">
        <Settings size={20} aria-hidden="true" className="text-accent" /> <span className="flex-1">Settings</span> <ChevronRight size={20} aria-hidden="true" />
      </Link>
      <Button variant="secondary" onClick={handleSignOut}>
        <LogOut size={18} aria-hidden="true" /> Sign out
      </Button>
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
