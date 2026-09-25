/**
 * Base error class for all AppRoute SDK errors.
 */
export class AppRouteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppRouteError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Raised on connection or timeout errors.
 */
export class NetworkError extends AppRouteError {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}
