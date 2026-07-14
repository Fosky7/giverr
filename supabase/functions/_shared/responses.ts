import { createCorsHeaders, type CorsOptions } from "./cors.ts";

export interface JsonSuccessPayload<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface JsonErrorPayload {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface SuccessResponseOptions extends ResponseInit {
  request?: Request;
  cors?: CorsOptions;
  meta?: Record<string, unknown>;
}

export interface ErrorResponseOptions extends ResponseInit {
  request?: Request;
  cors?: CorsOptions;
  code?: string;
  details?: unknown;
}

function mergeHeaders(baseHeaders: HeadersInit, overrideHeaders?: HeadersInit): Headers {
  const headers = new Headers(baseHeaders);

  if (!overrideHeaders) {
    return headers;
  }

  new Headers(overrideHeaders).forEach((value, key) => {
    headers.set(key, value);
  });

  return headers;
}

export function jsonResponse<TPayload>(
  payload: TPayload,
  options: ResponseInit & { request?: Request; cors?: CorsOptions } = {},
): Response {
  const { request, cors, headers: overrideHeaders, ...responseInit } = options;
  const headers = mergeHeaders(createCorsHeaders(request, cors), overrideHeaders);

  return new Response(JSON.stringify(payload), {
    ...responseInit,
    headers,
  });
}

export function successResponse<TData>(data: TData, options: SuccessResponseOptions = {}): Response {
  const { meta, status = 200, ...responseOptions } = options;
  const payload: JsonSuccessPayload<TData> = meta
    ? { success: true, data, meta }
    : { success: true, data };

  return jsonResponse(payload, {
    ...responseOptions,
    status,
  });
}

export function errorResponse(message: string, options: ErrorResponseOptions = {}): Response {
  const { code, details, status = 400, ...responseOptions } = options;
  const payload: JsonErrorPayload = {
    success: false,
    error: {
      message,
      ...(code ? { code } : {}),
      ...(details !== undefined ? { details } : {}),
    },
  };

  return jsonResponse(payload, {
    ...responseOptions,
    status,
  });
}

export function internalErrorResponse(error: unknown, options: ErrorResponseOptions = {}): Response {
  const message = error instanceof Error ? error.message : "An unexpected error occurred.";

  return errorResponse("Internal server error", {
    ...options,
    status: options.status ?? 500,
    code: options.code ?? "INTERNAL_SERVER_ERROR",
    details: options.details ?? { message },
  });
}
