import Link from "next/link";
import { Logo, PrototypeBanner } from "@/components/app-shell";
import { PlateArt } from "@/components/plate-art";
import { ButtonLink } from "@/components/ui";
import { SAMPLE_MEALS } from "@/lib/sample-data";

const hero = SAMPLE_MEALS.find((m) => m.slug === "jollof-rice-chicken")!;
const trio = ["akara-and-pap", "efo-riro-eba", "fruit-bowl"].map((s) => SAMPLE_MEALS.find((m) => m.slug === s)!);

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PrototypeBanner />
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <Logo />
        <Link href="/sign-in" className="font-semibold text-leaf underline-offset-4 hover:underline">
          Sign in
        </Link>
      </header>
      <main id="main" className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-5 pb-12 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl sm:text-[3.6rem]">What can I eat next?</h1>
          <p className="max-w-[34ch] text-lg text-muted">
            Mealwise suggests real meals, from jollof to oats, that fit your taste, your budget and your weight goal.
            No guilt, no spreadsheets.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/onboarding">Get started</ButtonLink>
            <ButtonLink href="/sign-in" variant="secondary">
              I have an account
            </ButtonLink>
          </div>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:gap-6" aria-label="Example meals">
            {trio.map((m) => (
              <li key={m.slug} className="flex items-center gap-2">
                <PlateArt parts={m.plate} seed={m.slug} size={44} title={m.name} />
                <span>
                  <span className="block font-semibold text-ink">{m.name}</span>
                  {m.mealTypes[0][0].toUpperCase() + m.mealTypes[0].slice(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <PlateArt parts={hero.plate} seed={hero.slug} size={420} animate className="h-auto w-full" title={hero.name} />
          <p className="absolute bottom-2 right-0 rounded-full bg-surface px-4 py-2 text-sm font-semibold shadow-sm">
            {hero.name}
          </p>
        </div>
      </main>
      <footer className="mx-auto w-full max-w-5xl px-5 pb-8 text-sm text-muted">
        Mealwise gives general food guidance and is not a substitute for advice from a doctor or dietitian.
      </footer>
    </div>
  );
}
