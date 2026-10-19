/**
 * In-memory stand-in for the Supabase project, used only by the end-to-end tests.
 *
 * Why: this test machine cannot reach supabase.co. The mock answers the same HTTP calls the
 * real service would (Auth, the profiles table, the delete-account function) so the app's own
 * code paths run unchanged in the browser. It also copies the database's protections that the
 * app relies on: you can only read or change your own profile, the 18+ rule, and that
 * id/consent fields cannot be changed. The real database rules are tested separately
 * (supabase/tests/rls_profiles.sql), and real email links are checked by hand.
 *
 * All data is synthetic.
 */
import type { BrowserContext, Page, Route } from "@playwright/test";

export const SUPABASE_ORIGIN = "https://naaoigrhzfivantuysxl.supabase.co";
export const AUTH_COOKIE = "sb-naaoigrhzfivantuysxl-auth-token";

export const TESTER = { email: "tester.a@example.test", password: "Correct-horse-1", id: "11111111-1111-4111-8111-111111111111" };
export const OTHER = { email: "tester.b@example.test", password: "Battery-staple-2", id: "22222222-2222-4222-8222-222222222222" };

type Row = Record<string, unknown> & { id: string };
interface MockUser { id: string; email: string; password: string; confirmed: boolean; created_at: string; meta: Record<string, unknown> }

const EDITABLE = [
  "display_name", "birth_year", "height_cm", "current_weight_kg", "target_weight_kg", "units", "goal", "activity_level",
  "diet", "allergies", "dislikes", "cuisines", "budget_band", "max_prep_minutes", "onboarding_completed_at",
  "sex", "needs_guidance",
];

const b64url = (s: string) => Buffer.from(s).toString("base64url");

function jwt(user: MockUser, exp: number) {
  return [
    b64url(JSON.stringify({ alg: "HS256", typ: "JWT" })),
    b64url(JSON.stringify({ sub: user.id, email: user.email, role: "authenticated", aud: "authenticated", exp, iat: exp - 3600 })),
    "mock-signature",
  ].join(".");
}

function userJson(u: MockUser) {
  return {
    id: u.id, aud: "authenticated", role: "authenticated", email: u.email,
    email_confirmed_at: u.confirmed ? u.created_at : null, confirmed_at: u.confirmed ? u.created_at : null,
    created_at: u.created_at, updated_at: u.created_at,
    app_metadata: { provider: "email", providers: ["email"] }, user_metadata: u.meta, identities: [],
  };
}

export function sessionFor(u: MockUser) {
  const expires_at = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: jwt(u, expires_at), token_type: "bearer", expires_in: 3600, expires_at,
    refresh_token: `refresh-${u.id}`, user: userJson(u),
  };
}

function profileRow(id: string, consent: string | null, onboarded: boolean, now: string): Row {
  return {
    id,
    display_name: onboarded ? "Amaka" : null,
    birth_year: onboarded ? 1996 : null,
    height_cm: onboarded ? "165.0" : null,
    current_weight_kg: onboarded ? "79.40" : null,
    target_weight_kg: onboarded ? "74.00" : null,
    units: "metric",
    goal: onboarded ? "lose" : null,
    activity_level: onboarded ? "light" : null,
    diet: [], allergies: [], dislikes: onboarded ? ["Okra"] : [],
    cuisines: onboarded ? ["Nigerian", "International"] : [],
    budget_band: onboarded ? "medium" : null,
    max_prep_minutes: onboarded ? 45 : null,
    sex: null,
    needs_guidance: false,
    consent_version: consent, consent_at: consent ? now : null,
    onboarding_completed_at: onboarded ? now : null,
    created_at: now, updated_at: now,
  };
}

export class SupabaseMock {
  users = new Map<string, MockUser>(); // by email
  profiles = new Map<string, Row>(); // by user id
  /** meal_preferences rows keyed "userId|slug". */
  mealPrefs = new Map<string, Row & { user_id: string; meal_slug: string }>();
  /** weight_entries and meal_logs rows (owner-only, like the real policies). */
  weights: (Row & { user_id: string })[] = [];
  mealLogs: (Row & { user_id: string })[] = [];
  /** Set to make the next weight / meal-log write fail. */
  failNextTrackingWrite = false;
  /** Every request the app made, for assertions ("METHOD path"). */
  calls: string[] = [];
  /** Emails the real service would have sent. */
  emails: { to: string; kind: string }[] = [];
  /** Set to make the next profile save fail, to test error handling. */
  failNextProfileSave = false;
  /** Set to make the next saved / "Not for me" change fail. */
  failNextChoiceSave = false;

  /** Pre-saves meals for a user (as if saved earlier). */
  seedSaved(userId: string, slugs: string[]) {
    slugs.forEach((slug, i) => {
      const key = `${userId}|${slug}`;
      this.mealPrefs.set(key, { id: key, user_id: userId, meal_slug: slug, saved_at: new Date(Date.now() - i * 60_000).toISOString(), rejected_at: null, reject_reason: null });
    });
  }

  /** Pre-adds weights for a user: [YYYY-MM-DD, kg][]. */
  seedWeights(userId: string, entries: [string, number][]) {
    for (const [measured_on, kg] of entries)
      this.weights.push({ id: crypto.randomUUID(), user_id: userId, measured_on, weight_kg: kg.toFixed(2), entered_unit: "kg" });
  }

  /** Pre-logs a meal for a user. */
  seedLog(userId: string, row: { meal_slug: string; logged_for: string; meal_type: string; portion?: number; kcal: number; protein_g?: number; carbs_g?: number; fat_g?: number }) {
    this.mealLogs.push({
      id: crypto.randomUUID(), user_id: userId, portion: "1.00", protein_g: "10.0", carbs_g: "50.0", fat_g: "10.0",
      created_at: new Date().toISOString(), ...row,
      ...(row.portion !== undefined ? { portion: row.portion.toFixed(2) } : {}),
    });
  }

  constructor() {
    this.addUser(TESTER, { onboarded: true });
    this.addUser(OTHER, { onboarded: true });
  }

  addUser(u: { email: string; password: string; id: string }, opts: { onboarded: boolean; confirmed?: boolean }) {
    const now = new Date().toISOString();
    this.users.set(u.email, { ...u, confirmed: opts.confirmed ?? true, created_at: now, meta: { consent_version: "2026-10-18" } });
    this.profiles.set(u.id, profileRow(u.id, "2026-10-18", opts.onboarded, now));
  }

  user(email: string) {
    return this.users.get(email)!;
  }

  private byToken(route: Route): MockUser | undefined {
    const auth = route.request().headers()["authorization"] ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());
      if (payload.exp * 1000 < Date.now()) return undefined;
      return [...this.users.values()].find((u) => u.id === payload.sub);
    } catch {
      return undefined; // the publishable key, or nothing: not a signed-in user
    }
  }

  async install(target: Page | BrowserContext) {
    await target.route(`${SUPABASE_ORIGIN}/**`, (route) => this.handle(route));
  }

  private reply(route: Route, status: number, body?: unknown) {
    return route.fulfill({
      status,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "access-control-expose-headers": "*",
        "content-type": "application/json",
        "x-supabase-api-version": "2024-01-01",
      },
      body: body === undefined ? "" : JSON.stringify(body),
    });
  }

  private authError(route: Route, status: number, code: string, msg: string) {
    return this.reply(route, status, { code: status, error_code: code, msg, message: msg });
  }

  private async handle(route: Route) {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    if (method === "OPTIONS") return this.reply(route, 204);
    this.calls.push(`${method} ${url.pathname}`);
    const body = (() => {
      try {
        return req.postDataJSON() ?? {};
      } catch {
        return {};
      }
    })();
    const p = url.pathname;

    // ---- Auth ----
    if (p === "/auth/v1/signup" && method === "POST") {
      const email = String(body.email ?? "").toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return this.authError(route, 400, "email_address_invalid", "Email address is invalid");
      if (String(body.password ?? "").length < 8) return this.authError(route, 422, "weak_password", "Password should be at least 8 characters.");
      const existing = this.users.get(email);
      if (existing) {
        // Like the real service: same response, no hint that the address is taken.
        this.emails.push({ to: email, kind: "already-registered" });
        return this.reply(route, 200, { ...userJson(existing), identities: [] });
      }
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const consent = (body.data?.consent_version as string) ?? null;
      const u: MockUser = { id, email, password: body.password, confirmed: false, created_at: now, meta: body.data ?? {} };
      this.users.set(email, u);
      this.profiles.set(id, profileRow(id, consent, false, now)); // handle_new_user trigger
      this.emails.push({ to: email, kind: "confirm" });
      return this.reply(route, 200, userJson(u));
    }

    if (p === "/auth/v1/token" && method === "POST") {
      const grant = url.searchParams.get("grant_type");
      if (grant === "password") {
        const u = this.users.get(String(body.email ?? "").toLowerCase());
        if (!u || u.password !== body.password) return this.authError(route, 400, "invalid_credentials", "Invalid login credentials");
        if (!u.confirmed) return this.authError(route, 400, "email_not_confirmed", "Email not confirmed");
        return this.reply(route, 200, sessionFor(u));
      }
      if (grant === "refresh_token") {
        const u = [...this.users.values()].find((x) => `refresh-${x.id}` === body.refresh_token);
        if (!u) return this.authError(route, 400, "refresh_token_not_found", "Invalid Refresh Token");
        return this.reply(route, 200, sessionFor(u));
      }
      if (grant === "pkce") {
        // Test links use the code "confirm:<email>" to stand in for the emailed link.
        const email = String(body.auth_code ?? "").replace(/^confirm:/, "");
        const u = this.users.get(email);
        if (!u || !String(body.auth_code).startsWith("confirm:")) return this.authError(route, 404, "flow_state_not_found", "invalid flow state");
        u.confirmed = true;
        return this.reply(route, 200, sessionFor(u));
      }
      return this.authError(route, 400, "validation_failed", "Unsupported grant type");
    }

    if ((p === "/auth/v1/otp" || p === "/auth/v1/recover" || p === "/auth/v1/resend") && method === "POST") {
      this.emails.push({ to: String(body.email ?? ""), kind: p.split("/").pop()! });
      return this.reply(route, 200, {});
    }

    if (p === "/auth/v1/user") {
      const u = this.byToken(route);
      if (!u) return this.authError(route, 401, "session_not_found", "Session not found");
      if (method === "PUT") {
        if (body.password) {
          if (String(body.password).length < 8) return this.authError(route, 422, "weak_password", "Password should be at least 8 characters.");
          if (body.password === u.password) return this.authError(route, 422, "same_password", "New password should be different from the old password.");
          u.password = body.password;
        }
      }
      return this.reply(route, 200, userJson(u));
    }

    if (p === "/auth/v1/logout") return this.reply(route, 204);

    // ---- Database: public.profiles, with the same owner-only rule as the real policies ----
    if (p === "/rest/v1/profiles") {
      const u = this.byToken(route);
      const idFilter = url.searchParams.get("id")?.replace(/^eq\./, "");
      const visible = [...this.profiles.values()].filter((r) => u && r.id === u.id && (!idFilter || r.id === idFilter));
      const asObject = (req.headers()["accept"] ?? "").includes("vnd.pgrst.object");
      const out = (rows: Row[]) => (asObject ? (rows[0] ? this.reply(route, 200, rows[0]) : this.reply(route, 406, { code: "PGRST116", message: "0 rows" })) : this.reply(route, 200, rows));

      if (method === "GET") return out(visible);
      if (method === "PATCH") {
        if (this.failNextProfileSave) {
          this.failNextProfileSave = false;
          return this.reply(route, 503, { code: "", message: "Failed to fetch (simulated outage)" });
        }
        const by = body.birth_year as number | null | undefined;
        if (by && by > new Date().getFullYear() - 18)
          return this.reply(route, 400, { code: "23514", message: "Mealwise is for adults aged 18 and over" });
        for (const r of visible) {
          for (const k of EDITABLE) if (k in body) r[k] = body[k];
          r.updated_at = new Date().toISOString();
        }
        return out(visible);
      }
      // Inserts and deletes are not allowed for users (grants revoked in the real database).
      return this.reply(route, 403, { code: "42501", message: "permission denied for table profiles" });
    }

    // ---- Database: public.meal_preferences (owner-only; no row removal by users) ----
    if (p === "/rest/v1/meal_preferences") {
      const u = this.byToken(route);
      if (!u) return this.reply(route, 401, { code: "42501", message: "permission denied" });
      if (method === "GET") return this.reply(route, 200, [...this.mealPrefs.values()].filter((r) => r.user_id === u.id));
      if (method === "POST") {
        if (this.failNextChoiceSave) {
          this.failNextChoiceSave = false;
          return this.reply(route, 503, { code: "", message: "Failed to fetch (simulated outage)" });
        }
        const rows = (Array.isArray(body) ? body : [body]) as Record<string, unknown>[];
        for (const r of rows) {
          if (r.user_id !== u.id) return this.reply(route, 403, { code: "42501", message: "new row violates row-level security policy" });
          if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(r.meal_slug))) return this.reply(route, 400, { code: "23514", message: "violates check constraint" });
          const key = `${u.id}|${r.meal_slug}`;
          const prev = this.mealPrefs.get(key) ?? { id: key, user_id: u.id, meal_slug: String(r.meal_slug), saved_at: null, rejected_at: null, reject_reason: null };
          this.mealPrefs.set(key, { ...prev, ...r, id: key, user_id: u.id, meal_slug: String(r.meal_slug), updated_at: new Date().toISOString() });
        }
        return this.reply(route, 201);
      }
      return this.reply(route, 403, { code: "42501", message: "permission denied for table meal_preferences" });
    }

    // ---- Database: weight_entries and meal_logs (owner-only; same checks as the real tables) ----
    if (p === "/rest/v1/weight_entries" || p === "/rest/v1/meal_logs") {
      const u = this.byToken(route);
      if (!u) return this.reply(route, 401, { code: "42501", message: "permission denied" });
      const isWeights = p.endsWith("weight_entries");
      const table: (Row & { user_id: string })[] = isWeights ? this.weights : this.mealLogs;
      const asObject = (req.headers()["accept"] ?? "").includes("vnd.pgrst.object");
      const filters = [...url.searchParams.entries()].filter(([k]) => !["select", "order", "on_conflict", "columns"].includes(k));
      const matches = (r: Row) =>
        r.user_id === u.id &&
        filters.every(([k, v]) => {
          const [op, val] = [v.slice(0, v.indexOf(".")), v.slice(v.indexOf(".") + 1)];
          if (op === "eq") return String(r[k]) === val;
          if (op === "gte") return String(r[k]) >= val;
          return true;
        });
      if (method === "GET") {
        const key = isWeights ? "measured_on" : "logged_for";
        return this.reply(route, 200, table.filter(matches).sort((a, b) => String(a[key]).localeCompare(String(b[key]))));
      }
      if (method === "POST" || method === "DELETE") {
        if (this.failNextTrackingWrite) {
          this.failNextTrackingWrite = false;
          return this.reply(route, 503, { code: "", message: "Failed to fetch (simulated outage)" });
        }
      }
      if (method === "POST") {
        const rows = (Array.isArray(body) ? body : [body]) as Record<string, unknown>[];
        const out: Row[] = [];
        const today = new Date();
        today.setDate(today.getDate() + 1);
        const maxDate = today.toISOString().slice(0, 10);
        for (const r of rows) {
          if (r.user_id !== u.id) return this.reply(route, 403, { code: "42501", message: "new row violates row-level security policy" });
          if (isWeights) {
            const kg = Number(r.weight_kg);
            if (!(kg >= 20 && kg <= 400) || String(r.measured_on) > maxDate) return this.reply(route, 400, { code: "23514", message: "violates check constraint" });
            const existing = this.weights.find((w) => w.user_id === u.id && w.measured_on === r.measured_on);
            if (existing && !url.searchParams.get("on_conflict")) return this.reply(route, 409, { code: "23505", message: "duplicate key value" });
            const row = { ...(existing ?? { id: crypto.randomUUID(), user_id: u.id }), ...r, weight_kg: kg.toFixed(2) } as Row & { user_id: string };
            if (!existing) this.weights.push(row);
            else Object.assign(existing, row);
            out.push(row);
          } else {
            const portion = Number(r.portion);
            if (!(portion >= 0.25 && portion <= 4) || !["breakfast", "lunch", "dinner", "snack"].includes(String(r.meal_type)) || String(r.logged_for) > maxDate)
              return this.reply(route, 400, { code: "23514", message: "violates check constraint" });
            const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r, portion: portion.toFixed(2) } as unknown as Row & { user_id: string };
            this.mealLogs.push(row);
            out.push(row);
          }
        }
        return asObject ? this.reply(route, 201, out[0]) : this.reply(route, 201, out);
      }
      if (method === "DELETE") {
        const keep = table.filter((r) => !matches(r));
        table.splice(0, table.length, ...keep);
        return this.reply(route, 204);
      }
      return this.reply(route, 403, { code: "42501", message: "permission denied" });
    }

    // ---- Edge function ----
    if (p === "/functions/v1/delete-account" && method === "POST") {
      const u = this.byToken(route);
      if (!u) return this.reply(route, 401, { error: "Not signed in" });
      this.users.delete(u.email);
      this.profiles.delete(u.id);
      for (const k of [...this.mealPrefs.keys()]) if (k.startsWith(`${u.id}|`)) this.mealPrefs.delete(k);
      this.weights = this.weights.filter((w) => w.user_id !== u.id);
      this.mealLogs = this.mealLogs.filter((l) => l.user_id !== u.id);
      return this.reply(route, 200, { deleted: true });
    }

    return this.reply(route, 404, { message: `Mock has no handler for ${method} ${p}` });
  }
}

/** Signs the browser in directly by writing the session cookie (as @supabase/ssr does). */
export async function seedSession(context: BrowserContext, mock: SupabaseMock, email = TESTER.email, baseURL = "http://localhost:3100") {
  const value = "base64-" + b64url(JSON.stringify(sessionFor(mock.user(email))));
  await context.addCookies([{ name: AUTH_COOKIE, value, url: baseURL, sameSite: "Lax" }]);
}
