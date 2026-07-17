// src/hooks/useAuth.ts
import { useCallback, useMemo } from "react";
import type { Provider } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { useAuthContext, type AuthContextValue } from "@/context/AuthContext";
import type { Profile } from "@/types/profile";

/** OAuth providers currently supported by the app. */
export type OAuthProvider = Extract<Provider, "google" | "facebook">;

/** Uniform result envelope so callers can render inline alerts consistently. */
export interface AuthActionResult {
  /** A user-friendly error message, or null on success. */
  error: string | null;
}

/** Result of a sign-up, which may or may not produce an immediate session. */
export interface SignUpResult extends AuthActionResult {
  /**
   * True when Supabase returned no session (email confirmation is required).
   * Callers can use this to show a "check your inbox" message.
   */
  needsEmailConfirmation: boolean;
}

export interface UseAuthValue extends AuthContextValue {
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<AuthActionResult>;
  signUpWithPassword: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => Promise<SignUpResult>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  sendPasswordReset: (email: string) => Promise<AuthActionResult>;
  updatePassword: (newPassword: string) => Promise<AuthActionResult>;
  refreshProfile: () => Promise<Profile | null>;
}

/**
 * Normalize any thrown value / Supabase error into a readable string. Keeps
 * every action's error handling consistent and avoids leaking `[object Object]`.
 */
function normalizeError(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err instanceof Error && err.message) return err.message;
  if (
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

/**
 * Central authentication hook. Reads shared state from {@link useAuthContext}
 * and layers action methods that wrap the Supabase client. Every action returns
 * a `{ error }` envelope (never throws) so UI can render inline feedback.
 */
export function useAuth(): UseAuthValue {
  const { user, session, profile, loading, refreshProfile } = useAuthContext();

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        return { error: error ? error.message : null };
      } catch (err) {
        return {
          error: normalizeError(err, "Unable to sign in. Please try again."),
        };
      }
    },
    []
  );

  const signUpWithPassword = useCallback(
    async (
      email: string,
      password: string,
      metadata?: Record<string, unknown>
    ): Promise<SignUpResult> => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: metadata,
          },
        });

        if (error) {
          return { error: error.message, needsEmailConfirmation: false };
        }

        return {
          error: null,
          // No session means Supabase requires email confirmation.
          needsEmailConfirmation: !data.session,
        };
      } catch (err) {
        return {
          error: normalizeError(
            err,
            "Unable to create your account. Please try again."
          ),
          needsEmailConfirmation: false,
        };
      }
    },
    []
  );

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider): Promise<AuthActionResult> => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
          },
        });
        return { error: error ? error.message : null };
      } catch (err) {
        return {
          error: normalizeError(
            err,
            `Unable to continue with ${provider}. Please try again.`
          ),
        };
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? error.message : null };
    } catch (err) {
      return {
        error: normalizeError(err, "Unable to sign out. Please try again."),
      };
    }
  }, []);

  const sendPasswordReset = useCallback(
    async (email: string): Promise<AuthActionResult> => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );
        return { error: error ? error.message : null };
      } catch (err) {
        return {
          error: normalizeError(
            err,
            "Unable to send the reset email. Please try again."
          ),
        };
      }
    },
    []
  );

  const updatePassword = useCallback(
    async (newPassword: string): Promise<AuthActionResult> => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        return { error: error ? error.message : null };
      } catch (err) {
        return {
          error: normalizeError(
            err,
            "Unable to update your password. Please try again."
          ),
        };
      }
    },
    []
  );

  return useMemo<UseAuthValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      refreshProfile,
      signInWithPassword,
      signUpWithPassword,
      signInWithOAuth,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [
      user,
      session,
      profile,
      loading,
      refreshProfile,
      signInWithPassword,
      signUpWithPassword,
      signInWithOAuth,
      signOut,
      sendPasswordReset,
      updatePassword,
    ]
  );
}

export default useAuth;
