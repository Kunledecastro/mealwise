"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, Home, LineChart, Search, UserRound } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/prototype-store";
import { Button, ErrorState, SkeletonRows } from "./ui";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight text-ink ${className}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <defs>
          <linearGradient id="logo-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6b23c" />
            <stop offset="1" stopColor="#ff6b4a" />
          </linearGradient>
        </defs>
        <circle cx="14" cy="14" r="13" fill="#f4f0e7" />
        <circle cx="14" cy="14" r="9.5" fill="#e8e3d7" />
        <path d="M14 14 L14 4.5 A9.5 9.5 0 0 1 23.1 16.8 Z" fill="url(#logo-glow)" />
        <circle cx="10.5" cy="16" r="4.2" fill="#3e7a3a" />
      </svg>
      Mealwise
    </span>
  );
}

export function PrototypeBanner() {
  return (
    <div className="border-b border-accent/25 bg-accent-soft px-4 py-1.5 text-center text-sm font-semibold text-accent" data-testid="prototype-banner">
      Test version. Meals and figures are real estimates; your meal log, weights and daily target are still sample data.
    </div>
  );
}

export function Toast() {
  const { toast } = useStore();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-8">
      {toast && (
        <div className="sheet-up rounded-full border border-line bg-surface-2 px-5 py-3 text-sm font-semibold text-ink shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]">
          {toast}
        </div>
      )}
    </div>
  );
}

function activeIndex(pathname: string) {
  if (pathname === "/home" || pathname === "/today" || pathname.startsWith("/meals")) return 0;
  if (pathname.startsWith("/profile") || pathname.startsWith("/settings")) return 4;
  return NAV.findIndex((n) => pathname.startsWith(n.href));
}

/** Waits for the signed-in user's profile, and sends new accounts to setup first. */
function ProfileGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, profile, profileStatus, profileError, reloadProfile, leftOnPurpose } = useAuth();

  useEffect(() => {
    // After a deliberate sign-out the screen that signed out chooses where to go.
    if (status === "signed-out" && !leftOnPurpose) router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    else if (profileStatus === "ready" && !profile.onboarded) router.replace("/onboarding");
  }, [status, profileStatus, profile.onboarded, pathname, router, leftOnPurpose]);

  if (profileStatus === "error")
    return (
      <ErrorState
        title="Your profile didn't load"
        body={profileError ?? "Something went wrong while loading your profile."}
        action={<Button variant="secondary" onClick={reloadProfile}>Try again</Button>}
      />
    );
  if (status !== "signed-in" || profileStatus !== "ready" || !profile.onboarded)
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <div className="skeleton h-10 w-2/3 rounded" />
        <SkeletonRows count={3} />
      </div>
    );
  return <>{children}</>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = activeIndex(pathname);
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-12 focus:z-50 focus:rounded focus:bg-surface focus:p-3">
        Skip to content
      </a>
      <PrototypeBanner />
      <div className="lg:flex lg:min-h-[calc(100dvh-2.25rem)]">
        <div className="hidden lg:block lg:w-64 lg:shrink-0 lg:border-r lg:border-line">
          <nav aria-label="Main" className="lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-10 lg:px-5 lg:py-8">
            <Link href="/" aria-label="Mealwise home" className="px-2">
              <Logo />
            </Link>
            <ul className="relative flex flex-col gap-1">
              {active >= 0 && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-12 rounded-full border border-accent/30 bg-accent-soft transition-transform duration-300 ease-[var(--ease-out-soft)]"
                  style={{ transform: `translateY(${active * 52}px)` }}
                />
              )}
              {NAV.map(({ href, label, icon: Icon }, i) => (
                <li key={href} className="relative">
                  <Link
                    href={href}
                    aria-current={i === active ? "page" : undefined}
                    className={`flex h-12 items-center gap-3 rounded-full px-4 font-semibold transition-colors ${
                      i === active ? "text-accent" : "text-muted hover:text-ink"
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-32 pt-7 sm:px-6 lg:px-10 lg:pb-14 lg:pt-12">
          <div key={pathname} className="page-in">
            <ProfileGate>{children}</ProfileGate>
          </div>
        </main>
      </div>
      <nav aria-label="Main" className="fixed inset-x-3 bottom-3 z-40 rounded-[1.6rem] border border-line bg-surface/85 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-lg lg:hidden">
        <ul className="relative mx-auto grid max-w-md grid-cols-5">
          {active >= 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1.5 h-[calc(100%-0.75rem)] w-[20%] px-1.5 transition-transform duration-300 ease-[var(--ease-out-soft)]"
              style={{ transform: `translateX(${active * 100}%)` }}
            >
              <span className="block h-full rounded-[1.2rem] bg-accent-soft" />
            </span>
          )}
          {NAV.map(({ href, label, icon: Icon }, i) => (
            <li key={href} className="relative">
              <Link
                href={href}
                aria-current={i === active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
                  i === active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon size={22} aria-hidden="true" strokeWidth={i === active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Toast />
    </div>
  );
}
