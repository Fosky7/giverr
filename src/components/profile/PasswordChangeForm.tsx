// src/components/profile/PasswordChangeForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/** Validation schema: new password + confirmation must match and be >= 6. */
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

/**
 * Standalone password change form. Calls `useAuth().updatePassword` which wraps
 * `supabase.auth.updateUser`. Shows inline success/error feedback and resets on
 * success.
 */
export function PasswordChangeForm() {
  const { updatePassword } = useAuth();

  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { isSubmitting } = form.formState;

  const handleSubmit = async (values: PasswordFormValues) => {
    setFormError(null);
    setSuccess(false);

    const { error } = await updatePassword(values.password);
    if (error) {
      setFormError(error);
      return;
    }

    setSuccess(true);
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Choose a strong password you don&apos;t use elsewhere.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
            className="space-y-4"
          >
            {formError ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            ) : null}

            {success ? (
              <div
                role="status"
                className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-foreground"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Your password has been updated.</span>
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Update password
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default PasswordChangeForm;
