from __future__ import annotations

from approute.errors.api import ApiError, FieldError


class ValidationError(ApiError):
    """code=VALIDATION_ERROR (HTTP 422)."""


class UnauthorizedError(ApiError):
    """code=UNAUTHORIZED (HTTP 401)."""


class ForbiddenError(ApiError):
    """code=FORBIDDEN (HTTP 403)."""


class NotFoundError(ApiError):
    """code=NOT_FOUND (HTTP 404)."""


class ConflictError(ApiError):
    """code=CONFLICT (HTTP 409)."""


class RateLimitedError(ApiError):
    """code=LIMIT_REACHED (HTTP 429)."""


class OutOfStockError(ApiError):
    """code=OUT_OF_STOCK (HTTP 422)."""


class InsufficientFundsError(ApiError):
    """code=INSUFFICIENT_FUNDS (HTTP 422)."""


class UpstreamError(ApiError):
    """code=UPSTREAM_ERROR (HTTP 502)."""


class InternalError(ApiError):
    """code=INTERNAL_ERROR (HTTP 500)."""


_CODE_TO_ERROR: dict[str, type[ApiError]] = {
    "VALIDATION_ERROR": ValidationError,
    "UNAUTHORIZED": UnauthorizedError,
    "FORBIDDEN": ForbiddenError,
    "NOT_FOUND": NotFoundError,
    "CONFLICT": ConflictError,
    "LIMIT_REACHED": RateLimitedError,
    "OUT_OF_STOCK": OutOfStockError,
    "INSUFFICIENT_FUNDS": InsufficientFundsError,
    "UPSTREAM_ERROR": UpstreamError,
    "INTERNAL_ERROR": InternalError,
}


def raise_for_code(
    code: str,
    message: str,
    trace_id: str,
    status_code: int,
    errors: list[FieldError] | None = None,
) -> None:
    cls = _CODE_TO_ERROR.get(code, ApiError)
    raise cls(
        code=code,
        message=message,
        trace_id=trace_id,
        status_code=status_code,
        errors=errors or [],
    )
