import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpTransport } from "../src/transport/http-transport.js";
import {
  AppRouteError,
  NetworkError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  InsufficientFundsError,
} from "../src/errors/index.js";
import {
  makeNotFoundEnvelope,
  makeValidationErrorEnvelope,
  makeUnauthorizedEnvelope,
  makeInsufficientFundsEnvelope,
} from "./factories/index.js";

describe("HttpTransport", () => {
  const BASE_URL = "https://api.test.com/api/v1";
  const API_KEY = "sk_test_key";

  let transport: HttpTransport;

  beforeEach(() => {
    transport = new HttpTransport(BASE_URL, API_KEY, 5000, 0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should make a GET request with correct headers", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        status: "ok",
        code: "OK",
        message: "Success",
        data: { items: [] },
      }),
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await transport.request("GET", "/services");
    expect(result).toEqual({ items: [] });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[0]).toBe("https://api.test.com/api/v1/services");
    expect((fetchCall[1]?.headers as Record<string, string>)["X-API-Key"]).toBe(API_KEY);
    expect((fetchCall[1]?.headers as Record<string, string>)["Accept"]).toBe("application/json");
  });

  it("should make a POST request with body", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        status: "ok",
        code: "OK",
        message: "Success",
        data: { orderId: "ord-123" },
      }),
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await transport.request("POST", "/orders", {
      body: { itemId: "item-1", quantity: 2 },
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[1]?.method).toBe("POST");
    expect(fetchCall[1]?.body).toBe(JSON.stringify({ itemId: "item-1", quantity: 2 }));
  });

  it("should append query parameters to URL", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        status: "ok",
        code: "OK",
        message: "Success",
        data: { items: [] },
      }),
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await transport.request("GET", "/orders", {
      params: { limit: 10, offset: 0 },
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const url = new URL(fetchCall[0] as string);
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("offset")).toBe("0");
  });

  it("should handle array query parameters", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        status: "ok",
        code: "OK",
        message: "Success",
        data: { items: [] },
      }),
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await transport.request("GET", "/funds/invoices", {
      params: { status: ["pending", "confirming"] },
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const url = new URL(fetchCall[0] as string);
    expect(url.searchParams.getAll("status")).toEqual(["pending", "confirming"]);
  });

  it("should skip null and undefined query parameters", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        status: "ok",
        code: "OK",
        message: "Success",
        data: { items: [] },
      }),
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await transport.request("GET", "/services", {
      params: { search: null, category: undefined, limit: 10 },
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const url = new URL(fetchCall[0] as string);
    expect(url.searchParams.has("search")).toBe(false);
    expect(url.searchParams.has("category")).toBe(false);
    expect(url.searchParams.get("limit")).toBe("10");
  });

  it("should handle boolean query parameters", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        status: "ok",
        code: "OK",
        message: "Success",
        data: { items: [] },
      }),
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await transport.request("GET", "/orders", {
      params: { unhide: true },
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const url = new URL(fetchCall[0] as string);
    expect(url.searchParams.get("unhide")).toBe("true");
  });

  it("should throw NotFoundError for NOT_FOUND code", async () => {
    const fixture = makeNotFoundEnvelope();
    const mockResponse = {
      ok: false,
      status: 404,
      json: async () => fixture,
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await expect(transport.request("GET", "/services/unknown")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("should throw ValidationError with field errors", async () => {
    const fixture = makeValidationErrorEnvelope();
    const mockResponse = {
      ok: false,
      status: 422,
      json: async () => fixture,
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    try {
      await transport.request("POST", "/orders", { body: {} });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const valErr = err as ValidationError;
      expect(valErr.code).toBe("VALIDATION_ERROR");
      expect(valErr.traceId).toBe("trace-val-456");
      expect(valErr.statusCode).toBe(422);
      expect(valErr.errors).toHaveLength(2);
      expect(valErr.errors[0].field).toBe("email");
      expect(valErr.errors[1].field).toBe("quantity");
    }
  });

  it("should throw UnauthorizedError for UNAUTHORIZED code", async () => {
    const fixture = makeUnauthorizedEnvelope();
    const mockResponse = {
      ok: false,
      status: 401,
      json: async () => fixture,
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await expect(transport.request("GET", "/accounts")).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("should throw InsufficientFundsError for INSUFFICIENT_FUNDS code", async () => {
    const fixture = makeInsufficientFundsEnvelope();
    const mockResponse = {
      ok: false,
      status: 422,
      json: async () => fixture,
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await expect(transport.request("POST", "/orders", { body: {} })).rejects.toThrow(
      InsufficientFundsError,
    );
  });

  it("should throw NetworkError on fetch TypeError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(transport.request("GET", "/services")).rejects.toThrow(
      NetworkError,
    );
  });

  it("should throw AppRouteError on invalid JSON response", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await expect(transport.request("GET", "/services")).rejects.toThrow(
      AppRouteError,
    );
  });

  it("should strip trailing slashes from baseUrl", async () => {
    const t = new HttpTransport("https://api.test.com/v1///", API_KEY, 5000, 0);

    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        status: "ok",
        code: "OK",
        message: "Success",
        data: null,
      }),
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await t.request("GET", "/services");

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect((fetchCall[0] as string).startsWith("https://api.test.com/v1/services")).toBe(true);
  });

  it("should accept ACCEPTED as a success code", async () => {
    const mockResponse = {
      ok: true,
      status: 202,
      json: async () => ({
        status: "ok",
        code: "ACCEPTED",
        message: "Accepted",
        data: { id: "job-1" },
      }),
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await transport.request("POST", "/orders");
    expect(result).toEqual({ id: "job-1" });
  });

  it("should accept IDEMPOTENCY_REPLAY as a success code", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        status: "ok",
        code: "IDEMPOTENCY_REPLAY",
        message: "Replayed",
        data: { id: "order-1" },
      }),
      headers: new Headers(),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await transport.request("POST", "/orders");
    expect(result).toEqual({ id: "order-1" });
  });
});
