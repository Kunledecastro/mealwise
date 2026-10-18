"use client";

/**
 * Signed-in user and their saved profile (Phase 2).
 * Data protection is enforced by the database (Row Level Security); this provider only
 * reads/writes the current user's own row.
 */
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { friendlyError } from "./domain/auth-errors";
import { EMPTY_PROFILE, profileToUpdate, rowToProfile, type ProfileRow } from "./domain/profile";
import { getSupabase } from "./supabase/client";
import type { Profile } from "./types";

type Status = "loading" | "signed-out" | "signed-in";
type ProfileStatus = "idle" | "loading" | "ready" | "error";

export type SaveResult = { ok: true } | { ok: false; error: string };

interface AuthState {
  status: Status;
  user: User | null;
  session: Session | null;
  profile: Profile;
  profileStatus: ProfileStatus;
  profileError: string | null;
  /** Saves the editable profile fields. Updates the screen at once and rolls back if saving fails. */
  saveProfile: (p: Profile, opts?: { completeOnboarding?: boolean }) => Promise<SaveResult>;
  reloadProfile: () => Promise<void>;
  /** Signs out on this device. The caller decides where to go next. */
  signOut: () => Promise<void>;
  /** True after the user chose to sign out (or deleted their account), so screens don't bounce them to sign-in. */
  leftOnPurpose: boolean;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfileState] = useState<Profile>(EMPTY_PROFILE);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("idle");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [leftOnPurpose, setLeftOnPurpose] = useState(false);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    const supabase = getSupabase();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setStatus(data.session ? "signed-in" : "signed-out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setStatus(s ? "signed-in" : "signed-out");
      if (s) setLeftOnPurpose(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = useCallback(async (id: string) => {
    setProfileStatus("loading");
    setProfileError(null);
    const { data, error } = await getSupabase().from("profiles").select("*").eq("id", id).maybeSingle<ProfileRow>();
    if (error || !data) {
      setProfileStatus("error");
      setProfileError(error ? friendlyError(error) : "We couldn't find your profile. Try signing out and in again.");
      return;
    }
    setProfileState(rowToProfile(data));
    setProfileStatus("ready");
  }, []);

  useEffect(() => {
    if (!userId) {
      // Signed out: forget everything about the previous user.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset local copy when the user changes
      setProfileState(EMPTY_PROFILE);
      setProfileStatus("idle");
      return;
    }
    loadProfile(userId);
  }, [userId, loadProfile]);

  const saveProfile = useCallback<AuthState["saveProfile"]>(
    async (p, opts) => {
      if (!userId) return { ok: false, error: "Please sign in again." };
      const previous = profile;
      setProfileState({ ...p, onboarded: p.onboarded || !!opts?.completeOnboarding });
      const { data, error } = await getSupabase()
        .from("profiles")
        .update(profileToUpdate(p, opts))
        .eq("id", userId)
        .select("*")
        .maybeSingle<ProfileRow>();
      if (error || !data) {
        setProfileState(previous);
        return { ok: false, error: error ? friendlyError(error) : "Your changes weren't saved. Please try again." };
      }
      setProfileState(rowToProfile(data));
      return { ok: true };
    },
    [userId, profile],
  );

  const signOut = useCallback(async () => {
    setLeftOnPurpose(true);
    await getSupabase().auth.signOut({ scope: "local" });
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user: session?.user ?? null,
      session,
      profile,
      profileStatus,
      profileError,
      saveProfile,
      reloadProfile: async () => {
        if (userId) await loadProfile(userId);
      },
      signOut,
      leftOnPurpose,
    }),
    [status, session, profile, profileStatus, profileError, saveProfile, userId, loadProfile, signOut, leftOnPurpose],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}

/** Only allow redirects to paths on this site (blocks "//evil.com" and absolute URLs). */
export function safeNext(next: string | null | undefined, fallback = "/home"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
