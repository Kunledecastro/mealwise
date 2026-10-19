import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Guards for the privacy promises in docs/PRIVACY_REVIEW.md: every table of personal data created by a
// migration is (1) included in "Download my data" and (2) removed when the account is deleted.
const migrations = readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(`supabase/migrations/${f}`, "utf8"))
  .join("\n");
const tables = [...migrations.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
const settings = readFileSync("app/(account)/(app)/settings/settings-view.tsx", "utf8");

describe("personal data", () => {
  it("PV-01 every user table is in the data download", () => {
    expect(tables.length).toBeGreaterThanOrEqual(5);
    for (const t of tables) expect(settings, t).toContain(`.from("${t}")`);
  });
  it("PV-02 every user table is removed with the account (cascade from profiles or auth.users)", () => {
    for (const t of tables) {
      const def = migrations.slice(migrations.indexOf(`create table public.${t}`));
      const body = def.slice(0, def.indexOf(");\n") + 2);
      expect(body, t).toMatch(/references (public\.profiles|auth\.users) \(id\) on delete cascade/);
    }
  });
  it("PV-03 every user table has row level security turned on", () => {
    for (const t of tables) expect(migrations, t).toContain(`alter table public.${t} enable row level security`);
  });
});
