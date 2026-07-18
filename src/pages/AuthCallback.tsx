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
//   * If the provider returned `?error=...` we show that immediately.
//   * If no session materialises within TIMEOUT_MS, we show a generic error
//     with a link back to /login.

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { Button } from "@/components/ui/button";

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

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: number | undefined;

    const destination = safeDestination(searchParams.get("redirect"));

    // Providers surface failures as query (?error=...&error_description=...)
    // or, for implicit flows, in the URL hash fragment.
    const errorParam =
      searchParams.get("error_description") || searchParams.get("error");
    if (errorParam) {
      setError(getAuthErrorMessage(errorParam));
      return;
    }

    const finish = () => {
      if (!mounted) return;
      window.clearTimeout(timeoutId);
      navigate(destination, { replace: true });
    };

    // 1) Listen for the SIGNED_IN event fired after the SDK exchanges the code.
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
  }, [navigate, searchParams]);

  return (
    <section className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      {error ? (
        <div className="mx-auto flex max-w-md flex-col items-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </span>
          <h1 className="mt-6 text-xl font-semibold text-foreground">
            Sign-in failed
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>
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
