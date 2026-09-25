import { AppRouteError } from "./base.js";
import type { FieldError } from "../models/common.js";

/**
 * Raised when the API returns an error response.
 */
export class ApiError extends AppRouteError {
  public readonly code: string;
  public readonly traceId: string;
  public readonly statusCode: number;
  public readonly errors: FieldError[];

  constructor(
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[] = [],
  ) {
    const parts = [`[${code}] ${message} (traceId=${traceId})`];
    for (const err of errors) {
      parts.push(`  - ${err.field}: ${err.code} — ${err.message}`);
    }
    super(parts.join("\n"));
    this.name = "ApiError";
    this.code = code;
    this.traceId = traceId;
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
