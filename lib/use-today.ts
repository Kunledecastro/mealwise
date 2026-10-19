"use client";

import { useSyncExternalStore } from "react";
import { toISODate } from "./dates";

const noop = () => () => {};

/**
 * Today's date (YYYY-MM-DD) from the user's own clock.
 * Returns null during server rendering, so date-dependent UI renders on the client only.
 */
export function useToday(): string | null {
  return useSyncExternalStore(noop, () => toISODate(new Date()), () => null);
}

/** Current hour (0–23) on the user's clock, or null during server rendering. */
export function useHour(): number | null {
  return useSyncExternalStore(noop, () => new Date().getHours(), () => null);
}
