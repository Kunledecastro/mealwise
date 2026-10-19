import Link from "next/link";
import { Logo, PrototypeBanner } from "@/components/brand";
import { CONSENT_VERSION } from "@/lib/supabase/config";

export const metadata = { title: "Privacy" };

/**
 * Plain-language privacy notice. DRAFT for the product owner and a lawyer to review before any public
 * launch (docs/PRIVACY_REVIEW.md). It describes what the app actually does today; it makes no claim of
 * legal compliance.
 */
export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PrototypeBanner />
      <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10">
        <Link href="/" aria-label="Mealwise welcome page"><Logo /></Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl">Privacy</h1>
          <p className="text-muted">How Mealwise uses your information. Version {CONSENT_VERSION}.</p>
          <p role="note" className="rounded-[var(--radius-md)] bg-plantain-soft px-4 py-3 text-sm">
            Draft for the test version. It will be reviewed before Mealwise opens to the public.
          </p>
        </div>

        <Section title="What we keep">
          <ul className="list-disc pl-5">
            <li>Your email address and a protected form of your password (handled by our sign-in provider).</li>
            <li>Your profile: name if you give one, year of birth, height, weight, goal, activity level, and sex if you choose to give it.</li>
            <li>Your food preferences: eating style, allergies, dislikes, cuisines, budget and cooking time.</li>
            <li>Whether you told us you&apos;re pregnant, breastfeeding or have a condition that affects what you eat. We store only yes or no, never which one.</li>
            <li>The meals you save or mark &ldquo;Not for me&rdquo;, the meals you log, your weight history, and your meal plan and shopping list ticks.</li>
          </ul>
          <p>Your weight, the meals you eat and the pregnancy or medical answer are sensitive. We treat everything you tell us as private.</p>
        </Section>

        <Section title="Why we use it">
          <p>
            Only to run Mealwise for you: to suggest meals that fit your goal, allergies and preferences, to work out your daily target,
            and to show your log, progress and plans. We don&apos;t sell your information, show you adverts, or share it with anyone for
            their own use. You agree to this when you create an account, and you can take that back at any time by deleting your account.
          </p>
        </Section>

        <Section title="Where it's kept">
          <p>
            In a database run by Supabase in London, United Kingdom, so it leaves Nigeria. The app itself is hosted by Vercel. Both
            process your information only to run Mealwise for us. Information travels encrypted, and every request is checked so that
            only you can see or change your own records.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            Until you delete it or delete your account. Deleting your account removes your profile, log, weights, plan and choices
            straight away. Our private backups are kept for at most 30 days, so deleted information is gone from them within 30 days.
          </p>
        </Section>

        <Section title="Your choices">
          <ul className="list-disc pl-5">
            <li>See and change your details in Profile.</li>
            <li>Download everything we keep about you: Settings → Download my data.</li>
            <li>Remove log entries and weights one by one, or delete your account: Settings → Delete my account.</li>
            <li>Sign out on every device: Settings → Sign out on all devices.</li>
          </ul>
        </Section>

        <Section title="Health information">
          <p>
            Mealwise gives general guidance about food. It isn&apos;t medical advice and doesn&apos;t replace a doctor, midwife or registered
            dietitian. Calories and prices are estimates. Mealwise is for adults aged 18 and over.
          </p>
        </Section>

        <Section title="Questions">
          <p>During the test, contact the person who invited you to test Mealwise.</p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl">{title}</h2>
      <div className="flex flex-col gap-2 text-muted [&_strong]:text-ink">{children}</div>
    </section>
  );
}
