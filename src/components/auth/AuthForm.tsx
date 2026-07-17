import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Loader2, LogIn, UserPlus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

export type AuthMode = "login" | "signup";

interface AuthFormProps {
  /** Determines which fields render and which Supabase action is called. */
  mode: AuthMode;
  /** Path to navigate to after a successful login. Defaults to /dashboard. */
  redirectTo?: string;
}

/**
 * Build the zod schema for the active mode. `full_name` is only required for
 * signup; login omits it entirely so validation stays tight per mode.
 */
function buildSchema(mode: AuthMode) {
  const base = {
    email: z.string().trim().email("Please enter a valid email address."),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long."),
  };

  if (mode === "signup") {
    return z.object({
      ...base,
      full_name: z
        .string()
        .trim()
        .min(2, "Please enter your full name."),
    });
  }

  return z.object(base);
}

type LoginValues = { email: string; password: string };
type SignupValues = LoginValues & { full_name: string };
type AuthValues = SignupValues;

/**
 * Reusable authentication form supporting both login and signup modes.
 * Handles validation (react-hook-form + zod), inline error/success alerts,
 * a loading submit button, and social OAuth buttons. On signup success it
 * shows the email-confirmation message; on login success it redirects.
 */
export function AuthForm({ mode, redirectTo = "/dashboard" }: AuthFormProps) {
  const navigate = useNavigate();
  const isSignup = mode === "signup";

  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const schema = useMemo(() => buildSchema(mode), [mode]);

  const form = useForm<AuthValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
    },
    mode: "onSubmit",
  });

  const { isSubmitting } = form.formState;

  const handleSubmit = async (values: AuthValues) => {
    setFormError(null);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectTo}`,
            data: {
              // Stored in user metadata; the profiles trigger reads full_name.
              full_name: values.full_name?.trim() ?? "",
            },
          },
        });

        if (error) {
          setFormError(error.message);
          return;
        }

        // If a session came back immediately (email confirmation disabled),
        // redirect straight away; otherwise prompt for email confirmation.
        if (data.session) {
          navigate(redirectTo);
        } else {
          setConfirmationSent(true);
        }
        return;
      }

      // Login mode.
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      navigate(redirectTo);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  };

  // Post-signup confirmation state replaces the form entirely.
  if (confirmationSent) {
    const email = form.getValues("email");
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-3 text-sm text-foreground"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <span>
            Almost there! We&apos;ve sent a confirmation link to{" "}
            <span className="font-medium">{email}</span>. Please check your
            inbox to activate your account.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-4">
          {formError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          ) : null}

          {isSignup ? (
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ada Lovelace"
                      autoComplete="name"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={isSignup ? "At least 6 characters" : "••••••••"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignup ? "Creating account…" : "Signing in…"}
              </>
            ) : isSignup ? (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </form>
      </Form>

      <SocialAuthButtons
        redirectTo={redirectTo}
        disabled={isSubmitting}
        onError={(message) => setFormError(message || null)}
      />
    </div>
  );
}

export default AuthForm;
