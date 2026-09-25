from __future__ import annotations

import pytest

from approute.errors import (
    ApiError,
    AppRouteError,
    ConflictError,
    FieldError,
    ForbiddenError,
    InsufficientFundsError,
    InternalError,
    NetworkError,
    NotFoundError,
    OutOfStockError,
    RateLimitedError,
    UnauthorizedError,
    UpstreamError,
    ValidationError,
    raise_for_code,
)


class TestErrorHierarchy:
    def test_api_error_is_exception(self) -> None:
        err = ApiError(code="TEST", message="test", trace_id="t", status_code=400)
        assert isinstance(err, Exception)

    def test_network_error_is_approute_error(self) -> None:
        err = NetworkError("timeout")
        assert isinstance(err, AppRouteError)

    def test_all_specific_errors_are_api_error(self) -> None:
        for cls in [
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
        ]:
            err = cls(code="X", message="x", trace_id="t", status_code=400)
            assert isinstance(err, ApiError)


class TestApiErrorStr:
    def test_str_without_field_errors(self) -> None:
        err = ApiError(code="NOT_FOUND", message="Not found", trace_id="t-1", status_code=404)
        assert "[NOT_FOUND] Not found (trace_id=t-1)" in str(err)

    def test_str_with_field_errors(self) -> None:
        err = ValidationError(
            code="VALIDATION_ERROR",
            message="Validation failed",
            trace_id="t-2",
            status_code=422,
            errors=[
                FieldError(field="email", code="INVALID_FORMAT", message="Bad email"),
                FieldError(field="quantity", code="OUT_OF_RANGE", message="Too many"),
            ],
        )
        s = str(err)
        assert "email: INVALID_FORMAT" in s
        assert "quantity: OUT_OF_RANGE" in s


class TestRaiseForCode:
    @pytest.mark.parametrize(
        ("code", "expected_cls"),
        [
            ("VALIDATION_ERROR", ValidationError),
            ("UNAUTHORIZED", UnauthorizedError),
            ("FORBIDDEN", ForbiddenError),
            ("NOT_FOUND", NotFoundError),
            ("CONFLICT", ConflictError),
            ("LIMIT_REACHED", RateLimitedError),
            ("OUT_OF_STOCK", OutOfStockError),
            ("INSUFFICIENT_FUNDS", InsufficientFundsError),
            ("UPSTREAM_ERROR", UpstreamError),
            ("INTERNAL_ERROR", InternalError),
        ],
    )
    def test_raises_correct_class(self, code: str, expected_cls: type) -> None:
        with pytest.raises(expected_cls) as exc_info:
            raise_for_code(code=code, message="msg", trace_id="t", status_code=400)
        assert exc_info.value.code == code

    def test_unknown_code_raises_api_error(self) -> None:
        with pytest.raises(ApiError) as exc_info:
            raise_for_code(code="UNKNOWN_CODE", message="weird", trace_id="t", status_code=500)
        assert exc_info.value.code == "UNKNOWN_CODE"

    def test_field_errors_passed_through(self) -> None:
        errors = [FieldError(field="f", code="MISSING", message="required")]
        with pytest.raises(ValidationError) as exc_info:
            raise_for_code(
                code="VALIDATION_ERROR",
                message="fail",
                trace_id="t",
                status_code=422,
                errors=errors,
            )
        assert len(exc_info.value.errors) == 1
        assert exc_info.value.errors[0].field == "f"
