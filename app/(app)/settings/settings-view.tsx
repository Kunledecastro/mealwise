"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button, Field, PageTitle, Segmented, inputClass } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/domain/auth-errors";
import { useStore } from "@/lib/prototype-store";
import { getSupabase } from "@/lib/supabase/client";
import { PHOTO_CREDITS } from "@/lib/sample-data";
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

      <YourData />

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
        <p className="text-sm text-muted">Version 0.2, Phase 2 test version</p>
      </section>

      <section aria-labelledby="credits-title" className="flex flex-col gap-3">
        <h2 id="credits-title" className="text-xl">Photo credits</h2>
        <p className="max-w-prose text-sm text-muted">
          Meal photos come from Pexels and Unsplash, whose licences allow free use. Thank you to the photographers.
          Dishes without a photo show an illustration for now.
        </p>
        <ul className="divide-y divide-line rounded-[var(--radius-md)] border border-line bg-surface text-sm">
          {PHOTO_CREDITS.map((c) => (
            <li key={c.meal} className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-4 py-3">
              <span className="font-semibold">{c.meal}</span>
              <a href={c.page} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-2 hover:text-ink">
                {c.credit} on {c.source}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Download a copy of everything stored about the user, sign out, or delete the account. */
function YourData() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState<"download" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function download() {
    if (!user) return;
    setBusy("download");
    setError(null);
    const { data, error: err } = await getSupabase().from("profiles").select("*").eq("id", user.id).maybeSingle();
    setBusy(null);
    if (err) {
      setError(friendlyError(err));
      return;
    }
    const exportData = {
      exported_at: new Date().toISOString(),
      note: "Everything Mealwise stores about you at this stage: your account and your profile. Meals, logs and weights in this test version are sample data and are not stored.",
      account: { id: user.id, email: user.email, created_at: user.created_at },
      profile: data,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `mealwise-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    setBusy("delete");
    setDeleteError(null);
    const { data, error: err } = await getSupabase().functions.invoke<{ deleted?: boolean }>("delete-account", { method: "POST" });
    if (err || !data?.deleted) {
      setBusy(null);
      setDeleteError("Your account wasn't deleted. Check your connection and try again.");
      return;
    }
    await signOut();
    router.replace("/?account=deleted");
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <section aria-labelledby="data-title" className="flex flex-col gap-3">
      <h2 id="data-title" className="text-xl">Your account and data</h2>
      {user?.email && <p className="text-muted">Signed in as <span className="font-semibold text-ink">{user.email}</span></p>}
      <p className="max-w-prose text-muted">
        Download a copy of what Mealwise stores about you, or delete your account and everything linked to it.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={download} disabled={busy !== null}>
          {busy === "download" ? "Preparing…" : "Download my data"}
        </Button>
        <Button variant="secondary" onClick={handleSignOut} disabled={busy !== null}>
          <LogOut size={18} aria-hidden="true" /> Sign out
        </Button>
        <Button variant="danger" disabled={busy !== null} onClick={() => { setConfirmText(""); setDeleteError(null); dialog.current?.showModal(); }}>
          Delete my account
        </Button>
      </div>
      {error && <p role="alert" className="text-error">{error}</p>}

      <dialog ref={dialog} aria-labelledby="delete-title"
        className="mx-auto mb-0 mt-auto w-full max-w-none rounded-t-[1.75rem] border border-line bg-surface-2 p-0 text-ink backdrop:bg-black/65 backdrop:backdrop-blur-sm sm:m-auto sm:w-[28rem] sm:rounded-[1.75rem]">
        <form method="dialog" className="sheet-up flex flex-col gap-5 p-6 pb-8 sm:pb-6"
          onSubmit={(e) => { e.preventDefault(); if (confirmText.trim().toUpperCase() === "DELETE") deleteAccount(); }}>
          <h2 id="delete-title" className="text-2xl">Delete your account?</h2>
          <p className="text-muted">
            This permanently removes your account and your saved profile. It can&apos;t be undone. If you want a copy, download
            your data first.
          </p>
          <Field id="confirm-delete" label="Type DELETE to confirm">
            <input id="confirm-delete" className={inputClass} value={confirmText} autoComplete="off"
              onChange={(e) => setConfirmText(e.target.value)} />
          </Field>
          {deleteError && <p role="alert" className="text-error">{deleteError}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="danger" disabled={busy === "delete" || confirmText.trim().toUpperCase() !== "DELETE"}>
              {busy === "delete" ? "Deleting…" : "Delete permanently"}
            </Button>
            <Button type="button" variant="ghost" disabled={busy === "delete"} onClick={() => dialog.current?.close()}>Cancel</Button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
