import { NextResponse } from "next/server";

/** Structured error response. REST best practice: consistent, predictable. */
export type ApiError = {
  code: string;
  message: string;
  details?: Array<{ field?: string; message: string }>;
};

export function errorResponse(error: ApiError, status: number) {
  return NextResponse.json({ error }, { status });
}

export const Errors = {
  badRequest: (message = "Bad request", details?: ApiError["details"]) =>
    errorResponse({ code: "BAD_REQUEST", message, details }, 400),
  unauthorized: (message = "Admin access required") => errorResponse({ code: "UNAUTHORIZED", message }, 401),
  forbidden: (message = "Forbidden") => errorResponse({ code: "FORBIDDEN", message }, 403),
  notFound: (message = "Resource not found") => errorResponse({ code: "NOT_FOUND", message }, 404),
  validation: (message: string, details?: ApiError["details"]) =>
    errorResponse({ code: "VALIDATION_ERROR", message, details }, 422),
  tooManyRequests: (message = "Too many requests") => errorResponse({ code: "RATE_LIMIT_EXCEEDED", message }, 429),
  internal: (message = "Internal server error") => errorResponse({ code: "INTERNAL_ERROR", message }, 500)
} as const;
