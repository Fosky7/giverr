// src/lib/__tests__/authErrors.test.ts
//
// Unit tests for the auth error-mapping helper. The helper is the single place
// that converts raw Supabase / GoTrue errors (or plain strings) into friendly
// user-facing copy, so these tests lock in the mapping contract that the
// AuthForm / ForgotPassword / ResetPassword UIs depend on.
//
// The module exports its mapper under two names across the codebase
// (`getAuthErrorMessage` and, historically, `mapAuthError`). We import the
// namespace and resolve whichever export exists so the tests stay green
// regardless of which alias the implementation ships.

import { describe, it, expect } from "vitest";

import * as authErrors from "@/lib/authErrors";

/**
 * Resolve the mapper function from the module regardless of whether it is
 * exported as `getAuthErrorMessage`, `mapAuthError`, or the default export.
 */
const mapError: (error: unknown) => string =
  (authErrors as Record<string, unknown>).getAuthErrorMessage as never ??
  (authErrors as Record<string, unknown>).mapAuthError as never ??
  (authErrors as Record<string, unknown>).default as never;

/** Build a minimal AuthError-like object. */
function err(message: string) {
  return { name: "AuthApiError", message } as unknown;
}

describe("authErrors mapper", () => {
  it("exports a callable mapper", () => {
    expect(typeof mapError).toBe("function");
  });

  it("maps invalid credentials to friendly copy", () => {
    const out = mapError(err("Invalid login credentials"));
    expect(out.toLowerCase()).toContain("incorrect");
    expect(out.toLowerCase()).toMatch(/email|password/);
  });

  it("maps unconfirmed email to a confirmation prompt", () => {
    const out = mapError(err("Email not confirmed"));
    expect(out.toLowerCase()).toContain("confirm");
  });

  it("maps already-registered users to a sign-in hint", () => {
    const out = mapError(err("User already registered"));
    expect(out.toLowerCase()).toContain("already exists");
  });

  it("maps weak-password errors", () => {
    const out = mapError(err("Password should be at least 6 characters"));
    expect(out.toLowerCase()).toMatch(/short|6 characters/);
  });

  it("maps rate-limit errors to a wait-and-retry message", () => {
    const out = mapError(err("For security purposes, you can only request this after 60 seconds"));
    expect(out.toLowerCase()).toMatch(/too many|wait/);
  });

  it("maps network / fetch failures", () => {
    const out = mapError(err("Failed to fetch"));
    expect(out.toLowerCase()).toMatch(/network|connection/);
  });

  it("maps expired / invalid links", () => {
    const out = mapError(err("Email link is invalid or has expired"));
    expect(out.toLowerCase()).toMatch(/invalid|expired/);
  });

  it("accepts a plain string error", () => {
    const out = mapError("Invalid login credentials");
    expect(out.toLowerCase()).toContain("incorrect");
  });

  it("returns a sensible fallback for null / undefined", () => {
    expect(typeof mapError(null)).toBe("string");
    expect(mapError(null).length).toBeGreaterThan(0);
    expect(typeof mapError(undefined)).toBe("string");
    expect(mapError(undefined).length).toBeGreaterThan(0);
  });

  it("passes through an unknown message unchanged", () => {
    const custom = "Some very specific backend error";
    expect(mapError(err(custom))).toBe(custom);
  });
});
