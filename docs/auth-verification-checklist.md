# Auth Verification Checklist & E2E Outline

This document is the manual + automated verification plan for the email and
Google authentication flows (build step 8 of 6). Run through it after any change
to `useAuth`, `AuthForm`, `AuthCallback`, the Supabase client, or the auth
migration, and before every deploy.

> Prerequisite: complete the Supabase dashboard configuration in
> [`docs/auth-setup.md`](./auth-setup.md) (Site URL, Redirect URL allow-list,
> Email + Google providers). Redirects in code (`/auth/callback`, `/dashboard`,
> `/reset-password`) **must** be present in the allow-list or Supabase rejects
> them.

---

## 1. Automated unit tests

Run the Vitest suite. It covers the pure logic that would otherwise be tedious
to verify by hand.

```bash
npm run test
# or
npx vitest run
```

| Test file | What it proves |
| --- | --- |
| `src/lib/__tests__/authErrors.test.ts` | Raw Supabase errors → friendly copy (invalid creds, unconfirmed email, already-registered, weak password, rate limit, network, expired link, fallback). |
| `src/hooks/__tests__/useAuth.test.ts` | Each `useAuth` wrapper calls the right `supabase.auth.*` method with the right args (email/password, `emailRedirectTo`, Google OAuth → `/auth/callback`, reset → `/reset-password`, `updateUser`, `signOut`) and returns the normalized result shape. |

**Type / build safety** — run a full build to catch missing-export or type
errors (per the open TODOs):

```bash
npm run build
```

Expected: build completes with **no** "has no exported member" or
"Cannot find module" errors. In particular confirm:

- `@/hooks/useAuth` exports `useAuth` (and the method names the tests call).
- `@/lib/authErrors` exports the mapper (`getAuthErrorMessage` / `mapAuthError`).
- `@/pages/AuthCallback` and `@/components/auth/AuthForm` resolve.
- No route references the dead stub pages (`LoginPage`, `SignupPage`,
  `ResetPasswordPage`, `ForgotPasswordPage`, `Profile`).

---

## 2. Manual E2E checklist

Test against a **preview/deployed** origin (OAuth + email links don't work from
a raw file:// or mismatched origin). Use a real inbox you control.

### A. Email signup — confirmation ON

> Supabase → Authentication → Providers → Email → **Confirm email = ON**

1. Go to `/signup`, enter name, a **fresh** email, password ≥ 6 chars.
2. Submit.
3. ✅ The form shows the **"Check your inbox"** confirmation panel (no redirect,
   no error, no infinite spinner).
4. Open the email → click the confirmation link.
5. ✅ Link lands back in the app; the session is established (header shows the
   signed-in state) and you end up on `/dashboard`.
6. ✅ A `profiles` row exists for the new user (see §3).

### B. Email signup — confirmation OFF

> Supabase → Email → **Confirm email = OFF**

1. `/signup` with a fresh email → submit.
2. ✅ You are redirected immediately to `redirectTo` (`/dashboard`) with an
   active session (no confirmation panel).
3. ✅ `profiles` row created.

### C. Email login — success

1. `/login` with a confirmed account's correct credentials → submit.
2. ✅ Redirected to `/dashboard`; header reflects the signed-in user.

### D. Email login — wrong password

1. `/login` with a valid email but wrong password → submit.
2. ✅ Inline alert: **"Incorrect email or password."** (mapped, not a raw error).
3. ✅ No navigation; inputs re-enabled.

### E. Login on unconfirmed email

1. Create an account with confirmation ON but **do not** click the link.
2. `/login` with those credentials.
3. ✅ Inline alert prompting to **confirm the email first**.

### F. Google signup — brand-new user

1. `/signup` (or `/login`) → **Continue with Google**.
2. ✅ Button shows a spinner, then the browser redirects to Google.
3. Choose a Google account never used with this app.
4. ✅ Redirects back to `/auth/callback` → shows "Finalizing your sign-in…" →
   forwards to `/dashboard` (or the `redirect` param).
5. ✅ A `profiles` row is auto-created via the `handle_new_user` trigger, with
   `full_name` / `avatar_url` populated from Google metadata (see §3).

### G. Google login — existing user

1. Sign out, then **Continue with Google** with the same Google account.
2. ✅ Redirects through `/auth/callback` to `/dashboard` — **no duplicate**
   `profiles` row (trigger is `ON CONFLICT DO NOTHING`).

### H. Forgot / reset password round-trip

1. `/forgot-password` → enter the account email → submit.
2. ✅ Success panel shown (does not reveal whether the account exists).
3. Open email → click the reset link.
4. ✅ Lands on `/reset-password`, which detects the recovery session and enables
   the form (not stuck on "Verifying…", not "invalid link").
5. Enter a new password twice → submit.
6. ✅ Success message → redirect to `/login`.
7. ✅ Log in with the **new** password succeeds; the old one fails.

### I. Sign-out clears session

1. While signed in, trigger sign-out (header menu).
2. ✅ Session cleared; header shows signed-out state.
3. Visit a protected route (e.g. `/dashboard`).
4. ✅ Redirected to `/login` (with the attempted path preserved as `redirect`).
5. Reload the page.
6. ✅ Still signed out (persisted session actually removed).

### J. Redirect preservation (ProtectedRoute)

1. While signed out, open `/settings` directly.
2. ✅ Redirected to `/login?redirect=%2Fsettings` (or equivalent).
3. Sign in (email or Google).
4. ✅ Returned to `/settings`, not the default `/dashboard`.

### K. OAuth error handling

1. Simulate a failed/cancelled Google flow (close the consent screen) or hit
   `/auth/callback?error=access_denied&error_description=User+cancelled`.
2. ✅ `AuthCallback` shows the **"Sign-in failed"** panel with a link back to
   `/login` (does not spin forever).

---

## 3. Verifying the `profiles` row

In the Supabase SQL editor (or via the client while signed in):

```sql
select id, full_name, avatar_url, created_at
from public.profiles
order by created_at desc
limit 10;
```

- ✅ Exactly one row per auth user (email **or** Google).
- ✅ `full_name` populated from signup metadata / Google name.
- ✅ RLS: a signed-in user can `select`/`update` only their own row (attempting
  to update another id fails).

---

## 4. Sign-off

| Scenario | Pass |
| --- | --- |
| A. Email signup (confirm ON) | ☐ |
| B. Email signup (confirm OFF) | ☐ |
| C. Email login success | ☐ |
| D. Email login wrong password | ☐ |
| E. Unconfirmed-email login error | ☐ |
| F. Google signup (new user + profile row) | ☐ |
| G. Google login (existing user, no dup) | ☐ |
| H. Forgot/reset round-trip | ☐ |
| I. Sign-out clears session | ☐ |
| J. Redirect preservation | ☐ |
| K. OAuth error handling | ☐ |
| Unit tests green (`vitest run`) | ☐ |
| Full build clean (`npm run build`) | ☐ |

When every box is checked, the email + Google sign up / sign in flows are
verified.
