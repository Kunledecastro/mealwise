"use client";

import { useEffect, useRef, useState } from "react";
import { getMeal } from "@/catalogue";
import { MealVisual } from "@/components/meal-visual";

const STEPS = [
  {
    title: "Tell us your goal",
    body: "Lose, gain or keep steady. Add what you can't eat, what you don't like and what you want to spend. Skip anything you'd rather not say.",
  },
  {
    title: "Get meals that fit",
    body: "Breakfast, lunch, dinner or a snack, with the time it takes, a price range in naira and a plain reason it suits you.",
  },
  {
    title: "Log it and watch the trend",
    body: "Tap “I ate this”, add your weight now and then, and see where things are heading. No streaks to break, no guilt.",
  },
];

const jollof = getMeal("jollof-rice-chicken")!;

function PhoneScreen({ step, id = "a" }: { step: number; id?: string }) {
  return (
    <div className="relative mx-auto aspect-[9/18.5] w-full max-w-[15rem] lg:max-w-[17rem] rounded-[2.6rem] border border-line bg-[#0a100d] p-2.5 shadow-[0_40px_120px_-30px_rgba(246,178,60,0.35)]">
      <div className="absolute left-1/2 top-3 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
      <div className="relative h-full overflow-hidden rounded-[2.1rem] bg-paper px-4 pb-4 pt-10">
        <div key={step} className="swap-in flex h-full flex-col gap-3">
          {step === 0 && (
            <>
              <p className="font-display text-xl font-semibold">Your goal</p>
              {["Lose weight", "Maintain my weight", "Gain weight"].map((g, k) => (
                <div key={g} className={`rounded-2xl border p-3 text-sm font-semibold ${k === 0 ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}>{g}</div>
              ))}
              <div className="mt-auto flex flex-wrap gap-1.5">
                {["Peanuts", "Shellfish", "No pork"].map((c) => (
                  <span key={c} className="rounded-full border border-line px-2.5 py-1 text-[11px]">{c}</span>
                ))}
              </div>
              <div className="rounded-full bg-accent py-2.5 text-center text-sm font-semibold text-on-accent">Continue</div>
            </>
          )}
          {step === 1 && (
            <>
              <p className="text-xs text-muted">Lunch idea</p>
              <MealVisual meal={jollof} size={200} shape="card" animate sizes="220px" className="w-full" decorative />
              <p className="font-display text-lg font-semibold leading-tight">{jollof.name}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-fresh-soft px-2.5 py-1 text-[11px] font-semibold text-fresh">High protein</span>
                <span className="rounded-full bg-fresh-soft px-2.5 py-1 text-[11px] font-semibold text-fresh">Fits your budget</span>
              </div>
              <div className="mt-auto rounded-full bg-accent py-2.5 text-center text-sm font-semibold text-on-accent">I ate this</div>
            </>
          )}
          {step === 2 && (
            <>
              <p className="font-display text-xl font-semibold">Progress</p>
              <p className="font-display text-3xl font-semibold">79.4 <span className="text-base text-muted">kg</span></p>
              <svg viewBox="0 0 200 110" className="w-full" aria-hidden="true">
                <defs>
                  <linearGradient id={`story-fill-${id}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#f6b23c" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#f6b23c" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M5 25 L35 32 L65 28 L95 45 L125 52 L155 50 L195 70 L195 110 L5 110Z" fill={`url(#story-fill-${id})`} />
                <path d="M5 25 L35 32 L65 28 L95 45 L125 52 L155 50 L195 70" fill="none" stroke="#f6b23c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="draw-line" />
              </svg>
              <div className="flex flex-col gap-2 text-xs">
                {["Akara and pap", "Fresh fruit bowl"].map((m) => (
                  <div key={m} className="flex justify-between rounded-xl bg-surface px-3 py-2"><span>{m}</span><span className="text-muted">logged</span></div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Sticky phone that changes screen as each step scrolls into view. */
export function ScrollStory() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
      <div className="hidden lg:sticky lg:top-[12vh] lg:block lg:h-[76vh] lg:self-start">
        <div className="relative flex h-full items-center">
          <div className="aura opacity-60" aria-hidden="true" />
          <div className="relative w-full">
            <PhoneScreen step={active} />
          </div>
        </div>
      </div>
      <ol className="flex flex-col">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            ref={(el) => { refs.current[i] = el; }}
            data-step={i}
            className="flex flex-col justify-center gap-4 border-l-2 py-10 pl-6 transition-colors duration-500 lg:min-h-[70vh] lg:pl-10"
            style={{ borderColor: active === i ? "var(--color-accent)" : "var(--color-line)" }}
          >
            <span className={`font-display text-lg font-semibold transition-colors ${active === i ? "text-accent" : "text-muted"}`}>
              Step {i + 1}
            </span>
            <h3 className={`text-3xl transition-opacity duration-500 sm:text-4xl ${active === i ? "opacity-100" : "opacity-60"}`}>{s.title}</h3>
            <p className="max-w-md text-lg text-muted">{s.body}</p>
            <div className="mt-4 lg:hidden">
              <PhoneScreen step={i} id={`m${i}`} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
