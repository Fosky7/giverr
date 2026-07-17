// src/components/feedback/RetryState.tsx
//
// Single source of truth for the "Try again" error surface. Renders a
// consistent error card (destructive-tinted icon badge, headline, description,
// primary retry button, and an optional secondary action) using only the
// project's design tokens — no hardcoded colors.
//
// Used by Explore (fetch failure), AuthCallback (session timeout), and Contact
// (submit failure) so every retry affordance looks and behaves identically.

import type { ReactNode } from "react";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RetryStateProps {
  /** Short headline describing what failed. */
  title: string;
  /** Longer description — usually the normalized error message. */
  description?: string | null;
  /** Invoked when the user clicks "Try again". */
  onRetry: () => void;
  /** When true, the retry button shows a spinner and is disabled. */
  retrying?: boolean;
  /** Optional secondary action (e.g. a "Back to Login" link). */
  secondaryAction?: ReactNode;
  /** Label override for the primary button. */
  retryLabel?: string;
  /** Extra classes for the outer wrapper. */
  className?: string;
}

/**
 * Presentational error/retry card. Contains no data-fetching logic; the caller
 * owns the async lifecycle (typically via useRetryableAsync) and passes
 * `onRetry` + `retrying`.
 */
export function RetryState({
  title,
  description,
  onRetry,
  retrying = false,
  secondaryAction,
  retryLabel = "Try again",
  className,
}: RetryStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "mx-auto flex max-w-md flex-col items-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center",
        className
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </span>

      <h2 className="mt-5 text-lg font-semibold text-foreground">{title}</h2>

      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
        <Button onClick={onRetry} disabled={retrying}>
          {retrying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Retrying…
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              {retryLabel}
            </>
          )}
        </Button>

        {secondaryAction}
      </div>
    </div>
  );
}

export default RetryState;
