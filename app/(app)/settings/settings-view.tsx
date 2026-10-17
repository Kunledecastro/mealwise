"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, PageTitle, Segmented } from "@/components/ui";
import { useStore } from "@/lib/prototype-store";
import type { Units } from "@/lib/types";

const STATE_LINKS = [
  { label: "Meal ideas", path: "/meals" },
  { label: "Search", path: "/search" },
  { label: "Saved", path: "/saved" },
  { label: "Today", path: "/today" },
  { label: "Progress", path: "/progress" },
];

export function SettingsView() {
  const { profile, setProfile, reset, showToast } = useStore();

  return (
    <div className="flex flex-col gap-8">
      <Link href="/profile" className="inline-flex w-fit items-center gap-1 font-semibold text-accent hover:underline">
        <ArrowLeft size={18} aria-hidden="true" /> Profile
      </Link>
      <PageTitle>Settings</PageTitle>

      <section aria-labelledby="units-title" className="flex flex-col gap-3">
        <h2 id="units-title" className="text-xl">Units</h2>
        <Segmented<Units> label="Units" value={profile.units} onChange={(units) => setProfile({ ...profile, units })}
          options={[{ value: "metric", label: "kg and cm" }, { value: "imperial", label: "lb and ft" }]} />
      </section>

      <section aria-labelledby="data-title" className="flex flex-col gap-3">
        <h2 id="data-title" className="text-xl">Your data</h2>
        <p className="max-w-prose text-muted">
          Downloading a copy of your data and deleting your account will be available once accounts are added.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled aria-describedby="data-note">Download my data</Button>
          <Button variant="danger" disabled aria-describedby="data-note">Delete my account</Button>
        </div>
        <p id="data-note" className="text-sm text-muted">Not available in this prototype.</p>
      </section>

      <section aria-labelledby="proto-title" className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-accent/25 bg-plantain-soft p-5">
        <h2 id="proto-title" className="text-xl">Prototype tools</h2>
        <p className="max-w-prose text-sm">
          These links let you review how screens look while loading, when empty, and when something goes wrong. They
          won&apos;t be in the real app.
        </p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr><th className="py-1 pr-2">Screen</th><th className="px-2">Loading</th><th className="px-2">Empty</th><th className="px-2">Error</th></tr>
          </thead>
          <tbody>
            {STATE_LINKS.map((s) => (
              <tr key={s.path} className="border-t border-ink/10">
                <td className="py-2 pr-2 font-semibold">{s.label}</td>
                {(["loading", "empty", "error"] as const).map((d) => (
                  <td key={d} className="px-2">
                    <Link className="font-semibold text-accent underline" href={`${s.path}?demo=${d}`} aria-label={`${s.label} ${d} state`}>View</Link>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm">
          Also try a <Link href="/meals/not-a-real-meal" className="font-semibold text-accent underline">meal that doesn&apos;t exist</Link>.
        </p>
        <Button variant="secondary" className="w-fit" onClick={() => { reset(); showToast("Sample data restored"); }}>
          Reset sample data
        </Button>
      </section>

      <section aria-labelledby="about-title" className="flex flex-col gap-2">
        <h2 id="about-title" className="text-xl">About Mealwise</h2>
        <p className="max-w-prose text-muted">
          Mealwise offers general guidance about food and weight. It isn&apos;t medical advice and doesn&apos;t replace a doctor
          or registered dietitian. Nutrition figures and prices are estimates.
        </p>
        <p className="text-sm text-muted">Version 0.1, Phase 1 prototype</p>
      </section>
    </div>
  );
}
