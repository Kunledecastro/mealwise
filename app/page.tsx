import Link from "next/link";
import { BadgeCheck, HeartHandshake, ShieldCheck, Smartphone, Soup, Wallet } from "lucide-react";
import { Logo, PrototypeBanner } from "@/components/app-shell";
import { HeroCycler } from "@/components/landing/hero-cycler";
import { ScrollStory } from "@/components/landing/scroll-story";
import { AccountDeletedNotice } from "@/components/landing/account-notice";
import { RevealRoot, SpotlightGroup } from "@/components/motion";
import { ButtonLink } from "@/components/ui";
import { MEALS, getMeal } from "@/catalogue";
import { MealVisual } from "@/components/meal-visual";

const FEATURES = [
  {
    icon: Soup,
    title: "Nigerian food first",
    body: "Jollof, efo riro, moi moi, yam and egg, beans and plantain — next to oats and salads when you want them.",
    wide: true,
  },
  { icon: Wallet, title: "Priced in naira", body: "Every meal shows a price range and when it was checked, so you can plan to your budget." },
  { icon: ShieldCheck, title: "Allergies respected", body: "Tell us once. Meals with your allergens stay off your list." },
  { icon: HeartHandshake, title: "No guilt, ever", body: "No red numbers, no “cheat days”. Just what you ate and where you're heading." },
  { icon: BadgeCheck, title: "Honest numbers", body: "Calories and prices are estimates, and we say so, with the source a tap away." },
  {
    icon: Smartphone,
    title: "Light on your data",
    body: "Opens fast on everyday Android phones and installs to your home screen like an app.",
    wide: true,
  },
];

/** Dishes the hero cycles through. Looked up here on the server and passed in, so the full catalogue isn't sent to the browser. */
const HERO_SEQUENCE = [
  { slug: "jollof-rice-chicken", when: "Lunch" },
  { slug: "akara-and-pap", when: "Breakfast" },
  { slug: "egusi-pounded-yam", when: "Dinner" },
  { slug: "yam-and-egg-sauce", when: "Breakfast" },
  { slug: "plantain-groundnuts", when: "Snack" },
  { slug: "efo-riro-eba", when: "Dinner" },
];

function DishMarquee({ reverse = false }: { reverse?: boolean }) {
  // A selection keeps the page light on phones.
  const pick = MEALS.filter((_, i) => i % 2 === 0).slice(0, 18);
  const meals = reverse ? [...pick].reverse() : pick;
  const row = (hidden: boolean) =>
    meals.map((m) => (
      <li key={`${m.slug}-${hidden}`} aria-hidden={hidden || undefined}
        className="mx-2 flex shrink-0 items-center gap-3 rounded-full border border-line bg-surface py-2 pl-2 pr-5">
        <MealVisual meal={m} size={40} shape="circle" decorative />
        <span className="whitespace-nowrap font-semibold">{m.name}</span>
      </li>
    ));
  return (
    <div className="marquee-wrap overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <ul className="marquee py-1" style={reverse ? { animationDirection: "reverse", animationDuration: "48s" } : undefined}>
        {row(false)}
        {row(true)}
      </ul>
    </div>
  );
}

export default function LandingPage() {
  return (
    <RevealRoot>
      <div className="relative min-h-dvh overflow-x-clip">
        <PrototypeBanner />
        <AccountDeletedNotice />

        <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/75 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
            <Link href="/" aria-label="Mealwise home"><Logo /></Link>
            <nav aria-label="Page sections" className="hidden items-center gap-7 text-sm font-semibold text-muted md:flex">
              <a href="#how" className="hover:text-ink">How it works</a>
              <a href="#features" className="hover:text-ink">Why Mealwise</a>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/sign-in" className="hidden min-h-11 items-center px-3 font-semibold text-muted hover:text-ink sm:inline-flex">Sign in</Link>
              <ButtonLink href="/sign-up" className="min-h-11 px-5 text-sm">Get started</ButtonLink>
            </div>
          </div>
        </header>

        <main id="main">
          {/* Hero */}
          <section className="relative">
            <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-12 sm:pt-16 lg:pb-24">
              <HeroCycler items={HERO_SEQUENCE.map((h) => ({ ...h, meal: getMeal(h.slug)! }))} />
              <div className="rise mt-10 flex flex-col gap-6 lg:-mt-6 lg:max-w-xl" style={{ "--delay": "240ms" } as React.CSSProperties}>
                <p className="max-w-[46ch] text-lg text-muted">
                  Real meals that fit your taste, your budget and your weight goal. Built for Nigerian kitchens, with no
                  calorie spreadsheets and no guilt.
                </p>
                <div className="flex flex-wrap gap-3">
                  <ButtonLink href="/sign-up">Find my next meal</ButtonLink>
                  <ButtonLink href="/sign-in" variant="secondary">I have an account</ButtonLink>
                </div>
              </div>
            </div>
          </section>

          {/* Dishes */}
          <section aria-label="Some of the meals in Mealwise" className="flex flex-col gap-3 border-y border-line/60 py-8">
            <DishMarquee />
            <DishMarquee reverse />
          </section>

          {/* How it works */}
          <section id="how" aria-labelledby="how-title" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 lg:py-28">
            <div data-reveal className="mb-6 max-w-2xl lg:mb-0">
              <h2 id="how-title" className="text-4xl sm:text-5xl">From “I don&apos;t know” to dinner in three taps.</h2>
            </div>
            <ScrollStory jollof={getMeal("jollof-rice-chicken")!} />
          </section>

          {/* Features */}
          <section id="features" aria-labelledby="features-title" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 pb-24">
            <h2 id="features-title" data-reveal className="mb-10 max-w-2xl text-4xl sm:text-5xl">
              Made for how you actually eat.
            </h2>
            <SpotlightGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f, i) => (
                <article
                  key={f.title}
                  data-reveal
                  style={{ "--delay": `${(i % 4) * 90}ms` } as React.CSSProperties}
                  className={`spotlight flex flex-col gap-4 rounded-[var(--radius-lg)] border border-line bg-surface p-6 transition-colors hover:border-accent/40 ${f.wide ? "lg:col-span-2" : ""}`}
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
                    <f.icon size={22} aria-hidden="true" />
                  </span>
                  <h3 className="text-2xl">{f.title}</h3>
                  <p className="text-muted">{f.body}</p>
                </article>
              ))}
            </SpotlightGroup>
          </section>

          {/* Closing call to action */}
          <section aria-labelledby="cta-title" className="relative overflow-hidden border-t border-line/60">
            <div className="aura" aria-hidden="true" />
            <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-5 py-24 text-center lg:py-32">
              <div data-reveal className="flex -space-x-6" aria-hidden="true">
                {["akara-and-pap", "jollof-rice-chicken", "egusi-pounded-yam"].map((s, i) => {
                  const m = getMeal(s)!;
                  return (
                    <div key={s} className="float" style={{ "--delay": `${i * 700}ms` } as React.CSSProperties}>
                      <MealVisual meal={m} size={i === 1 ? 150 : 116} shape="circle" decorative />
                    </div>
                  );
                })}
              </div>
              <h2 id="cta-title" data-reveal className="text-5xl sm:text-6xl">
                Eat well with the food you already love.
              </h2>
              <div data-reveal>
                <ButtonLink href="/sign-up">Get started, it takes two minutes</ButtonLink>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-line/60">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <Logo />
            <p className="max-w-xl">
              Mealwise gives general food guidance and is not a substitute for advice from a doctor or dietitian. Calories
              and prices are estimates calculated from ingredient data.
            </p>
          </div>
        </footer>
      </div>
    </RevealRoot>
  );
}
