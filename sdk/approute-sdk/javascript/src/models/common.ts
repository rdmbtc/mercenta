/**
 * Field-level error detail returned in API validation responses.
 */
export interface FieldError {
  field: string;
  code: string;
  message: string;
}

/**
 * Standard API response envelope wrapping all responses.
 */
export interface Envelope<T = unknown> {
  status: string;
  code: string;
  message: string;
  traceId?: string;
  data?: T;
  errors?: FieldError[];
}
