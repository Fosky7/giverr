import { supabase } from "@/integrations/supabase/client";

export interface SupabaseBrowserConfig {
  url: string;
  anonKey: string;
}

export class SupabaseConfigurationError extends Error {
  readonly code = "SUPABASE_CONFIGURATION_ERROR";

  constructor(message = "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.") {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

function readViteEnv(): Record<string, string | undefined> {
  return ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}) as Record<
    string,
    string | undefined
  >;
}

function normalizeEnvValue(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getSupabaseBrowserConfig(): SupabaseBrowserConfig {
  const env = readViteEnv();
  const url = normalizeEnvValue(env.VITE_SUPABASE_URL);
  const anonKey = normalizeEnvValue(env.VITE_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new SupabaseConfigurationError();
  }

  return { url, anonKey };
}

export function getSupabaseConfigurationError(): SupabaseConfigurationError | null {
  try {
    getSupabaseBrowserConfig();
    return null;
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return error;
    }

    return new SupabaseConfigurationError();
  }
}

export function assertSupabaseConfigured(): SupabaseBrowserConfig {
  return getSupabaseBrowserConfig();
}

/**
 * Compatibility export for code that needs a single frontend Supabase integration point.
 *
 * The actual browser client is the project-scaffolded client from
 * `@/integrations/supabase/client`; this file intentionally does not create a second
 * client and never exposes service-role credentials.
 */
export const supabaseClient = supabase;

export { supabase };
