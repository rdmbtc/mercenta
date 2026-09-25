/**
 * Field-level error codes returned in validation errors.
 */
export const FieldErrorCode = {
  MISSING: "MISSING",
  OUT_OF_RANGE: "OUT_OF_RANGE",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_VALUE: "INVALID_VALUE",
  NOT_ALLOWED: "NOT_ALLOWED",
  TOO_LONG: "TOO_LONG",
  TOO_SHORT: "TOO_SHORT",
} as const;

export type FieldErrorCode =
  (typeof FieldErrorCode)[keyof typeof FieldErrorCode];
