import { describe, it, expect } from "vitest";
import {
  AppRouteError,
  NetworkError,
  ApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitedError,
  OutOfStockError,
  InsufficientFundsError,
  UpstreamError,
  InternalError,
  raiseForCode,
} from "../src/errors/index.js";

describe("Error hierarchy", () => {
  it("AppRouteError should extend Error", () => {
    const err = new AppRouteError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppRouteError);
    expect(err.name).toBe("AppRouteError");
    expect(err.message).toBe("test");
  });

  it("NetworkError should extend AppRouteError", () => {
    const err = new NetworkError("timeout");
    expect(err).toBeInstanceOf(AppRouteError);
    expect(err).toBeInstanceOf(NetworkError);
    expect(err.name).toBe("NetworkError");
  });

  it("ApiError should extend AppRouteError and carry metadata", () => {
    const err = new ApiError("NOT_FOUND", "Not found", "trace-1", 404);
    expect(err).toBeInstanceOf(AppRouteError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("ApiError");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.traceId).toBe("trace-1");
    expect(err.statusCode).toBe(404);
    expect(err.errors).toEqual([]);
  });

  it("ApiError should include field errors in message", () => {
    const err = new ApiError("VALIDATION_ERROR", "Invalid", "trace-2", 422, [
      { field: "email", code: "INVALID_FORMAT", message: "Bad email" },
    ]);
    expect(err.message).toContain("[VALIDATION_ERROR] Invalid");
    expect(err.message).toContain("email: INVALID_FORMAT");
    expect(err.errors).toHaveLength(1);
  });

  it("ValidationError should extend ApiError", () => {
    const err = new ValidationError("VALIDATION_ERROR", "msg", "t", 422);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.name).toBe("ValidationError");
  });

  it("UnauthorizedError should extend ApiError", () => {
    const err = new UnauthorizedError("UNAUTHORIZED", "msg", "t", 401);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("UnauthorizedError");
  });

  it("ForbiddenError should extend ApiError", () => {
    const err = new ForbiddenError("FORBIDDEN", "msg", "t", 403);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("ForbiddenError");
  });

  it("NotFoundError should extend ApiError", () => {
    const err = new NotFoundError("NOT_FOUND", "msg", "t", 404);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("NotFoundError");
  });

  it("ConflictError should extend ApiError", () => {
    const err = new ConflictError("CONFLICT", "msg", "t", 409);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("ConflictError");
  });

  it("RateLimitedError should extend ApiError", () => {
    const err = new RateLimitedError("LIMIT_REACHED", "msg", "t", 429);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("RateLimitedError");
  });

  it("OutOfStockError should extend ApiError", () => {
    const err = new OutOfStockError("OUT_OF_STOCK", "msg", "t", 422);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("OutOfStockError");
  });

  it("InsufficientFundsError should extend ApiError", () => {
    const err = new InsufficientFundsError("INSUFFICIENT_FUNDS", "msg", "t", 422);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("InsufficientFundsError");
  });

  it("UpstreamError should extend ApiError", () => {
    const err = new UpstreamError("UPSTREAM_ERROR", "msg", "t", 502);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("UpstreamError");
  });

  it("InternalError should extend ApiError", () => {
    const err = new InternalError("INTERNAL_ERROR", "msg", "t", 500);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("InternalError");
  });
});

describe("raiseForCode", () => {
  const cases: [string, new (...args: never[]) => ApiError][] = [
    ["VALIDATION_ERROR", ValidationError as never],
    ["UNAUTHORIZED", UnauthorizedError as never],
    ["FORBIDDEN", ForbiddenError as never],
    ["NOT_FOUND", NotFoundError as never],
    ["CONFLICT", ConflictError as never],
    ["LIMIT_REACHED", RateLimitedError as never],
    ["OUT_OF_STOCK", OutOfStockError as never],
    ["INSUFFICIENT_FUNDS", InsufficientFundsError as never],
    ["UPSTREAM_ERROR", UpstreamError as never],
    ["INTERNAL_ERROR", InternalError as never],
  ];

  for (const [code, ErrorClass] of cases) {
    it(`should throw ${ErrorClass.name} for code=${code}`, () => {
      expect(() => raiseForCode(code, "msg", "trace", 400)).toThrow(ErrorClass);
    });
  }

  it("should fallback to ApiError for unknown codes", () => {
    expect(() => raiseForCode("UNKNOWN_CODE", "msg", "trace", 418)).toThrow(
      ApiError,
    );
  });

  it("should pass field errors through", () => {
    try {
      raiseForCode("VALIDATION_ERROR", "msg", "trace", 422, [
        { field: "name", code: "MISSING", message: "Required" },
      ]);
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).errors).toHaveLength(1);
      expect((err as ValidationError).errors[0].field).toBe("name");
    }
  });
});
