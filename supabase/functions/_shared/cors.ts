export interface CorsOptions {
  /**
   * Allowed origins. Use "*" for public API endpoints that do not rely on cookies.
   * When an array is provided, the request Origin must match one of the entries.
   */
  allowedOrigins?: string[] | string;
  allowedMethods?: string[];
  allowedHeaders?: string[];
  maxAgeSeconds?: number;
}

const DEFAULT_ALLOWED_ORIGIN = "*";
const DEFAULT_ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const DEFAULT_ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-requested-with",
];
const DEFAULT_MAX_AGE_SECONDS = 86_400;

function resolveAllowedOrigin(request: Request | undefined, allowedOrigins: string[] | string): string {
  if (allowedOrigins === "*") {
    return "*";
  }

  const requestOrigin = request?.headers.get("origin");

  if (!requestOrigin) {
    return allowedOrigins[0] ?? DEFAULT_ALLOWED_ORIGIN;
  }

  return allowedOrigins.includes(requestOrigin) ? requestOrigin : "null";
}

/**
 * Builds CORS headers for Supabase Edge Functions.
 *
 * The default uses a wildcard origin and bearer-token auth headers, which is safe for
 * token-based APIs because credentials/cookies are not enabled.
 */
export function createCorsHeaders(request?: Request, options: CorsOptions = {}): Record<string, string> {
  const allowedOrigins = options.allowedOrigins ?? DEFAULT_ALLOWED_ORIGIN;
  const allowedMethods = options.allowedMethods ?? DEFAULT_ALLOWED_METHODS;
  const allowedHeaders = options.allowedHeaders ?? DEFAULT_ALLOWED_HEADERS;
  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;
  const origin = resolveAllowedOrigin(request, allowedOrigins);

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": allowedHeaders.join(", "),
    "Access-Control-Allow-Methods": allowedMethods.join(", "),
    "Access-Control-Max-Age": String(maxAgeSeconds),
    "Content-Type": "application/json; charset=utf-8",
  };

  if (allowedOrigins !== "*") {
    headers.Vary = "Origin";
  }

  return headers;
}

export function isCorsPreflightRequest(request: Request): boolean {
  return request.method.toUpperCase() === "OPTIONS";
}

/**
 * Returns an immediate 204 response for OPTIONS preflight requests.
 * Edge function handlers can call this at the top of their request handler:
 *
 * const preflight = handleCorsPreflight(req);
 * if (preflight) return preflight;
 */
export function handleCorsPreflight(request: Request, options?: CorsOptions): Response | null {
  if (!isCorsPreflightRequest(request)) {
    return null;
  }

  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(request, options),
  });
}

export const corsHeaders = createCorsHeaders();
