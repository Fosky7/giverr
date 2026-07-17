import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  ArrowLeft,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

type RecoveryStatus = "checking" | "ready" | "invalid";

const MIN_PASSWORD_LENGTH = 6;

/**
 * Reset-password page. Reached via the recovery link emailed to the user by
 * {@link ForgotPassword}. Supabase parses the recovery token from the URL
 * fragment and establishes a temporary recovery session, emitting a
 * `PASSWORD_RECOVERY` auth event. We wait for either that event or an existing
 * session before enabling the form. Submitting calls useAuth.updatePassword
 * and, on success, redirects to the login page.
 *
 * Both password fields use {@link PasswordInput} so users can toggle
 * visibility, matching the show/hide behavior on the login/signup forms.
 */
export function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [status, setStatus] = useState<RecoveryStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Listen for the PASSWORD_RECOVERY event fired when Supabase consumes the
    // recovery token from the URL fragment.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setStatus("ready");
      }
    });

    // Also check for an already-established session (e.g. the event fired
    // before this listener attached).
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setStatus("ready");
      } else {
        // Give the SDK a brief window to process the URL hash before deciding
        // the link is invalid/expired.
        window.setTimeout(() => {
          if (mounted) {
            setStatus((prev) => (prev === "checking" ? "invalid" : prev));
          }
        }, 2500);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSuccess(true);
    // Redirect to login after a short confirmation delay.
    window.setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <section className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      <div className="mb-8">
        <PageHeader
          centered
          eyebrow="Account recovery"
          title="Set a new password"
          description="Choose a strong password to secure your Rayze account."
        />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Enter and confirm your new password below.
          </CardDescription>
        </CardHeader>

        {status === "checking" ? (
          <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Verifying your reset link…</span>
          </CardContent>
        ) : status === "invalid" ? (
          <CardContent className="space-y-4">
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This reset link is invalid or has expired. Please request a new
                one.
              </span>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/forgot-password">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Request a new link
              </Link>
            </Button>
          </CardContent>
        ) : success ? (
          <CardContent className="space-y-4">
            <div
              role="status"
              className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-3 text-sm text-foreground"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>
                Your password has been updated. Redirecting you to the login
                page…
              </span>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  disabled={loading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating password…
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link
                  to="/login"
                  className="font-medium text-primary transition-colors hover:underline"
                >
                  Back to Login
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </section>
  );
}

export default ResetPassword;
