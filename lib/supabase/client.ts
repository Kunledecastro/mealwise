"use client";

/**
 * The one Supabase client for the browser — built from the parts we use (sign-in, database,
 * edge functions) instead of the all-in-one client, which also bundles live updates and file
 * storage we don't use. Saves about 28 KB of compressed JavaScript on every app screen
 * (DECISION_LOG 057).
 *
 * It behaves like @supabase/ssr's createBrowserClient:
 * - the session lives in the same cookie, in the same format (base64url, split into chunks
 *   when large), using @supabase/ssr's own cookie storage, so proxy.ts and existing sign-ins
 *   keep working;
 * - every database and function request carries the signed-in user's token, so RLS applies;
 *   with no session, only the publishable key is sent (it is never used as a Bearer token).
 * Email links are handled explicitly on /auth/callback, so automatic URL detection is off.
 */
import { AuthClient } from "@supabase/auth-js";
import { FunctionsClient } from "@supabase/functions-js";
import { PostgrestClient } from "@supabase/postgrest-js";
// Same cookie storage createBrowserClient uses (not re-exported from the package index).
import { createStorageFromOptions } from "@supabase/ssr/dist/module/cookies.js";
import { AUTH_COOKIE, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

export interface Supabase {
  auth: InstanceType<typeof AuthClient>;
  from: PostgrestClient["from"];
  functions: FunctionsClient;
}

let client: Supabase | undefined;

function create(): Supabase {
  const key = SUPABASE_PUBLISHABLE_KEY;
  const base = SUPABASE_URL.replace(/\/$/, "");
  const { storage } = createStorageFromOptions({ cookieEncoding: "base64url" }, false);

  const auth = new AuthClient({
    url: `${base}/auth/v1`,
    headers: { Authorization: `Bearer ${key}`, apikey: key },
    storageKey: AUTH_COOKIE,
    storage,
    flowType: "pkce",
    detectSessionInUrl: false,
    autoRefreshToken: true,
    persistSession: true,
  });

  /** Adds the API key, and the user's token when signed in. */
  const authedFetch: typeof fetch = async (input, init) => {
    const { data } = await auth.getSession();
    const headers = new Headers(init?.headers);
    if (!headers.has("apikey")) headers.set("apikey", key);
    const token = data.session?.access_token;
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };

  const rest = new PostgrestClient(`${base}/rest/v1`, { fetch: authedFetch });
  const functions = new FunctionsClient(`${base}/functions/v1`, { customFetch: authedFetch });
  return { auth, from: rest.from.bind(rest), functions };
}

export function getSupabase(): Supabase {
  if (!client) client = create();
  return client;
}
