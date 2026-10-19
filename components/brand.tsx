/** Brand pieces with no app state, safe to use on public pages without loading account code. */

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
      Test version. Meals, figures and your daily target are estimates; it isn&apos;t medical advice.
    </div>
  );
}
