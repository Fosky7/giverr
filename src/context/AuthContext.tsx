// src/context/AuthContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { mapProfileRow, type Profile, type ProfileRow } from "@/types/profile";

/**
 * Shape of the value exposed by {@link AuthContext}. This is the single source
 * of truth for auth state across the app — Header, Dashboard, ProfileForm, and
 * the `useAuth` hook all read from here.
 */
export interface AuthContextValue {
  /** The authenticated Supabase user, or null when signed out. */
  user: User | null;
  /** The active session, or null when signed out. */
  session: Session | null;
  /** The current user's profile row (null while loading or when absent). */
  profile: Profile | null;
  /**
   * True during the initial session bootstrap. Consumers should render a
   * loading state (or defer redirects) until this flips to false.
   */
  loading: boolean;
  /**
   * Re-fetch the current user's profile row. Exposed so mutations (e.g. the
   * profile settings form) can refresh the shared profile after saving.
   */
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Fetch a single profile row for the given user id and normalize it. Returns
 * null when no row exists yet (e.g. the auto-provision trigger hasn't run) or
 * on any read error — callers treat a missing profile as "not loaded".
 */
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, avatar_url, bio, notification_preferences, created_at, updated_at"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfileRow(data as ProfileRow);
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider that bootstraps the Supabase session, subscribes to auth state
 * changes, and keeps the current user's profile row in sync. Wrap the app tree
 * with this so every consumer shares one auth state instance.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Track the latest user id so async profile fetches can be ignored if the
  // user changed while a request was in flight (avoids stale state writes).
  const activeUserIdRef = useRef<string | null>(null);

  /**
   * Load (or clear) the profile for a given user id, guarding against races
   * where the auth state changes again before the fetch resolves.
   */
  const loadProfile = useCallback(async (userId: string | null) => {
    activeUserIdRef.current = userId;

    if (!userId) {
      setProfile(null);
      return;
    }

    const next = await fetchProfile(userId);
    // Ignore results for a user that is no longer active.
    if (activeUserIdRef.current === userId) {
      setProfile(next);
    }
  }, []);

  /** Public helper to re-fetch the active user's profile on demand. */
  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    const userId = activeUserIdRef.current;
    if (!userId) {
      setProfile(null);
      return null;
    }
    const next = await fetchProfile(userId);
    if (activeUserIdRef.current === userId) {
      setProfile(next);
    }
    return next;
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1) Bootstrap the initial session synchronously-ish on mount.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const initialSession = data.session ?? null;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      void loadProfile(initialSession?.user?.id ?? null).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    // 2) Subscribe to subsequent auth state changes (login, logout, refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      void loadProfile(nextSession?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, profile, loading, refreshProfile }),
    [user, session, profile, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Internal accessor for the raw auth context. Prefer the `useAuth` hook (which
 * layers actions on top) in application code. Throws if used outside a
 * {@link AuthProvider}.
 */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuthContext must be used within an <AuthProvider>");
  }
  return ctx;
}

export { AuthContext };
