"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | undefined;

/**
 * The one Supabase client for the browser. The session lives in cookies so the server
 * (proxy.ts) can tell signed-in visitors from signed-out ones. Email links are handled
 * explicitly on /auth/callback, so automatic URL detection is off.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { flowType: "pkce", detectSessionInUrl: false, autoRefreshToken: true, persistSession: true },
    });
  }
  return client;
}
