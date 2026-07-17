// src/hooks/__tests__/useAuth.test.ts
//
// Unit tests for the useAuth hook's method wrappers. We mock the shared
// Supabase client (@/integrations/supabase/client) so we can assert that each
// wrapper calls the correct supabase.auth.* method with the expected arguments
// (email/password, OAuth provider + redirectTo, emailRedirectTo, reset redirect,
// etc.) and returns the normalized result shape the UI relies on.
//
// These are pure logic tests — no real network, no real Supabase project.

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock the Supabase client BEFORE importing the hook.
// ---------------------------------------------------------------------------
const signUp = vi.fn();
const signInWithPassword = vi.fn();
const signInWithOAuth = vi.fn();
const resetPasswordForEmail = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn();
const getSession = vi.fn();
const onAuthStateChange = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => signUp(...args),
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      signInWithOAuth: (...args: unknown[]) => signInWithOAuth(...args),
      resetPasswordForEmail: (...args: unknown[]) =>
        resetPasswordForEmail(...args),
      updateUser: (...args: unknown[]) => updateUser(...args),
      signOut: (...args: unknown[]) => signOut(...args),
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
    },
  },
  default: {},
}));

// Import AFTER the mock is registered.
import { useAuth } from "@/hooks/useAuth";

const ORIGIN = "https://app.example.com";

beforeEach(() => {
  vi.clearAllMocks();

  // Default happy-path resolutions.
  getSession.mockResolvedValue({ data: { session: null }, error: null });
  onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  signUp.mockResolvedValue({
    data: { session: null, user: { id: "u1" } },
    error: null,
  });
  signInWithPassword.mockResolvedValue({ data: {}, error: null });
  signInWithOAuth.mockResolvedValue({ data: {}, error: null });
  resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  updateUser.mockResolvedValue({ data: {}, error: null });
  signOut.mockResolvedValue({ error: null });

  // Deterministic origin for redirect-URL assertions.
  Object.defineProperty(window, "location", {
    value: { origin: ORIGIN, href: `${ORIGIN}/login` },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAuth", () => {
  it("initializes by reading the current session and subscribing to changes", async () => {
    renderHook(() => useAuth());
    await waitFor(() => {
      expect(onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe("signUpWithEmail", () => {
    it("passes email, password, full_name metadata and an emailRedirectTo", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUpWithEmail({
          email: "jane@example.com",
          password: "hunter2!",
          fullName: "Jane Doe",
        });
      });

      expect(signUp).toHaveBeenCalledTimes(1);
      const arg = signUp.mock.calls[0][0];
      expect(arg.email).toBe("jane@example.com");
      expect(arg.password).toBe("hunter2!");
      expect(arg.options.data.full_name).toBe("Jane Doe");
      expect(String(arg.options.emailRedirectTo)).toContain(ORIGIN);
    });

    it("returns session=null when email confirmation is required", async () => {
      signUp.mockResolvedValue({
        data: { session: null, user: { id: "u1" } },
        error: null,
      });
      const { result } = renderHook(() => useAuth());

      let out: Awaited<ReturnType<typeof result.current.signUpWithEmail>>;
      await act(async () => {
        out = await result.current.signUpWithEmail({
          email: "jane@example.com",
          password: "hunter2!",
          fullName: "Jane Doe",
        });
      });

      expect(out!.session).toBeNull();
      expect(out!.error).toBeNull();
    });

    it("returns a session when confirmation is disabled", async () => {
      signUp.mockResolvedValue({
        data: { session: { access_token: "tok" }, user: { id: "u1" } },
        error: null,
      });
      const { result } = renderHook(() => useAuth());

      let out: Awaited<ReturnType<typeof result.current.signUpWithEmail>>;
      await act(async () => {
        out = await result.current.signUpWithEmail({
          email: "jane@example.com",
          password: "hunter2!",
          fullName: "Jane Doe",
        });
      });

      expect(out!.session).not.toBeNull();
    });

    it("surfaces sign-up errors", async () => {
      const authError = { name: "AuthApiError", message: "User already registered" };
      signUp.mockResolvedValue({ data: { session: null, user: null }, error: authError });
      const { result } = renderHook(() => useAuth());

      let out: Awaited<ReturnType<typeof result.current.signUpWithEmail>>;
      await act(async () => {
        out = await result.current.signUpWithEmail({
          email: "dupe@example.com",
          password: "hunter2!",
          fullName: "Dupe",
        });
      });

      expect(out!.error).toBeTruthy();
    });
  });

  describe("signInWithEmail", () => {
    it("calls signInWithPassword with the credentials", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signInWithEmail({
          email: "jane@example.com",
          password: "hunter2!",
        });
      });

      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "jane@example.com",
        password: "hunter2!",
      });
    });

    it("returns the error on wrong password", async () => {
      const authError = { name: "AuthApiError", message: "Invalid login credentials" };
      signInWithPassword.mockResolvedValue({ data: {}, error: authError });
      const { result } = renderHook(() => useAuth());

      let out: Awaited<ReturnType<typeof result.current.signInWithEmail>>;
      await act(async () => {
        out = await result.current.signInWithEmail({
          email: "jane@example.com",
          password: "wrong",
        });
      });

      expect(out!.error).toBeTruthy();
    });
  });

  describe("signInWithGoogle", () => {
    it("starts an OAuth flow targeting the /auth/callback route", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signInWithGoogle("/dashboard");
      });

      expect(signInWithOAuth).toHaveBeenCalledTimes(1);
      const arg = signInWithOAuth.mock.calls[0][0];
      expect(arg.provider).toBe("google");
      expect(String(arg.options.redirectTo)).toContain("/auth/callback");
      expect(String(arg.options.redirectTo)).toContain(ORIGIN);
    });

    it("encodes the post-login destination into the callback URL", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signInWithGoogle("/settings");
      });

      const arg = signInWithOAuth.mock.calls[0][0];
      expect(String(arg.options.redirectTo)).toContain(
        encodeURIComponent("/settings")
      );
    });
  });

  describe("sendPasswordReset", () => {
    it("emails a recovery link pointing at /reset-password", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.sendPasswordReset("jane@example.com");
      });

      expect(resetPasswordForEmail).toHaveBeenCalledTimes(1);
      const [emailArg, optsArg] = resetPasswordForEmail.mock.calls[0];
      expect(emailArg).toBe("jane@example.com");
      expect(String(optsArg.redirectTo)).toContain("/reset-password");
    });

    it("normalizes the error to a string | null", async () => {
      resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: "rate limit" },
      });
      const { result } = renderHook(() => useAuth());

      let out: Awaited<ReturnType<typeof result.current.sendPasswordReset>>;
      await act(async () => {
        out = await result.current.sendPasswordReset("jane@example.com");
      });

      expect(typeof out!.error).toBe("string");
    });
  });

  describe("updatePassword", () => {
    it("calls updateUser with the new password", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.updatePassword("newSecret1");
      });

      expect(updateUser).toHaveBeenCalledWith({ password: "newSecret1" });
    });

    it("returns null error on success", async () => {
      const { result } = renderHook(() => useAuth());

      let out: Awaited<ReturnType<typeof result.current.updatePassword>>;
      await act(async () => {
        out = await result.current.updatePassword("newSecret1");
      });

      expect(out!.error).toBeNull();
    });
  });

  describe("signOut", () => {
    it("calls supabase.auth.signOut", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });
});
