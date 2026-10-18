"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { AuthShell } from "@/components/auth-form";
import { SkeletonRows } from "@/components/ui";
import { safeNext } from "@/lib/auth";
import { friendlyError } from "@/lib/domain/auth-errors";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Where links in Mealwise emails land (confirm sign-up, sign-in link, password reset).
 * Finishes signing in, then sends the user on: new accounts to setup, everyone else home.
 */
export function CallbackView() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // the code can only be used once
    ran.current = true;
    (async () => {
      const supabase = getSupabase();
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const linkError = params.get("error_description") ?? hash.get("error_description");
      if (linkError) {
        setError(friendlyError({ code: params.get("error_code") ?? hash.get("error_code") ?? undefined, message: linkError }));
        return;
      }
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type") as EmailOtpType | null;
      let failed = null;
      if (code) {
        ({ error: failed } = await supabase.auth.exchangeCodeForSession(code));
      } else if (tokenHash && type) {
        ({ error: failed } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setError("This link is missing information. Request a new one.");
          return;
        }
      }
      if (failed) {
        setError(friendlyError(failed));
        return;
      }
      const next = params.get("next");
      if (next) return router.replace(safeNext(next));
      // No destination given: brand-new accounts go to setup, the app shell handles the rest.
      router.replace("/home");
    })();
  }, [params, router]);

  if (error)
    return (
      <AuthShell title="That link didn't work">
        <p role="alert">{error}</p>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/sign-in" className="w-fit font-semibold text-accent hover:underline">Go to sign in</Link>
          <Link href="/reset-password" className="w-fit font-semibold text-accent hover:underline">Reset your password</Link>
        </div>
      </AuthShell>
    );

  return (
    <AuthShell title="Signing you in">
      <p className="text-muted" role="status">One moment…</p>
      <SkeletonRows count={1} />
    </AuthShell>
  );
}
