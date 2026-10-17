import { Logo, PrototypeBanner } from "@/components/app-shell";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PrototypeBanner />
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-5 px-5 py-12">
        <Logo />
        <h1 className="text-3xl">We couldn&apos;t find that page</h1>
        <p className="text-muted">The link may be old or mistyped. Head back home to find something to eat.</p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/home">Go to home</ButtonLink>
          <ButtonLink href="/search" variant="secondary">Search meals</ButtonLink>
        </div>
      </main>
    </div>
  );
}
