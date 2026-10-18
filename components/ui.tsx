import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "press inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 min-h-12 px-6 text-base";
const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-on-accent shadow-[0_8px_30px_-8px_rgba(246,178,60,0.55)] hover:bg-accent-strong hover:shadow-[0_10px_40px_-6px_rgba(255,107,74,0.55)]",
  secondary: "bg-surface text-ink border border-line hover:border-accent/70 hover:bg-surface-2",
  ghost: "text-accent hover:bg-accent-soft",
  danger: "bg-transparent text-error border border-error/50 hover:bg-error-soft",
};

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Chip({
  selected,
  className = "",
  ...props
}: ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`press min-h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors ${
        selected
          ? "border-accent bg-accent text-on-accent"
          : "border-line bg-surface text-ink hover:border-accent/60 hover:bg-surface-2"
      } ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  id,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "min-h-12 w-full rounded-[var(--radius-sm)] border border-line bg-surface px-4 text-base text-ink placeholder:text-muted/70 transition-colors hover:border-muted/50 focus:border-accent focus:bg-surface-2 aria-[invalid=true]:border-error [color-scheme:dark]";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-fit rounded-full border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${
            value === o.value ? "bg-accent text-on-accent" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EmptyPlate() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" className="float">
      <circle cx="32" cy="34" r="28" fill="#000" opacity="0.35" />
      <circle cx="32" cy="32" r="28" fill="#f3efe6" />
      <circle cx="32" cy="32" r="21" fill="#e7e2d6" />
    </svg>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[var(--radius-lg)] border border-dashed border-line bg-surface/50 p-7">
      <EmptyPlate />
      <h2 className="text-xl">{title}</h2>
      <p className="max-w-prose text-muted">{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-error/40 bg-error-soft p-7">
      <h2 className="text-xl text-error">{title}</h2>
      <p className="max-w-prose">{body}</p>
      {action}
    </div>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="skeleton size-20 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-5 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Small inline marker for any number that comes from prototype sample data. */
export function SampleTag({ children = "Sample figures" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
      {children}
    </span>
  );
}

/** Marks calculated estimates (real catalogue figures), as opposed to placeholder sample data. */
export function EstimateTag({ children = "Estimates" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full border border-fresh/30 bg-fresh-soft px-2.5 py-0.5 text-xs font-semibold text-fresh">
      {children}
    </span>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-2">
      <h1 className="text-3xl sm:text-4xl">{children}</h1>
      {sub && <p className="text-muted">{sub}</p>}
    </div>
  );
}

/** A raised panel. Use `spotlight` for pointer-following glow (pair with useSpotlight). */
export function Panel({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`rounded-[var(--radius-lg)] border border-line bg-surface p-5 sm:p-6 ${className}`} {...props} />;
}
