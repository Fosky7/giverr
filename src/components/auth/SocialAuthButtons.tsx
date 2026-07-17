import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface SocialAuthButtonsProps {
  /** Where to send the user after the OAuth round-trip completes. */
  redirectTo?: string;
  /** Disables the buttons while a parent form is submitting. */
  disabled?: boolean;
  /** Bubbles OAuth initiation errors up to the parent for display. */
  onError?: (message: string) => void;
}

/**
 * Simple inline brand glyphs so we avoid pulling extra icon dependencies.
 * Kept as small presentational components for readability.
 */
function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"
      />
    </svg>
  );
}

/**
 * Renders Google and Facebook OAuth buttons wired to Supabase
 * `signInWithOAuth`. On click the browser is redirected to the provider; the
 * loading state is shown until the redirect happens (or an error is caught).
 */
export function SocialAuthButtons({
  redirectTo = "/dashboard",
  disabled = false,
  onError,
}: SocialAuthButtonsProps) {
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);

  const handleOAuth = async (provider: Provider) => {
    setPendingProvider(provider);
    onError?.("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // Return the user to the app; Supabase appends the auth callback.
          redirectTo: `${window.location.origin}${redirectTo}`,
        },
      });

      if (error) {
        onError?.(error.message);
        setPendingProvider(null);
      }
      // On success the browser navigates away, so no further state needed.
    } catch (err) {
      onError?.(
        err instanceof Error
          ? err.message
          : "Unable to start social sign-in. Please try again."
      );
      setPendingProvider(null);
    }
  };

  const isBusy = disabled || pendingProvider !== null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth("google")}
          disabled={isBusy}
        >
          {pendingProvider === "google" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <span className="mr-2">
              <GoogleIcon />
            </span>
          )}
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth("facebook")}
          disabled={isBusy}
        >
          {pendingProvider === "facebook" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <span className="mr-2">
              <FacebookIcon />
            </span>
          )}
          Facebook
        </Button>
      </div>
    </div>
  );
}

export default SocialAuthButtons;
