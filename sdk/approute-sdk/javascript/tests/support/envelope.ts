import type { Envelope, FieldError } from "../../src/models/common.js";

/**
 * Build a standard success envelope wrapping the given data.
 *
 * ```ts
 * successEnvelope({ items: [] })
 * // => { status: "ok", code: "OK", message: "Success", data: { items: [] } }
 * ```
 */
export function successEnvelope<T>(data: T): Envelope<T> {
  return {
    status: "ok",
    code: "OK",
    message: "Success",
    data,
  };
}

/**
 * Build a standard error envelope (no field-level errors).
 *
 * ```ts
 * errorEnvelope("NOT_FOUND", "Product not found", "trace-123")
 * ```
 */
export function errorEnvelope(
  code: string,
  message: string,
  traceId?: string,
): Envelope {
  return {
    status: "cancelled",
    code,
    message,
    ...(traceId !== undefined && { traceId }),
  };
}

/**
 * Build a validation error envelope with field-level errors.
 *
 * ```ts
 * validationErrorEnvelope("Validation failed", [
 *   { field: "email", code: "INVALID_FORMAT", message: "Bad email" },
 * ], "trace-456")
 * ```
 */
export function validationErrorEnvelope(
  message: string,
  errors: FieldError[],
  traceId?: string,
): Envelope {
  return {
    status: "cancelled",
    code: "VALIDATION_ERROR",
    message,
    errors,
    ...(traceId !== undefined && { traceId }),
  };
}
