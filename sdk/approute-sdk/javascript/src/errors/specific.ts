import { ApiError } from "./api-error.js";
import type { FieldError } from "../models/common.js";

/** code=VALIDATION_ERROR (HTTP 422). */
export class ValidationError extends ApiError {
  constructor(
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[] = [],
  ) {
    super(code, message, traceId, statusCode, errors);
    this.name = "ValidationError";
  }
}

/** code=UNAUTHORIZED (HTTP 401). */
export class UnauthorizedError extends ApiError {
  constructor(
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[] = [],
  ) {
    super(code, message, traceId, statusCode, errors);
    this.name = "UnauthorizedError";
  }
}

/** code=FORBIDDEN (HTTP 403). */
export class ForbiddenError extends ApiError {
  constructor(
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[] = [],
  ) {
    super(code, message, traceId, statusCode, errors);
    this.name = "ForbiddenError";
  }
}

/** code=NOT_FOUND (HTTP 404). */
export class NotFoundError extends ApiError {
  constructor(
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[] = [],
  ) {
    super(code, message, traceId, statusCode, errors);
    this.name = "NotFoundError";
  }
}

/** code=CONFLICT (HTTP 409). */
export class ConflictError extends ApiError {
  constructor(
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[] = [],
  ) {
    super(code, message, traceId, statusCode, errors);
    this.name = "ConflictError";
  }
}

/** code=LIMIT_REACHED (HTTP 429). */
export class RateLimitedError extends ApiError {
  constructor(
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[] = [],
  ) {
    super(code, message, traceId, statusCode, errors);
    this.name = "RateLimitedError";
  }
}

/** code=OUT_OF_STOCK (HTTP 422). */
export class OutOfStockError extends ApiError {
  constructor(
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[] = [],
  ) {
    super(code, message, traceId, statusCode, errors);
    this.name = "OutOfStockError";
  }
}

/** code=INSUFFICIENT_FUNDS (HTTP 422). */
export class InsufficientFundsError extends ApiError {
  constructor(
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[] = [],
  ) {
    super(code, message, traceId, statusCode, errors);
    this.name = "InsufficientFundsError";
  }
}

/** code=UPSTREAM_ERROR (HTTP 502). */
export class UpstreamError extends ApiError {
  constructor(
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[] = [],
  ) {
    super(code, message, traceId, statusCode, errors);
    this.name = "UpstreamError";
  }
}

/** code=INTERNAL_ERROR (HTTP 500). */
export class InternalError extends ApiError {
  constructor(
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[] = [],
  ) {
    super(code, message, traceId, statusCode, errors);
    this.name = "InternalError";
  }
}

/**
 * Map from result code string to the concrete ApiError subclass.
 */
const CODE_TO_ERROR: Record<
  string,
  new (
    code: string,
    message: string,
    traceId: string,
    statusCode: number,
    errors: FieldError[],
  ) => ApiError
> = {
  VALIDATION_ERROR: ValidationError,
  UNAUTHORIZED: UnauthorizedError,
  FORBIDDEN: ForbiddenError,
  NOT_FOUND: NotFoundError,
  CONFLICT: ConflictError,
  LIMIT_REACHED: RateLimitedError,
  OUT_OF_STOCK: OutOfStockError,
  INSUFFICIENT_FUNDS: InsufficientFundsError,
  UPSTREAM_ERROR: UpstreamError,
  INTERNAL_ERROR: InternalError,
};

/**
 * Throw the appropriate ApiError subclass based on the result code.
 */
export function raiseForCode(
  code: string,
  message: string,
  traceId: string,
  statusCode: number,
  errors: FieldError[] = [],
): never {
  const ErrorClass = CODE_TO_ERROR[code] ?? ApiError;
  throw new ErrorClass(code, message, traceId, statusCode, errors);
}
