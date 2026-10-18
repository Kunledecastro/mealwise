/** Public Supabase settings. Both values are safe to ship to the browser. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** e.g. "naaoigrhzfivantuysxl" from https://naaoigrhzfivantuysxl.supabase.co */
export const SUPABASE_PROJECT_REF = (() => {
  try {
    return new URL(SUPABASE_URL).hostname.split(".")[0];
  } catch {
    return "";
  }
})();

/** Name of the cookie @supabase/ssr stores the session in (may be split into ".0", ".1" chunks). */
export const AUTH_COOKIE = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

/** True if any cookie name is the session cookie (or one of its chunks), not the PKCE verifier. */
export function hasSessionCookie(names: string[]): boolean {
  return names.some((n) => n === AUTH_COOKIE || new RegExp(`^${AUTH_COOKIE}\\.\\d+$`).test(n));
}

/** Version of the privacy notice a user agrees to at sign-up. Bump when the notice changes. */
export const CONSENT_VERSION = "2026-10-18";
