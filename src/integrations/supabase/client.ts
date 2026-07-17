// src/integrations/supabase/client.ts
//
// Supabase client singleton. This is the ONE and ONLY place the browser
// Supabase client is created; every feature (email auth, Google OAuth, email
// confirmation, profile provisioning, campaigns, storage) imports the shared
// `supabase` instance from here:
//
//   import { supabase } from "@/integrations/supabase/client";
//
// AUTH FLOW REQUIREMENTS (build step 1 of 6):
//   - persistSession:     keep the session in localStorage so users stay
//                         logged in across reloads/tabs.
//   - autoRefreshToken:   silently refresh the access token before it expires
//                         so long-lived sessions don't break.
//   - detectSessionInUrl: automatically parse the tokens that Supabase returns
//                         in the URL hash after (a) a Google OAuth redirect and
//                         (b) an email-confirmation / magic / recovery link.
//                         Without this, the Google callback and email
//                         confirmation flows would never establish a session.
//   - flowType "pkce":    the recommended, most secure browser OAuth flow.
//
// SECURITY: the URL and anon (publishable) key are read from the auto-injected
// Vite env. They are PUBLIC values (safe to ship to the browser). We NEVER read
// or embed the service-role key here — that would leak a privileged secret into
// client code.

import { createClient } from "@supabase/supabase-js";

/**
 * Read a Vite env var, tolerating the two naming schemes that appear across
 * Krossable/Supabase-generated projects:
 *   - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (Vite convention)
 *   - SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_PUBLISHABLE_KEY (fallbacks)
 * Returns an empty string if none are present so we can fail loudly below.
 */
function readEnv(...keys: string[]): string {
  const env = import.meta.env as Record<string, string | undefined>;
  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return "";
}

const SUPABASE_URL = readEnv("VITE_SUPABASE_URL", "SUPABASE_URL");

const SUPABASE_ANON_KEY = readEnv(
  "VITE_SUPABASE_ANON_KEY",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY"
);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Surface a clear, actionable error instead of a cryptic runtime failure
  // deep inside an auth call. This only fires when the env is misconfigured.
  // eslint-disable-next-line no-console
  console.error(
    "[supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. " +
      "Authentication (email + Google) will not work until these are set."
  );
}

/**
 * Stable storage key so the persisted session isn't accidentally invalidated
 * by unrelated localStorage churn. Derived from the project ref in the URL.
 */
const STORAGE_KEY = "rayze-auth";

/**
 * Shared browser Supabase client. Import this everywhere; do NOT call
 * createClient again elsewhere.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Keep the user signed in across reloads and browser tabs.
    persistSession: true,
    // Refresh the JWT automatically before it expires.
    autoRefreshToken: true,
    // Parse tokens returned in the URL hash after OAuth redirect / email links.
    // Essential for Google sign-in and email confirmation to complete.
    detectSessionInUrl: true,
    // PKCE is the recommended, most secure OAuth flow for SPAs.
    flowType: "pkce",
    storageKey: STORAGE_KEY,
  },
});

export default supabase;
