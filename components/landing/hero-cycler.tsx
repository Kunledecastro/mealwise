"use client";

import { useEffect, useState } from "react";
import { Clock, Flame, Pause, Play, Wallet } from "lucide-react";
import { MealVisual, PhotoCredit } from "@/components/meal-visual";
import { formatMinutes, formatNairaRange } from "@/lib/domain/meals";
import { getMeal } from "@/catalogue";

const SEQUENCE = [
  { slug: "jollof-rice-chicken", when: "Lunch" },
  { slug: "akara-and-pap", when: "Breakfast" },
  { slug: "egusi-pounded-yam", when: "Dinner" },
  { slug: "yam-and-egg-sauce", when: "Breakfast" },
  { slug: "plantain-groundnuts", when: "Snack" },
  { slug: "efo-riro-eba", when: "Dinner" },
].map((s) => ({ ...s, meal: getMeal(s.slug)! }));

const INTERVAL = 3800;

/** Hero answer that cycles through dishes; real photos crossfade inside the glowing orbit. */
export function HeroCycler() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % SEQUENCE.length), INTERVAL);
    return () => clearInterval(t);
  }, [playing]);

  const { meal, when } = SEQUENCE[i];

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-7">
        <h1 className="slide-up text-5xl sm:text-6xl lg:text-[5.5rem]">
          What can I{" "}<br />eat next?
        </h1>
        <div className="rise flex flex-col gap-3" style={{ "--delay": "120ms" } as React.CSSProperties}>
          <p className="text-muted">{when} idea</p>
          <p key={meal.slug} className="swap-in font-display text-3xl font-semibold leading-tight sm:text-4xl">
            <span className="text-glow">{meal.name}</span>
          </p>
          <p key={`${meal.slug}-facts`} className="swap-in flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><Flame size={15} aria-hidden="true" />{meal.kcal} kcal</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={15} aria-hidden="true" />{formatMinutes(meal.prepMinutes)}</span>
            <span className="inline-flex items-center gap-1.5"><Wallet size={15} aria-hidden="true" />{formatNairaRange(meal.costLow, meal.costHigh)}</span>
          </p>
          <div className="flex flex-wrap gap-x-3 text-xs text-muted/80">
            <span>Estimated figures.</span>
            <PhotoCredit key={`${meal.slug}-credit`} meal={meal} className="swap-in !text-muted/80" />
          </div>
        </div>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[30rem]">
        <div className="aura" aria-hidden="true" />
        <svg viewBox="0 0 400 400" className="slow-spin absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="200" cy="200" r="192" fill="none" stroke="rgba(246,178,60,0.22)" strokeDasharray="2 10" />
          <circle cx="200" cy="200" r="168" fill="none" stroke="rgba(238,243,236,0.06)" />
          {[0, 72, 144, 216, 288].map((deg, k) => {
            const a = (deg * Math.PI) / 180;
            return (
              <circle key={deg} cx={200 + Math.cos(a) * 192} cy={200 + Math.sin(a) * 192} r={k % 2 ? 4 : 6}
                fill={["#f6b23c", "#7bd893", "#ff6b4a", "#f2dd7b", "#e0763a"][k]} />
            );
          })}
        </svg>
        <div className="absolute inset-[11%]" aria-live="off">
          {SEQUENCE.map((s, k) => (
            <div
              key={s.slug}
              aria-hidden={k !== i}
              className={`absolute inset-0 transition-[opacity,transform] duration-[900ms] ease-[var(--ease-out-soft)] ${
                k === i ? "scale-100 rotate-0 opacity-100" : "scale-[1.06] -rotate-3 opacity-0"
              }`}
            >
              <MealVisual meal={s.meal} size={400} shape="circle" priority={k === 0} sizes="(max-width: 1024px) 78vw, 400px" className="w-full" decorative={k !== i} />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause meal slideshow" : "Play meal slideshow"}
          className="absolute bottom-1 right-1 grid size-11 place-items-center rounded-full border border-line bg-surface/80 text-muted backdrop-blur hover:text-ink"
        >
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
