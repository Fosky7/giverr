// src/components/auth/AuthForm.tsx
//
// Shared authentication form used by both Login.tsx (mode="login") and
// Signup.tsx (mode="signup"). It owns all client-side validation, wiring to the
// useAuth hook, loading/error UI, the email-confirmation success panel, and the
// "Continue with Google" OAuth entry point.
//
// Prop contract (MUST match Login.tsx / Signup.tsx imports exactly):
//   - mode:       'login' | 'signup'
//   - redirectTo: string  (where to send the user after a successful login /
//                          session-bearing signup)

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, LogIn, UserPlus } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export interface AuthFormProps {
  /** Which flavour of the form to render. */
  mode: "login" | "signup";
  /**
   * Where to navigate after a successful login (or a signup that returns an
   * immediate session). Defaults to the dashboard.
   */
  redirectTo?: string;
}

const MIN_PASSWORD_LENGTH = 6;

/** Basic RFC-5322-ish email check — good enough for client-side gating. */
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Google "G" glyph rendered inline so we don't depend on a brand asset. Uses
 * the official multi-colour mark. Marked aria-hidden since the button already
 * has a visible label.
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

/**
 * Shared login/signup form. See file header for the prop contract.
 */
export function AuthForm({ mode, redirectTo = "/dashboard" }: AuthFormProps) {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithEmail, signInWithGoogle } = useAuth();

  const isSignup = mode === "signup";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set to the destination email once a confirmation link has been sent.
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null
  );

  const disabled = loading || googleLoading;

  /** Run client-side validation; returns an error string or null. */
  const validate = (): string | null => {
    if (isSignup && fullName.trim().length === 0) {
      return "Please enter your full name.";
    }
    if (!isValidEmail(email.trim())) {
      return "Please enter a valid email address.";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmedEmail = email.trim();
    setLoading(true);

    try {
      if (isSignup) {
        const { session, error: signUpError } = await signUpWithEmail({
          email: trimmedEmail,
          password,
          fullName: fullName.trim(),
        });

        if (signUpError) {
          setError(getAuthErrorMessage(signUpError));
          return;
        }

        if (session) {
          // Email confirmation is disabled — we already have a session.
          navigate(redirectTo, { replace: true });
          return;
        }

        // No session => Supabase requires email confirmation. Show the panel.
        setConfirmationEmail(trimmedEmail);
        return;
      }

      // Login flow.
      const { error: signInError } = await signInWithEmail({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        setError(getAuthErrorMessage(signInError));
        return;
      }

      navigate(redirectTo, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    // signInWithGoogle triggers a full-page redirect to Google, so we generally
    // never return here on success. If it errors synchronously (misconfig,
    // popup blocked, etc.) we surface the message and re-enable the button.
    const { error: googleError } = await signInWithGoogle(redirectTo);
    if (googleError) {
      setError(getAuthErrorMessage(googleError));
      setGoogleLoading(false);
    }
    // Intentionally leave the spinner on if there was no error — the browser is
    // about to navigate away.
  };

  // -------------------------------------------------------------------------
  // Email-confirmation success panel (signup only).
  // -------------------------------------------------------------------------
  if (confirmationEmail) {
    return (
      <div className="space-y-4" role="status">
        <div className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-3 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="font-medium">Check your inbox</p>
            <p className="text-muted-foreground">
              We&apos;ve sent a confirmation link to{" "}
              <span className="font-medium text-foreground">
                {confirmationEmail}
              </span>
              . Click it to activate your account, then sign in.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            // Let the user go back and try a different email / resend.
            setConfirmationEmail(null);
            setPassword("");
          }}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main form.
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {isSignup ? (
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={disabled}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={
              isSignup ? "At least 6 characters" : "Enter your password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            disabled={disabled}
          />
        </div>

        <Button type="submit" className="w-full" disabled={disabled}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isSignup ? "Creating account…" : "Signing in…"}
            </>
          ) : isSignup ? (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Create account
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            or continue with
          </span>
        </div>
      </div>

      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={disabled}
      >
        {googleLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          <>
            <GoogleIcon className="mr-2" />
            Continue with Google
          </>
        )}
      </Button>
    </div>
  );
}

export default AuthForm;
