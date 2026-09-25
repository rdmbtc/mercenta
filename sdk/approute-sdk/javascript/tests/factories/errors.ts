import type { Envelope, FieldError } from '../../src/models/index.js';

/**
 * Helper: JSON responses use `null` for absent optional fields.
 */
type Nullable<T> = { [K in keyof T]: T[K] | null };

export function makeFieldError(
  overrides?: Partial<FieldError>,
): FieldError {
  return {
    field: 'email',
    code: 'INVALID_FORMAT',
    message: 'Invalid email format',
    ...overrides,
  };
}

export function makeErrorEnvelope(
  overrides?: Partial<Nullable<Envelope>>,
): Envelope {
  return {
    status: 'cancelled',
    code: 'NOT_FOUND',
    message: 'Product not found',
    traceId: 'trace-abc-123',
    data: null,
    errors: null,
    ...overrides,
  } as Envelope;
}

export function makeNotFoundEnvelope(
  overrides?: Partial<Nullable<Envelope>>,
): Envelope {
  return makeErrorEnvelope({
    code: 'NOT_FOUND',
    message: 'Product not found',
    traceId: 'trace-abc-123',
    ...overrides,
  });
}

export function makeValidationErrorEnvelope(
  overrides?: Partial<Nullable<Envelope>>,
): Envelope {
  return makeErrorEnvelope({
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    traceId: 'trace-val-456',
    errors: [
      makeFieldError(),
      makeFieldError({
        field: 'quantity',
        code: 'OUT_OF_RANGE',
        message: 'Must be between 1 and 100',
      }),
    ],
    ...overrides,
  });
}

export function makeUnauthorizedEnvelope(
  overrides?: Partial<Nullable<Envelope>>,
): Envelope {
  return makeErrorEnvelope({
    code: 'UNAUTHORIZED',
    message: 'Invalid API key',
    traceId: 'trace-auth-789',
    ...overrides,
  });
}

export function makeInsufficientFundsEnvelope(
  overrides?: Partial<Nullable<Envelope>>,
): Envelope {
  return makeErrorEnvelope({
    code: 'INSUFFICIENT_FUNDS',
    message: 'Not enough balance',
    traceId: 'trace-funds-000',
    ...overrides,
  });
}
