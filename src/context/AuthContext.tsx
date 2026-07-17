// src/context/AuthContext.tsx
//
// The single source of truth for authentication state and actions across the
// app. Wraps Supabase Auth and exposes a normalized API where every mutating
// method resolves to `{ error: string | null }` (plus `data` where relevant),
// so consuming components never touch raw Supabase error shapes.
//
// State:
//   - user     : the current Supabase User (or null)
//   - session  : the current Session (or null)
//   - loading  : true until the initial getSession() resolves
//
// On mount we call getSession() once, then subscribe to onAuthStateChange to
// keep user/session in sync across tabs and through the full auth lifecycle
// (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, PASSWORD_RECOVERY, USER_UPDATED).

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { mapAuthError } from "@/lib/authErrors";

/** Normalized result returned by every auth mutation. */
export interface AuthResult<TData = unknown> {
  error: string | null;
  data?: TData;
}

/** Public shape of the auth context consumed via `useAuth`. */
export interface AuthContextValue {
  /** Current authenticated user, or null when signed out. */
  user: User | null;
  /** Current Supabase session, or null when signed out. */
  session: Session | null;
  /** True until the initial session lookup completes. */
  loading: boolean;
  /** Convenience flag derived from `user`. */
  isAuthenticated: boolean;

  /** Register a new account with email + password. */
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<AuthResult<{ needsEmailConfirmation: boolean }>>;

  /** Sign in an existing user with email + password. */
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;

  /** Begin the Google OAuth redirect flow. */
  signInWithGoogle: (redirectTo?: string) => Promise<AuthResult>;

  /** Send a password-reset email. */
  sendPasswordReset: (email: string) => Promise<AuthResult>;

  /** Update the current user's password (during recovery or when signed in). */
  updatePassword: (password: string) => Promise<AuthResult>;

  /** Sign the current user out. */
  signOut: () => Promise<AuthResult>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

/** Safely read the browser origin (guards SSR / non-browser environments). */
function getOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider that owns Supabase auth state and exposes the normalized API.
 * Mount this near the root of the app (above the router) so every route and
 * hook can read a consistent auth surface.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Subscribe FIRST so we never miss an event that fires between the
    //    getSession() call and the listener attaching (e.g. OAuth redirects
    //    or magic-link consumption on load).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      // All handled events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED,
      // PASSWORD_RECOVERY, USER_UPDATED) simply carry the latest session —
      // syncing both pieces of state keeps the app consistent.
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    // 2. Resolve the current session on mount.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .catch(() => {
        // Swallow — a failed initial lookup just means "not signed in yet".
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUpWithEmail = useCallback<AuthContextValue["signUpWithEmail"]>(
    async (email, password, fullName) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            // Where the confirmation link lands the user after verifying.
            emailRedirectTo: `${getOrigin()}/dashboard`,
            data: fullName?.trim()
              ? { full_name: fullName.trim() }
              : undefined,
          },
        });

        if (error) {
          return { error: mapAuthError(error) };
        }

        // When email confirmation is enabled, Supabase returns a user with an
        // empty `identities` array and no active session. Surface that so the
        // UI can show a "check your inbox" message instead of assuming login.
        const needsEmailConfirmation =
          !data.session &&
          (!data.user?.identities || data.user.identities.length === 0
            ? true
            : !data.user?.confirmed_at && !data.user?.email_confirmed_at);

        return {
          error: null,
          data: { needsEmailConfirmation: Boolean(needsEmailConfirmation) },
        };
      } catch (err) {
        return { error: mapAuthError(err) };
      }
    },
    []
  );

  const signInWithEmail = useCallback<AuthContextValue["signInWithEmail"]>(
    async (email, password) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) return { error: mapAuthError(error) };
        return { error: null };
      } catch (err) {
        return { error: mapAuthError(err) };
      }
    },
    []
  );

  const signInWithGoogle = useCallback<AuthContextValue["signInWithGoogle"]>(
    async (redirectTo) => {
      try {
        // Route the OAuth response back through our dedicated callback route,
        // which finalizes the session and forwards to the intended page. We
        // encode any post-login destination as a query param the callback reads.
        const callbackBase = `${getOrigin()}/auth/callback`;
        const callbackUrl = redirectTo
          ? `${callbackBase}?next=${encodeURIComponent(redirectTo)}`
          : callbackBase;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: callbackUrl,
            queryParams: {
              // Ask Google to always return a refresh token + let the user pick
              // an account, which avoids silent "stuck" states.
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });

        if (error) return { error: mapAuthError(error) };
        // On success the browser is redirected away; this resolves is mostly for
        // the (rare) case where the redirect is deferred.
        return { error: null };
      } catch (err) {
        return { error: mapAuthError(err) };
      }
    },
    []
  );

  const sendPasswordReset = useCallback<AuthContextValue["sendPasswordReset"]>(
    async (email) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: `${getOrigin()}/reset-password` }
        );
        if (error) return { error: mapAuthError(error) };
        return { error: null };
      } catch (err) {
        return { error: mapAuthError(err) };
      }
    },
    []
  );

  const updatePassword = useCallback<AuthContextValue["updatePassword"]>(
    async (password) => {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { error: mapAuthError(error) };
        return { error: null };
      } catch (err) {
        return { error: mapAuthError(err) };
      }
    },
    []
  );

  const signOut = useCallback<AuthContextValue["signOut"]>(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error: mapAuthError(error) };
      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(user),
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      sendPasswordReset,
      updatePassword,
      signOut,
    }),
    [
      user,
      session,
      loading,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      sendPasswordReset,
      updatePassword,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
