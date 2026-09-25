import {
  AppRouteError,
  NetworkError,
  raiseForCode,
} from "../errors/index.js";
import type { FieldError } from "../models/common.js";

const SUCCESS_CODES = new Set(["OK", "ACCEPTED", "IDEMPOTENCY_REPLAY"]);
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const RETRY_BACKOFF_BASE = 1000; // milliseconds

export interface RequestOptions {
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

/**
 * Low-level HTTP transport that handles authentication, retries,
 * envelope unwrapping, and error mapping.
 *
 * Uses native `fetch` (Node 18+).
 */
export class HttpTransport {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(
    baseUrl: string,
    apiKey: string,
    timeout: number = 30_000,
    maxRetries: number = 3,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }

  /**
   * Perform an HTTP request, unwrap the envelope, and return `data`
   * on success or throw the appropriate `ApiError` subclass on failure.
   */
  async request<T = unknown>(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const headers: Record<string, string> = {
      "X-API-Key": this.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const fetchInit: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (options?.body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      fetchInit.body = JSON.stringify(options.body);
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      let response: Response;

      try {
        response = await fetch(url, fetchInit);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "TimeoutError") {
          throw new NetworkError(`Request timed out after ${this.timeout}ms`);
        }
        if (err instanceof TypeError) {
          throw new NetworkError(`Connection error: ${err.message}`);
        }
        throw new NetworkError(
          err instanceof Error ? err.message : String(err),
        );
      }

      // Retry on retryable status codes (429 / 5xx)
      if (
        RETRYABLE_STATUS_CODES.has(response.status) &&
        attempt < this.maxRetries
      ) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter
          ? parseFloat(retryAfter) * 1000
          : RETRY_BACKOFF_BASE * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      return this.handleResponse<T>(response);
    }

    throw new AppRouteError("Max retries exceeded");
  }

  /**
   * Parse the JSON envelope and either return `data` or throw.
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    let body: Record<string, unknown>;
    try {
      body = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new AppRouteError(
        `Invalid JSON response (HTTP ${response.status})`,
      );
    }

    const code = (body.code as string) ?? "";
    const message = (body.message as string) ?? "";
    const traceId = (body.traceId as string) ?? "";

    if (SUCCESS_CODES.has(code)) {
      return body.data as T;
    }

    // Parse field-level errors
    const rawErrors = (body.errors as Array<Record<string, string>>) ?? [];
    const fieldErrors: FieldError[] = rawErrors.map((e) => ({
      field: e.field ?? "",
      code: e.code ?? "",
      message: e.message ?? "",
    }));

    raiseForCode(code, message, traceId, response.status, fieldErrors);
  }

  /**
   * Build the full URL with query parameters.
   */
  private buildUrl(
    path: string,
    params?: Record<string, unknown>,
  ): string {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) {
          continue;
        }
        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(key, String(item));
          }
        } else if (typeof value === "boolean") {
          url.searchParams.set(key, value ? "true" : "false");
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
