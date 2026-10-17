import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-11 px-5 text-base";
const variants: Record<Variant, string> = {
  primary: "bg-leaf text-white hover:bg-leaf-deep",
  secondary: "bg-surface text-ink border border-line hover:border-leaf hover:text-leaf",
  ghost: "text-leaf hover:bg-leaf-soft",
  danger: "bg-surface text-error border border-error/40 hover:bg-error-soft",
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
      className={`min-h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors ${
        selected ? "border-leaf bg-leaf text-white" : "border-line bg-surface text-ink hover:border-leaf"
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
    <div className="flex flex-col gap-1.5">
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
  "min-h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 text-base text-ink placeholder:text-muted/70 focus:border-leaf aria-[invalid=true]:border-error";

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
          className={`min-h-9 rounded-full px-4 text-sm font-semibold ${
            value === o.value ? "bg-leaf text-white" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-dashed border-line bg-surface/60 p-6">
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="26" fill="#fff" stroke="#d9e1d6" strokeWidth="2" />
        <circle cx="28" cy="28" r="19" fill="#f3f6f0" />
      </svg>
      <h2 className="text-xl">{title}</h2>
      <p className="max-w-prose text-muted">{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-error/30 bg-error-soft p-6">
      <h2 className="text-xl text-error">{title}</h2>
      <p className="max-w-prose">{body}</p>
      {action}
    </div>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-4">
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
    <span className="inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full bg-plantain-soft px-2.5 py-0.5 text-xs font-semibold text-[#7a5410]">
      {children}
    </span>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-1">
      <h1 className="text-3xl">{children}</h1>
      {sub && <p className="text-muted">{sub}</p>}
    </div>
  );
}
