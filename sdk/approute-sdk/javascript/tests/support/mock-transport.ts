import type { HttpTransport, RequestOptions } from "../../src/transport/index.js";

/**
 * A single call recorded by {@link MockTransport}.
 */
export interface RecordedCall {
  method: string;
  path: string;
  options?: RequestOptions;
}

/**
 * A test double for {@link HttpTransport} that records every call
 * and returns a configurable response (or throws a configurable error).
 *
 * Usage:
 * ```ts
 * const mock = new MockTransport().setResponse({ items: [] });
 * const resource = new ServicesResource(mock.transport);
 * await resource.list();
 * expect(mock.lastCall.method).toBe("GET");
 * ```
 */
export class MockTransport {
  /** All calls recorded so far, in order. */
  calls: RecordedCall[] = [];

  private _response: unknown = undefined;
  private _error: Error | undefined = undefined;

  /**
   * Set the response data that will be returned by all subsequent calls.
   * Chainable.
   */
  setResponse(data: unknown): this {
    this._response = data;
    this._error = undefined;
    return this;
  }

  /**
   * Set an error that will be thrown by all subsequent calls.
   * Chainable.
   */
  setError(error: Error): this {
    this._error = error;
    this._response = undefined;
    return this;
  }

  /**
   * Returns the last recorded call, or throws if no calls have been made.
   */
  get lastCall(): RecordedCall {
    if (this.calls.length === 0) {
      throw new Error("MockTransport: no calls recorded");
    }
    return this.calls[this.calls.length - 1];
  }

  /**
   * The number of calls recorded so far.
   */
  get callCount(): number {
    return this.calls.length;
  }

  /**
   * Clear all recorded calls and configured response/error.
   */
  reset(): void {
    this.calls = [];
    this._response = undefined;
    this._error = undefined;
  }

  /**
   * An object that satisfies the {@link HttpTransport} interface
   * expected by all resource classes.
   *
   * Pass this to resource constructors:
   * ```ts
   * new ServicesResource(mock.transport)
   * ```
   */
  get transport(): HttpTransport {
    return this._transportProxy;
  }

  // ------------------------------------------------------------------
  // Internal
  // ------------------------------------------------------------------

  private readonly _transportProxy: HttpTransport;

  constructor(data?: unknown) {
    if (data !== undefined) {
      this._response = data;
    }

    // Build a proxy object once, capturing `this` for the request method.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this._transportProxy = {
      request: async <T = unknown>(
        method: string,
        path: string,
        options?: RequestOptions,
      ): Promise<T> => {
        self.calls.push({ method, path, options });
        if (self._error) {
          throw self._error;
        }
        return self._response as T;
      },
    } as HttpTransport;
  }
}
