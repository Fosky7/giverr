// src/hooks/useRetryableAsync.ts
//
// Generic hook that wraps an async operation and centralizes the
// loading / ready / error / retry pattern duplicated across pages such as
// Explore.tsx and AuthCallback.tsx.
//
// It exposes:
//   { data, status, error, run, retry, reset }
//
// Design notes / edge cases handled:
//   * Unmount safety   — a mounted ref guards every setState so we never warn
//                        about "setState after unmount" when a fetch resolves
//                        after the component has gone away.
//   * Overlapping runs — retry()/run() are ignored while a run is already in
//                        flight (status === 'loading') so rapid double-clicks
//                        on a "Try again" button can't stack requests.
//   * Forced re-exec   — an internal attempt counter bumps on retry(); callers
//                        that memoize their operation on `attempt` will re-run
//                        the exact same fetch.
//   * State replacement— resolved data REPLACES prior data (never appended) so
//                        retrying a list fetch cannot duplicate rows.

import { useCallback, useEffect, useRef, useState } from "react";

export type RetryableStatus = "idle" | "loading" | "ready" | "error";

export interface UseRetryableAsyncResult<T> {
  /** Latest successfully resolved value, or null before the first success. */
  data: T | null;
  /** Current lifecycle status of the wrapped operation. */
  status: RetryableStatus;
  /** Normalized error message when status === 'error', otherwise null. */
  error: string | null;
  /** Monotonic attempt counter; increments on every run()/retry() invocation. */
  attempt: number;
  /** Kick off the operation (no-op while a run is already in flight). */
  run: () => void;
  /** Re-run the operation (alias of run with clearer intent for retry UIs). */
  retry: () => void;
  /** Reset back to the idle state, clearing data and error. */
  reset: () => void;
}

/** Normalize an unknown thrown value into a user-facing message. */
function toMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}

export interface UseRetryableAsyncOptions {
  /** Run the operation immediately on mount. Defaults to false. */
  immediate?: boolean;
  /** Fallback message used when a thrown value has no readable message. */
  fallbackError?: string;
}

/**
 * Wrap an async operation, exposing loading/error/retry state.
 *
 * @param operation An async function returning the resolved value. It should be
 *                  stable (wrapped in useCallback) so the effect deps behave.
 */
export function useRetryableAsync<T>(
  operation: () => Promise<T>,
  options: UseRetryableAsyncOptions = {}
): UseRetryableAsyncResult<T> {
  const {
    immediate = false,
    fallbackError = "Something went wrong. Please try again.",
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<RetryableStatus>(
    immediate ? "loading" : "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  // Keep the latest operation without forcing the callbacks to change identity.
  const operationRef = useRef(operation);
  operationRef.current = operation;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    // Guard against overlapping runs (e.g. rapid "Try again" clicks).
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (mountedRef.current) {
      setStatus("loading");
      setError(null);
    }

    try {
      const result = await operationRef.current();
      if (!mountedRef.current) return;
      // Replace state — never append — to avoid duplicate list rows on retry.
      setData(result);
      setStatus("ready");
    } catch (err) {
      if (!mountedRef.current) return;
      setError(toMessage(err, fallbackError));
      setStatus("error");
    } finally {
      inFlightRef.current = false;
    }
  }, [fallbackError]);

  const run = useCallback(() => {
    if (inFlightRef.current) return;
    setAttempt((a) => a + 1);
    void execute();
  }, [execute]);

  const retry = run;

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setData(null);
    setError(null);
    setStatus("idle");
  }, []);

  // Optional auto-run on mount.
  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, status, error, attempt, run, retry, reset };
}

export default useRetryableAsync;
