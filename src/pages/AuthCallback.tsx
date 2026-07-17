// src/pages/AuthCallback.tsx
//
// OAuth / redirect finalization page. This is the exact `redirectTo` target
// passed to supabase.auth.signInWithOAuth in useAuth.signInWithGoogle:
//   `${window.location.origin}/auth/callback?redirect=<destination>`
//
// The Supabase client is configured with detectSessionInUrl, so it exchanges
// the auth code / token found in the URL for a session automatically once the
// client boots. We simply wait for that session to appear (either via
// onAuthStateChange or getSession), then navigate to the intended destination.
//
// Failure handling:
//   * If the provider returned `?error=...` we show that immediately as a
//     TERMINAL error — only a "Back to Login" link, no session-recheck retry
//     (retrying can't recover a provider-rejected sign-in).
//   * If no session materialises within TIMEOUT_MS, we surface a recoverable
//     <RetryState> whose "Try again" re-checks the session and restarts the
//     timeout window, while still offering "Back to Login" as the secondary
//     action.
//
// Security: the retry path continues to route ONLY through safeDestination(),
// so a malicious ?redirect= param can never be abused after a retry.

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { Button } from "@/components/ui/button";
import { RetryState } from "@/components/feedback/RetryState";

// How long to wait for a session to appear before declaring failure.
const TIMEOUT_MS = 10000;
const DEFAULT_DESTINATION = "/dashboard";

/**
 * Sanitise the `redirect` query param so it can only be an in-app path (guards
 * against open-redirect abuse via absolute URLs / protocol-relative links).
 */
function safeDestination(raw: string | null): string {
  if (!raw) return DEFAULT_DESTINATION;
  if (!raw.startsWith("/") || raw.startsWith("//")) return DEFAULT_DESTINATION;
  return raw;
}

// Terminal errors come from the provider (?error=). Timeout errors are
// recoverable via a session recheck. We track which kind we're in.
type ErrorKind = "terminal" | "recoverable";

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind>("recoverable");
  // Bumping this re-runs the finalization effect (used by "Try again").
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    // Clear the failed state and re-run the whole finalization flow, which
    // re-checks the session and restarts a fresh timeout window.
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    let timeoutId: number | undefined;

    const destination = safeDestination(searchParams.get("redirect"));

    // Providers surface failures as query (?error=...&error_description=...)
    // or, for implicit flows, in the URL hash fragment. This is terminal —
    // a session recheck cannot recover it, so we offer only Back to Login.
    const errorParam =
      searchParams.get("error_description") || searchParams.get("error");
    if (errorParam) {
      setErrorKind("terminal");
      setError(getAuthErrorMessage(errorParam));
      return;
    }

    const finish = () => {
      if (!mounted) return;
      window.clearTimeout(timeoutId);
      // Always route through the sanitised destination — even after a retry.
      navigate(destination, { replace: true });
    };

    // 1) Listen for the SIGNED_IN event fired after the SDK exchanges the code.
    //    This subscription stays active during the retry window, so a session
    //    that arrives late still cancels the pending timeout and finishes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish();
    });

    // 2) Also check for an already-established session (the exchange may have
    //    completed before this listener attached).
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setErrorKind("recoverable");
        setError(getAuthErrorMessage(sessionError));
        return;
      }
      if (data.session) finish();
    });

    // 3) Give up after the timeout.
    timeoutId = window.setTimeout(() => {
      if (!mounted) return;
      // One final check before failing, in case the event was missed.
      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return;
        if (data.session) {
          finish();
        } else {
          setErrorKind("recoverable");
          setError(
            "We couldn't complete sign-in. The link may have expired — please try again."
          );
        }
      });
    }, TIMEOUT_MS);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
    // `attempt` is included so "Try again" re-runs the entire flow (fresh
    // subscription + timeout window).
  }, [navigate, searchParams, attempt]);

  const backToLogin = (
    <Button asChild variant="outline">
      <Link to="/login">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Login
      </Link>
    </Button>
  );

  return (
    <section className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      {error ? (
        errorKind === "terminal" ? (
          // Terminal provider error — no retry, only a link back to login.
          <div className="mx-auto flex max-w-md flex-col items-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-8 w-8" />
            </span>
            <h1 className="mt-6 text-xl font-semibold text-foreground">
              Sign-in failed
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <div className="mt-6">{backToLogin}</div>
          </div>
        ) : (
          // Recoverable timeout/session error — offer an in-place retry.
          <RetryState
            title="Sign-in didn't complete"
            description={error}
            onRetry={retry}
            retryLabel="Try again"
            secondaryAction={backToLogin}
          />
        )
      ) : (
        <div className="flex flex-col items-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm">Finalizing your sign-in…</p>
        </div>
      )}
    </section>
  );
}

export default AuthCallback;
