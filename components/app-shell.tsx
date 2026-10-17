"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Home, LineChart, Search, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/prototype-store";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight text-leaf ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <circle cx="13" cy="13" r="12" fill="#fff" stroke="#1e5b3c" strokeWidth="2" />
        <path d="M13 13 L13 4 A9 9 0 0 1 21.5 15.8 Z" fill="#f4b53f" />
        <circle cx="10" cy="15" r="4" fill="#1e5b3c" />
      </svg>
      Mealwise
    </span>
  );
}

export function PrototypeBanner() {
  return (
    <div className="bg-plantain px-4 py-1.5 text-center text-sm font-semibold text-ink" data-testid="prototype-banner">
      Prototype with sample data. Nothing you do here is saved yet.
    </div>
  );
}

export function Toast() {
  const { toast } = useStore();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-8">
      {toast && (
        <div className="sheet-up rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/home" || pathname === "/today" || pathname.startsWith("/meals");
  if (href === "/profile") return pathname.startsWith("/profile") || pathname.startsWith("/settings");
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-12 focus:z-50 focus:rounded focus:bg-surface focus:p-3">
        Skip to content
      </a>
      <PrototypeBanner />
      <div className="lg:flex lg:min-h-[calc(100dvh-2.25rem)]">
        <div className="hidden lg:block lg:w-60 lg:shrink-0 lg:border-r lg:border-line">
        <nav aria-label="Main" className="lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-8 lg:px-5 lg:py-8">
          <Link href="/home" aria-label="Mealwise home">
            <Logo />
          </Link>
          <ul className="flex flex-col gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-full px-4 font-semibold ${
                      active ? "bg-leaf-soft text-leaf" : "text-muted hover:text-ink"
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        </div>
        <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          {children}
        </main>
      </div>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                    active ? "text-leaf" : "text-muted"
                  }`}
                >
                  <Icon size={22} aria-hidden="true" strokeWidth={active ? 2.4 : 1.8} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Toast />
    </div>
  );
}
