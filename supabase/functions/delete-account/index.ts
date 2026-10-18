// Mealwise: permanently delete the signed-in user's account.
// The caller is identified from their own access token; they can only ever delete themselves.
// Their profile (and any future user-owned rows) is removed by ON DELETE CASCADE.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const ALLOWED_ORIGINS = new Set([
  "https://mealwise-flame.vercel.app",
  "http://localhost:3000",
  "http://localhost:3100",
]);

function cors(origin: string | null): Record<string, string> {
  const allowed = origin && (ALLOWED_ORIGINS.has(origin) || /^https:\/\/mealwise-[a-z0-9-]+-adekunle-oludeles-projects\.vercel\.app$/.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "https://mealwise-flame.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

function key(envJson: string, legacy: string): string {
  const raw = Deno.env.get(envJson);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.default) return parsed.default as string;
    } catch {
      // fall through to the legacy variable
    }
  }
  return Deno.env.get(legacy) ?? "";
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405, headers);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Not signed in" }, 401, headers);

  const url = Deno.env.get("SUPABASE_URL")!;
  const publishable = key("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const secret = key("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");

  // 1. Who is calling? Verified by Supabase Auth from the caller's own token.
  const asCaller = createClient(url, publishable, { auth: { persistSession: false } });
  const { data, error } = await asCaller.auth.getUser(token);
  if (error || !data?.user) return json({ error: "Not signed in" }, 401, headers);

  // 2. Delete exactly that user, using the admin key that never leaves the server.
  const admin = createClient(url, secret, { auth: { persistSession: false } });
  const { error: delError } = await admin.auth.admin.deleteUser(data.user.id);
  if (delError) {
    console.error("delete-account failed", delError.message);
    return json({ error: "Could not delete the account. Please try again." }, 500, headers);
  }
  return json({ deleted: true }, 200, headers);
});
