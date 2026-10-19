"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { Logo, PrototypeBanner } from "./brand";
import { Button, Field, inputClass } from "./ui";
import { safeNext, useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/domain/auth-errors";
import { getSupabase } from "@/lib/supabase/client";
import { CONSENT_VERSION } from "@/lib/supabase/config";

export type AuthMode = "sign-in" | "sign-up" | "reset" | "update-password";

const TITLES: Record<AuthMode, string> = {
  "sign-in": "Sign in",
  "sign-up": "Create your account",
  reset: "Reset your password",
  "update-password": "Choose a new password",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/** Shared frame for the account screens. */
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <PrototypeBanner />
      <div className="aura -top-1/3 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 py-8">
        <Link href="/" aria-label="Mealwise welcome page">
          <Logo />
        </Link>
        <main id="main" className="rise flex flex-col gap-6 rounded-[var(--radius-lg)] border border-line bg-surface/80 p-6 backdrop-blur sm:p-8">
          <h1 className="text-4xl">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="status" className="swap-in flex flex-col gap-3 rounded-[var(--radius-md)] border border-accent/30 bg-accent-soft p-5">
      <p className="flex items-center gap-2 font-semibold">
        <MailCheck size={20} aria-hidden="true" className="text-accent" /> {title}
      </p>
      <div className="flex flex-col gap-2 text-sm">{children}</div>
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[var(--radius-sm)] border border-error/40 bg-error-soft px-4 py-3 text-sm font-medium text-error">
      {message}
    </p>
  );
}

function PasswordInput({
  id, value, onChange, autoComplete, invalid, describedBy,
}: {
  id: string; value: string; onChange: (v: string) => void; autoComplete: string; invalid: boolean; describedBy?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? "text" : "password"} className={`${inputClass} pr-14`} value={value}
        autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} aria-describedby={describedBy} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-ink">
        {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}

/** Lets the user resend a confirmation email, at most once a minute. */
function ResendSignup({ email }: { email: string }) {
  const [wait, setWait] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  async function resend() {
    setMsg(null);
    const { error } = await getSupabase().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setMsg(error ? friendlyError(error) : "Sent. Check your inbox and spam folder.");
    setWait(60);
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="secondary" className="min-h-10 px-4 text-sm" onClick={resend} disabled={wait > 0}>
        {wait > 0 ? `Send again in ${wait}s` : "Send the email again"}
      </Button>
      {msg && <span role="status" className="text-sm">{msg}</span>}
    </div>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useAuth();
  const next = safeNext(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [useLink, setUseLink] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; consent?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "check-signup" | "check-link" | "check-reset">(null);

  const passwordWanted = mode === "sign-up" || mode === "update-password" || (mode === "sign-in" && !useLink);
  const emailWanted = mode !== "update-password";

  function validate() {
    const e: typeof errors = {};
    if (emailWanted && !EMAIL.test(email.trim())) e.email = "Enter an email address like name@example.com.";
    if (passwordWanted) {
      if (mode === "sign-in" && !password) e.password = "Enter your password.";
      if (mode !== "sign-in" && password.length < MIN_PASSWORD) e.password = `Use at least ${MIN_PASSWORD} characters.`;
    }
    if (mode === "sign-up" && !consent) e.consent = "Please agree so we can save your preferences.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(null);
    setNeedsConfirm(false);
    if (!validate()) return;
    setBusy(true);
    const supabase = getSupabase();
    const origin = window.location.origin;
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: `${origin}/auth/callback`, data: { consent_version: CONSENT_VERSION } },
        });
        if (error) return setFormError(friendlyError(error));
        if (data.session) return router.replace("/onboarding");
        setDone("check-signup");
      } else if (mode === "sign-in" && useLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        // "No account for this email" is not shown, so accounts can't be discovered this way.
        if (error && error.code !== "otp_disabled" && error.code !== "user_not_found" && error.status !== 422)
          return setFormError(friendlyError(error));
        setDone("check-link");
      } else if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
          if (error.code === "email_not_confirmed") setNeedsConfirm(true);
          return setFormError(friendlyError(error));
        }
        router.replace(next);
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${origin}/auth/callback?next=/update-password`,
        });
        if (error && error.status !== 422) return setFormError(friendlyError(error));
        setDone("check-reset");
      } else if (mode === "update-password") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return setFormError(friendlyError(error));
        router.replace("/home?updated=password");
      }
    } catch (e) {
      setFormError(friendlyError(e as Error));
    } finally {
      setBusy(false);
    }
  }

  if (mode === "update-password" && status === "signed-out") {
    return (
      <AuthShell title={TITLES[mode]}>
        <p className="text-muted">This page only works from the link in your password-reset email, and that link may have expired.</p>
        <Link href="/reset-password" className="font-semibold text-accent hover:underline">Request a new reset link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={TITLES[mode]}>
      {done === "check-signup" && (
        <Notice title="Check your email">
          <p>We sent a confirmation link to <strong>{email.trim()}</strong>. Open it on this device to finish creating your account.</p>
          <p className="text-muted">It can take a minute. Check your spam folder too.</p>
          <ResendSignup email={email.trim().toLowerCase()} />
        </Notice>
      )}
      {done === "check-link" && (
        <Notice title="Check your email">
          <p>If there&apos;s an account for <strong>{email.trim()}</strong>, a sign-in link is on its way. Open it on this device.</p>
          <button type="button" className="w-fit font-semibold text-accent hover:underline" onClick={() => setDone(null)}>Use a different email</button>
        </Notice>
      )}
      {done === "check-reset" && (
        <Notice title="Check your email">
          <p>If there&apos;s an account for <strong>{email.trim()}</strong>, we&apos;ve sent a link to choose a new password.</p>
          <p className="text-muted">Open it on this device. The link expires after an hour.</p>
        </Notice>
      )}

      {!done && (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5" aria-busy={busy}>
          {mode === "update-password" && <p className="text-muted">Enter a new password for your account.</p>}
          {mode === "reset" && <p className="text-muted">Enter the email you signed up with and we&apos;ll send you a link to choose a new password.</p>}
          {emailWanted && (
            <Field id="email" label="Email" error={errors.email}>
              <input id="email" type="email" inputMode="email" autoComplete="email" className={inputClass} value={email}
                onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined} />
            </Field>
          )}
          {passwordWanted && (
            <Field id="password" label={mode === "update-password" ? "New password" : "Password"} error={errors.password}
              hint={mode !== "sign-in" ? `At least ${MIN_PASSWORD} characters.` : undefined}>
              <PasswordInput id="password" value={password} onChange={setPassword}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"} invalid={!!errors.password}
                describedBy={errors.password ? "password-error" : mode !== "sign-in" ? "password-hint" : undefined} />
            </Field>
          )}
          {mode === "sign-up" && (
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 accent-[var(--color-accent)]" aria-invalid={!!errors.consent}
                  aria-describedby={errors.consent ? "consent-error" : "consent-detail"} />
                <span>
                  I agree that Mealwise may store my food preferences, allergies and body measurements (such as weight)
                  to personalise suggestions. <span id="consent-detail" className="text-muted">I can download or delete them at any time in Settings.</span>
                </span>
              </label>
              {errors.consent && <p id="consent-error" role="alert" className="text-sm font-medium text-error">{errors.consent}</p>}
            </div>
          )}
          <FormError message={formError} />
          {needsConfirm && <ResendSignup email={email.trim().toLowerCase()} />}
          <Button type="submit" disabled={busy || status === "loading"}>
            {busy ? "Please wait…" : mode === "sign-up" ? "Create account" : mode === "reset" ? "Send reset link"
              : mode === "update-password" ? "Save new password" : useLink ? "Email me a sign-in link" : "Sign in"}
          </Button>
          {mode === "sign-in" && (
            <button type="button" className="w-fit text-sm font-semibold text-accent hover:underline"
              onClick={() => { setUseLink((u) => !u); setErrors({}); setFormError(null); }}>
              {useLink ? "Use my password instead" : "Email me a sign-in link instead"}
            </button>
          )}
        </form>
      )}

      <div className="flex flex-col gap-2 text-sm">
        {mode === "sign-in" && (
          <>
            <Link href="/reset-password" className="w-fit font-semibold text-accent hover:underline">Forgot your password?</Link>
            <p className="text-muted">
              New to Mealwise? <Link href="/sign-up" className="font-semibold text-accent hover:underline">Create an account</Link>
            </p>
          </>
        )}
        {mode === "sign-up" && (
          <p className="text-muted">
            Already have an account? <Link href="/sign-in" className="font-semibold text-accent hover:underline">Sign in</Link>
          </p>
        )}
        {mode === "reset" && <Link href="/sign-in" className="w-fit font-semibold text-accent hover:underline">Back to sign in</Link>}
      </div>
    </AuthShell>
  );
}
