import Image from "next/image";
import { PlateArt } from "./plate-art";
import type { Meal } from "@/lib/types";

type Shape = "circle" | "thumb" | "card";

const SHAPE: Record<Shape, string> = {
  // Circle reads as a plate: photo inside a thin ceramic rim with a soft shadow.
  circle: "rounded-full ring-[5px] ring-[#f4f0e7] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.75)]",
  thumb: "rounded-2xl ring-1 ring-white/10",
  card: "rounded-[var(--radius-lg)] ring-1 ring-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]",
};

/**
 * A meal's picture: the real photo when one is licensed and matched, otherwise the plate illustration.
 * `size` is the rendered width in px (used for image sizing hints); pass `className` to stretch it.
 */
export function MealVisual({
  meal,
  size,
  shape = "thumb",
  className = "",
  priority = false,
  animate = false,
  sizes,
  decorative = false,
}: {
  meal: Meal;
  size: number;
  shape?: Shape;
  className?: string;
  priority?: boolean;
  animate?: boolean;
  /** Responsive `sizes` hint; defaults to the fixed size. */
  sizes?: string;
  /** Hide from screen readers when the meal name is already next to it. */
  decorative?: boolean;
}) {
  if (!meal.photo) {
    return (
      <PlateArt
        parts={meal.plate}
        seed={meal.slug}
        size={size}
        animate={animate}
        className={`h-auto ${className}`}
        title={decorative ? undefined : `${meal.name} (illustration)`}
      />
    );
  }
  const aspect = shape === "card" ? "aspect-[4/3]" : "aspect-square";
  const ring = shape === "circle" && size < 80 ? "rounded-full ring-2 ring-[#f4f0e7]" : SHAPE[shape];
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-surface-2 ${aspect} ${ring} ${animate ? "photo-in" : ""} ${className}`}
      style={className.includes("w-") ? undefined : { width: size }}
    >
      <Image
        src={meal.photo.src}
        alt={decorative ? "" : meal.photo.alt}
        fill
        priority={priority}
        sizes={sizes ?? `${size}px`}
        className="object-cover"
      />
    </div>
  );
}

/** "Photo: Name on Pexels" with a link to the source page, or a note that the picture is an illustration. */
export function PhotoCredit({ meal, className = "" }: { meal: Meal; className?: string }) {
  if (!meal.photo)
    return <p className={`text-xs text-muted ${className}`}>Illustration. A real photo of this dish is coming.</p>;
  return (
    <p className={`text-xs text-muted ${className}`}>
      Photo:{" "}
      <a href={meal.photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
        {meal.photo.credit} on {meal.photo.source}
      </a>
    </p>
  );
}
