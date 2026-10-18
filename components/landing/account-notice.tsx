"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Confirms on the landing page that an account was deleted (arrives as /?account=deleted). */
export function AccountDeletedNotice() {
  const deleted = useSyncExternalStore(
    noop,
    () => new URLSearchParams(window.location.search).get("account") === "deleted",
    () => false,
  );
  if (!deleted) return null;
  return (
    <div role="status" className="border-b border-fresh/30 bg-fresh-soft px-4 py-2 text-center text-sm font-semibold text-fresh">
      Your account and profile have been deleted.
    </div>
  );
}
