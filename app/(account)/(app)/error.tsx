"use client";

import { Button, ButtonLink, ErrorState } from "@/components/ui";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="This screen didn't load"
      body="Something went wrong while showing this page. Try again, or go back to your home screen."
      action={
        <div className="flex flex-wrap gap-2">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/home" variant="secondary">Go to home</ButtonLink>
        </div>
      }
    />
  );
}
