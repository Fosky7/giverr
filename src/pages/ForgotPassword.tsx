import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, Mail, ArrowLeft } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Forgot-password page. Collects an email address and asks Supabase to send a
 * recovery link (via useAuth.sendPasswordReset). The redirect target for the
 * emailed link is `${origin}/reset-password`, which is handled by
 * {@link ResetPassword}. On success we show a confirmation message rather than
 * revealing whether the email exists (avoids account enumeration).
 */
export function ForgotPassword() {
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await sendPasswordReset(trimmed);
    setLoading(false);

    if (resetError) {
      setError(resetError);
      return;
    }

    setSent(true);
  };

  return (
    <section className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      <div className="mb-8">
        <PageHeader
          centered
          eyebrow="Account recovery"
          title="Reset your password"
          description="Enter the email associated with your account and we'll send you a link to reset your password."
        />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            We'll email you a secure link to set a new password.
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="space-y-4">
            <div
              role="status"
              className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-3 text-sm text-foreground"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>
                If an account exists for{" "}
                <span className="font-medium">{email.trim()}</span>, you'll
                receive an email with a link to reset your password shortly.
              </span>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Remembered your password?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary transition-colors hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </section>
  );
}

export default ForgotPassword;
