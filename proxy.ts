import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookie } from "@/lib/supabase/config";

/**
 * Sends signed-out visitors to sign-in before app screens load, and signed-in visitors
 * away from the sign-in/sign-up pages.
 *
 * This only checks that a session cookie is present (no network call), so it is a
 * convenience, not the security boundary: every piece of personal data is protected by
 * Row Level Security in the database, which checks the user's signed token on each request.
 */
const APP_PATHS = ["/home", "/today", "/meals", "/search", "/saved", "/progress", "/profile", "/settings", "/onboarding"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

const matches = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = hasSessionCookie(request.cookies.getAll().map((c) => c.name));

  if (!signedIn && matches(pathname, APP_PATHS)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  if (signedIn && matches(pathname, AUTH_PAGES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*", "/today/:path*", "/meals/:path*", "/search/:path*", "/saved/:path*",
    "/progress/:path*", "/profile/:path*", "/settings/:path*", "/onboarding/:path*",
    "/sign-in", "/sign-up",
  ],
};
