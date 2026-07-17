// src/hooks/useAuth.ts
//
// The single source of truth for authentication logic. Exposes a typed API for
// email + Google auth, password reset/update, and reactive session/user state
// that the rest of the app (AuthForm, ForgotPassword, ResetPassword, Header,
// ProtectedRoute, Dashboard) consumes.
//
// Design notes:
//   * We use a module-level singleton store so every component sharing this
//     hook observes the same session state without needing a wrapping
//     <AuthProvider>. (An AuthContext could layer on top, but this keeps the
//     hook self-contained and avoids "used outside provider" runtime errors.)
//   * signInWithGoogle redirects to `${origin}/auth/callback?redirect=...`,
//     which is finalized by src/pages/AuthCallback.tsx.
//   * signUpWithEmail sets emailRedirectTo so confirmation links land back in
//     the app; it returns { session } so callers can distinguish
//     confirmation-required (no session) from instant signup (session).

import { useEffect, useState } from "react";
import type { AuthError, Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpResult {
  session: Session | null;
  user: User | null;
  error: AuthError | null;
}

export interface AuthResult {
  error: AuthError | null;
}

/** String-error shaped results for flows the UI reads as `{ error: string }`. */
export interface StringErrorResult {
  error: string | null;
}

export interface UseAuthValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUpWithEmail: (params: SignUpParams) => Promise<SignUpResult>;
  signInWithEmail: (params: SignInParams) => Promise<AuthResult>;
  signInWithGoogle: (redirectTo?: string) => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<StringErrorResult>;
  updatePassword: (newPassword: string) => Promise<StringErrorResult>;
  signOut: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Shared reactive store (module singleton)
// ---------------------------------------------------------------------------

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

let state: AuthState = { session: null, user: null, loading: true };
const listeners = new Set<(s: AuthState) => void>();
let initialized = false;

function setState(next: Partial<AuthState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener(state));
}

/** Boot the Supabase auth listener exactly once for the whole app. */
function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  supabase.auth
    .getSession()
    .then(({ data }) => {
      setState({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      });
    })
    .catch(() => {
      setState({ loading: false });
    });

  supabase.auth.onAuthStateChange((_event, session) => {
    setState({
      session,
      user: session?.user ?? null,
      loading: false,
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function appOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): UseAuthValue {
  ensureInitialized();

  const [local, setLocal] = useState<AuthState>(state);

  useEffect(() => {
    const listener = (s: AuthState) => setLocal(s);
    listeners.add(listener);
    // Sync immediately in case state changed between render and effect.
    setLocal(state);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const signUpWithEmail = async ({
    email,
    password,
    fullName,
  }: SignUpParams): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Confirmation link lands back in the app.
        emailRedirectTo: `${appOrigin()}/auth/callback`,
        data: { full_name: fullName },
      },
    });

    return {
      session: data?.session ?? null,
      user: data?.user ?? null,
      error,
    };
  };

  const signInWithEmail = async ({
    email,
    password,
  }: SignInParams): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async (
    redirectTo = "/dashboard"
  ): Promise<AuthResult> => {
    const callbackUrl = `${appOrigin()}/auth/callback?redirect=${encodeURIComponent(
      redirectTo
    )}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    return { error };
  };

  const sendPasswordReset = async (
    email: string
  ): Promise<StringErrorResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appOrigin()}/reset-password`,
    });
    return { error: error ? error.message : null };
  };

  const updatePassword = async (
    newPassword: string
  ): Promise<StringErrorResult> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session: local.session,
    user: local.user,
    loading: local.loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    updatePassword,
    signOut,
  };
}

export default useAuth;
