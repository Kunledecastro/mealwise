"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Logo, PrototypeBanner } from "./app-shell";
import { Button, ButtonLink, Field, inputClass } from "./ui";

type Mode = "sign-in" | "sign-up" | "reset";

const COPY: Record<Mode, { title: string; submit: string; next: string; nextLabel: string }> = {
  "sign-in": { title: "Sign in", submit: "Sign in", next: "/home", nextLabel: "Continue with sample data" },
  "sign-up": { title: "Create your account", submit: "Create account", next: "/onboarding", nextLabel: "Continue to setup" },
  reset: { title: "Reset your password", submit: "Send reset link", next: "/sign-in", nextLabel: "Back to sign in" },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({ mode }: { mode: Mode }) {
  const c = COPY[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL.test(email.trim())) next.email = "Enter an email address like name@example.com.";
    if (mode !== "reset" && password.length < (mode === "sign-up" ? 8 : 1))
      next.password = mode === "sign-up" ? "Use at least 8 characters." : "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length === 0) setSubmitted(true);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <PrototypeBanner />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 py-8">
        <Link href="/" aria-label="Mealwise welcome page">
          <Logo />
        </Link>
        <main id="main" className="flex flex-col gap-6">
          <h1 className="text-3xl">{c.title}</h1>
          {submitted ? (
            <div role="status" className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-line bg-surface p-5">
              <p className="font-semibold">Accounts aren&apos;t switched on in this prototype.</p>
              <p className="text-muted">
                Your details were checked but not sent anywhere. Sign-in, sign-up and password reset will work once
                accounts are added in the next phase.
              </p>
              <ButtonLink href={c.next}>{c.nextLabel}</ButtonLink>
            </div>
          ) : (
            <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
              <Field id="email" label="Email" error={errors.email}>
                <input id="email" type="email" autoComplete="email" className={inputClass} value={email}
                  onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined} />
              </Field>
              {mode !== "reset" && (
                <Field id="password" label="Password" error={errors.password}
                  hint={mode === "sign-up" ? "At least 8 characters." : undefined}>
                  <input id="password" type="password" className={inputClass} value={password}
                    autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                    onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : mode === "sign-up" ? "password-hint" : undefined} />
                </Field>
              )}
              <Button type="submit">{c.submit}</Button>
            </form>
          )}
          <div className="flex flex-col gap-2 text-sm">
            {mode === "sign-in" && (
              <>
                <Link href="/reset-password" className="font-semibold text-leaf hover:underline">Forgot your password?</Link>
                <p className="text-muted">
                  New to Mealwise? <Link href="/sign-up" className="font-semibold text-leaf hover:underline">Create an account</Link>
                </p>
              </>
            )}
            {mode === "sign-up" && (
              <p className="text-muted">
                Already have an account? <Link href="/sign-in" className="font-semibold text-leaf hover:underline">Sign in</Link>
              </p>
            )}
            {mode === "reset" && (
              <Link href="/sign-in" className="font-semibold text-leaf hover:underline">Back to sign in</Link>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
