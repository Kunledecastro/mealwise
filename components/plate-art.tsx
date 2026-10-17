import type { PlatePart } from "@/lib/types";

/** Deterministic pseudo-random generator so each dish always draws the same way. */
function seeded(seedText: string) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amount > 0 ? (255 - c) * amount : c * amount))));
  const r = f(n >> 16);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function blobPath(cx: number, cy: number, r: number, rand: () => number): string {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.84 + rand() * 0.24);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as const;
  });
  const mid = (a: readonly [number, number], b: readonly [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  let d = `M${start[0].toFixed(1)},${start[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += ` Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

function Texture({ part, cx, cy, r, rand, detail }: { part: PlatePart; cx: number; cy: number; r: number; rand: () => number; detail: number }) {
  const dark = shade(part.color, -0.22);
  const light = shade(part.color, 0.35);
  // Thumbnails draw fewer texture marks: they are too small to see them and it keeps pages fast on low-end phones.
  const count = Math.max(4, Math.round(r * 0.9 * detail));
  const spot = () => {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * r;
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d] as const;
  };
  switch (part.texture) {
    case "grains":
      return (
        <g>
          {Array.from({ length: count * 2 }, (_, i) => {
            const [x, y] = spot();
            return (
              <ellipse key={i} cx={x} cy={y} rx={2.6} ry={1.1} fill={i % 3 ? light : dark} opacity={0.7}
                transform={`rotate(${Math.round(rand() * 180)} ${x} ${y})`} />
            );
          })}
        </g>
      );
    case "balls":
      return (
        <g>
          {Array.from({ length: Math.max(4, Math.round(count / 2.2)) }, (_, i) => {
            const [x, y] = spot();
            const s = 3.5 + rand() * 4;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={s} fill={part.color} stroke={dark} strokeWidth={1.2} />
                <circle cx={x - s / 3} cy={y - s / 3} r={s / 3} fill={light} opacity={0.8} />
              </g>
            );
          })}
        </g>
      );
    case "leafy":
      return (
        <g fill="none" stroke={dark} strokeWidth={1.6} strokeLinecap="round" opacity={0.75}>
          {Array.from({ length: Math.round(count / 2) }, (_, i) => {
            const [x, y] = spot();
            const a = rand() * Math.PI * 2;
            const L = 6 + rand() * 6;
            const x2 = x + Math.cos(a) * L;
            const y2 = y + Math.sin(a) * L;
            return <path key={i} d={`M${x},${y} Q${x + 4},${y - 4} ${x2},${y2}`} stroke={i % 2 ? dark : light} />;
          })}
        </g>
      );
    case "chunks":
      return (
        <g>
          {Array.from({ length: Math.max(3, Math.round(count / 3)) }, (_, i) => {
            const [x, y] = spot();
            const w = 7 + rand() * 8;
            return (
              <rect key={i} x={x - w / 2} y={y - w / 2.6} width={w} height={w / 1.3} rx={3}
                fill={i % 2 ? shade(part.color, 0.12) : shade(part.color, -0.08)} stroke={dark} strokeWidth={0.8}
                transform={`rotate(${Math.round(rand() * 90)} ${x} ${y})`} />
            );
          })}
        </g>
      );
    case "slices":
      return (
        <g>
          {Array.from({ length: Math.max(3, Math.round(count / 3)) }, (_, i) => {
            const [x, y] = spot();
            const s = 5 + rand() * 4;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={s} fill={shade(part.color, 0.1)} stroke={dark} strokeWidth={1} />
                <circle cx={x} cy={y} r={s * 0.45} fill={light} />
              </g>
            );
          })}
        </g>
      );
    default:
      return <ellipse cx={cx - r * 0.25} cy={cy - r * 0.3} rx={r * 0.45} ry={r * 0.22} fill={light} opacity={0.55} />;
  }
}

export function PlateArt({
  parts,
  seed,
  size = 120,
  className,
  animate = false,
  title,
}: {
  parts: PlatePart[];
  seed: string;
  size?: number;
  className?: string;
  animate?: boolean;
  title?: string;
}) {
  const rand = seeded(seed);
  const sorted = [...parts].sort((a, b) => b.share - a.share);
  const start = rand() * Math.PI * 2;
  const placed = sorted.map((part, i) => {
    const n = sorted.length;
    const r = n === 1 ? 58 : 16 + Math.sqrt(part.share) * 36;
    const dist = n === 1 ? 0 : Math.max(0, 77 - r);
    const a = start + (i / n) * Math.PI * 2;
    return { part, cx: 100 + Math.cos(a) * dist, cy: 100 + Math.sin(a) * dist, r };
  });
  const id = `p-${seed}`;

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={`${className ?? ""} ${animate ? "plate-in" : ""}`}
      role="img" aria-label={title ?? `Illustration: ${parts.map((p) => p.label).join(", ")}`}>
      <circle cx={100} cy={103} r={96} fill="#17251d" opacity={0.08} />
      <circle cx={100} cy={100} r={96} fill="#ffffff" stroke="#d9e1d6" strokeWidth={1.5} />
      <circle cx={100} cy={100} r={80} fill="#f3f6f0" />
      <defs>
        <clipPath id={`${id}-plate`}>
          <circle cx={100} cy={100} r={84} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-plate)`}>
        {placed.map(({ part, cx, cy, r }, i) => {
          const d = blobPath(cx, cy, r, rand);
          return (
            <g key={i}>
              <defs>
                <clipPath id={`${id}-${i}`}>
                  <path d={d} />
                </clipPath>
              </defs>
              <path d={d} fill={part.color} stroke={shade(part.color, -0.25)} strokeWidth={1.2} />
              <g clipPath={`url(#${id}-${i})`}>
                <Texture part={part} cx={cx} cy={cy} r={r} rand={rand} detail={size >= 200 ? 1 : size >= 80 ? 0.45 : 0.3} />
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
