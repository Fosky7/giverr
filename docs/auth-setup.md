# Supabase Auth Setup — Email + Google

This document covers the **dashboard-side** configuration required to make the
email and Google authentication flows work. These settings live in the Supabase
project dashboard (and Google Cloud Console) and **cannot** be set in code. The
application code (`useAuth` / `AuthContext`, `AuthForm`, `AuthCallback`, the
`profiles` trigger migration) is already in place; without the settings below,
the redirects and confirmation links will fail at runtime.

> **Rule of thumb:** every `emailRedirectTo` / `redirectTo` value used in code
> **must** appear in the Supabase **Redirect URLs** allow-list, or Supabase will
> reject the redirect with a `redirect_to is not allowed` error.

---

## 0. Where these values come from in code

The app computes redirect targets from `window.location.origin` at runtime
(see `src/context/AuthContext.tsx` and `src/hooks/useAuth.ts`):

| Flow                     | Code location                     | Redirect target                          |
| ------------------------ | --------------------------------- | ---------------------------------------- |
| Email sign-up            | `signUpWithEmail`                 | `${origin}/dashboard` or `${origin}/auth/callback` |
| Google OAuth             | `signInWithGoogle`                | `${origin}/auth/callback?redirect=...`   |
| Password reset email     | `sendPasswordReset`               | `${origin}/reset-password`               |

`${origin}` is your deployed URL in production (e.g. `https://app.rayze.com`)
and `http://localhost:5173` (or your dev port) locally. **Both** must be
allow-listed.

---

## 1. Site URL

Dashboard → **Authentication → URL Configuration → Site URL**

Set this to your primary deployed origin, with **no trailing slash**:

```
https://your-deployed-domain.com
```

The Site URL is the default fallback Supabase uses when a redirect target is
omitted, and it anchors email templates.

---

## 2. Redirect URLs (allow-list)

Dashboard → **Authentication → URL Configuration → Redirect URLs**

Add **every** origin + path the code redirects to. Add production **and** local
dev variants:

```
# Production
https://your-deployed-domain.com/auth/callback
https://your-deployed-domain.com/dashboard
https://your-deployed-domain.com/reset-password

# Local development (adjust the port to match your dev server)
http://localhost:5173/auth/callback
http://localhost:5173/dashboard
http://localhost:5173/reset-password
```

**Gotchas**

- Match the scheme (`http` vs `https`), host, port, and path **exactly**.
- Do **not** add a trailing slash unless the code produces one (it does not).
- If you use preview deployments with dynamic URLs, add each preview origin (or
  a wildcard entry if your plan supports it, e.g.
  `https://*.vercel.app/auth/callback`).

---

## 3. Email provider

Dashboard → **Authentication → Providers → Email** → enable.

### The "Confirm email" toggle — decide deliberately

Dashboard → **Authentication → Providers → Email → Confirm email**

| Setting            | Behaviour of `supabase.auth.signUp`                                                                 | UI impact                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Confirm email ON**  | Returns a user but **no session**. User must click the emailed confirmation link.                | `AuthForm` shows the **"Check your inbox"** confirmation panel (this is required — keep it).     |
| **Confirm email OFF** | Returns a **session immediately** on sign-up.                                                     | `AuthForm` redirects straight to `redirectTo` (`/dashboard`). No confirmation panel is shown.    |

The app supports **both** modes automatically — it checks whether a session was
returned. Choose based on your product needs:

- **ON (recommended for production):** verifies email ownership, reduces spam
  signups. Requires SMTP to be configured (see step 5).
- **OFF (convenient for early dev/testing):** users are logged in instantly.

The confirmation link sent when Confirm email is ON redirects to the
`emailRedirectTo` value from code, so that path **must** be in the allow-list
(step 2).

---

## 4. Google provider

### 4a. Create OAuth credentials in Google Cloud Console

1. Go to <https://console.cloud.google.com/apis/credentials>.
2. Create (or select) a project.
3. Configure the **OAuth consent screen** (External), add your app name,
   support email, and authorized domains.
4. **Create Credentials → OAuth client ID → Web application**.
5. Under **Authorized redirect URIs**, add your Supabase auth callback:

   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

   > This is the **Supabase** callback (find the exact value in the Supabase
   > Google provider settings). It is **not** your app's `/auth/callback` — the
   > app route is where Supabase sends the user *after* it processes Google's
   > response.

6. Copy the generated **Client ID** and **Client Secret**.

### 4b. Enable Google in Supabase

Dashboard → **Authentication → Providers → Google** → enable, then paste:

- **Client ID** — from step 4a
- **Client Secret** — from step 4a

Save. Because the client uses PKCE and redirects to `${origin}/auth/callback`,
no client secret is ever exposed to the browser.

---

## 5. SMTP / email delivery (only if Confirm email is ON or you use password reset)

Dashboard → **Authentication → Emails / SMTP Settings**

- The built-in Supabase email service is rate-limited and intended for testing
  only. For production, configure a custom SMTP provider (Resend, SendGrid,
  Postmark, SES, etc.).
- Confirmation, password-recovery, and magic-link emails all flow through this.
- Customize the **Confirm signup** and **Reset password** email templates so the
  action links point at the correct origin (Supabase substitutes the allowed
  redirect automatically).

---

## 6. Verification checklist

After configuring the above, verify each flow against the deployed app:

- [ ] **Email sign-up (Confirm email ON):** submitting the signup form shows the
      "Check your inbox" panel; clicking the emailed link lands on `/dashboard`
      logged in.
- [ ] **Email sign-up (Confirm email OFF):** submitting redirects straight to
      `/dashboard` logged in.
- [ ] **Email sign-in:** correct credentials redirect to `/dashboard`; wrong
      password shows the friendly "Incorrect email or password" alert.
- [ ] **Unconfirmed login (if Confirm email ON):** shows "Please confirm your
      email address first."
- [ ] **Google (new user):** completes the consent screen, returns via
      `/auth/callback`, lands on `/dashboard`, and a `profiles` row exists.
- [ ] **Google (existing user):** signs in without re-provisioning errors.
- [ ] **Forgot / reset password:** the emailed link opens `/reset-password`,
      allows setting a new password, and redirects to `/login`.
- [ ] **Sign-out:** clears the session and returns to a public page.

If any redirect fails with `redirect_to is not allowed`, re-check the exact
spelling (scheme/host/port/path) of the entry in step 2.
