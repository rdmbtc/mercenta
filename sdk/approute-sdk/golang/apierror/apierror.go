package apierror

import (
	"fmt"
	"strings"

	"github.com/approute/public-api-sdk-go/enum"
	"github.com/approute/public-api-sdk-go/model"
)

// ApiError is the base error type for all non-success API responses.
// Callers can use errors.As to narrow to a more specific sub-type
// (e.g. *ValidationError, *NotFoundError).
type ApiError struct {
	Code       string             `json:"code"`
	Message    string             `json:"message"`
	TraceID    string             `json:"traceId"`
	StatusCode int                `json:"-"`
	Errors     []model.FieldError `json:"errors,omitempty"`
}

// Error implements the error interface.
func (e *ApiError) Error() string {
	var b strings.Builder
	fmt.Fprintf(&b, "[%s] %s (traceId=%s, status=%d)", e.Code, e.Message, e.TraceID, e.StatusCode)
	for _, fe := range e.Errors {
		fmt.Fprintf(&b, "\n  - %s: %s — %s", fe.Field, fe.Code, fe.Message)
	}
	return b.String()
}

// Unwrap returns nil; specific sub-types embed *ApiError so errors.As works.
func (e *ApiError) Unwrap() error { return nil }

// ValidationError is returned when code=VALIDATION_ERROR.
type ValidationError struct{ *ApiError }

// Unwrap returns the underlying *ApiError so errors.As matches both types.
func (e *ValidationError) Unwrap() error { return e.ApiError }

// UnauthorizedError is returned when code=UNAUTHORIZED.
type UnauthorizedError struct{ *ApiError }

// Unwrap returns the underlying *ApiError so errors.As matches both types.
func (e *UnauthorizedError) Unwrap() error { return e.ApiError }

// ForbiddenError is returned when code=FORBIDDEN.
type ForbiddenError struct{ *ApiError }

// Unwrap returns the underlying *ApiError so errors.As matches both types.
func (e *ForbiddenError) Unwrap() error { return e.ApiError }

// NotFoundError is returned when code=NOT_FOUND.
type NotFoundError struct{ *ApiError }

// Unwrap returns the underlying *ApiError so errors.As matches both types.
func (e *NotFoundError) Unwrap() error { return e.ApiError }

// ConflictError is returned when code=CONFLICT.
type ConflictError struct{ *ApiError }

// Unwrap returns the underlying *ApiError so errors.As matches both types.
func (e *ConflictError) Unwrap() error { return e.ApiError }

// RateLimitedError is returned when code=LIMIT_REACHED.
type RateLimitedError struct{ *ApiError }

// Unwrap returns the underlying *ApiError so errors.As matches both types.
func (e *RateLimitedError) Unwrap() error { return e.ApiError }

// OutOfStockError is returned when code=OUT_OF_STOCK.
type OutOfStockError struct{ *ApiError }

// Unwrap returns the underlying *ApiError so errors.As matches both types.
func (e *OutOfStockError) Unwrap() error { return e.ApiError }

// InsufficientFundsError is returned when code=INSUFFICIENT_FUNDS.
type InsufficientFundsError struct{ *ApiError }

// Unwrap returns the underlying *ApiError so errors.As matches both types.
func (e *InsufficientFundsError) Unwrap() error { return e.ApiError }

// UpstreamError is returned when code=UPSTREAM_ERROR.
type UpstreamError struct{ *ApiError }

// Unwrap returns the underlying *ApiError so errors.As matches both types.
func (e *UpstreamError) Unwrap() error { return e.ApiError }

// InternalServerError is returned when code=INTERNAL_ERROR.
type InternalServerError struct{ *ApiError }

// Unwrap returns the underlying *ApiError so errors.As matches both types.
func (e *InternalServerError) Unwrap() error { return e.ApiError }

// RaiseForCode builds the appropriate typed error for the given result code.
func RaiseForCode(code, message, traceID string, statusCode int, errors []model.FieldError) error {
	base := &ApiError{
		Code:       code,
		Message:    message,
		TraceID:    traceID,
		StatusCode: statusCode,
		Errors:     errors,
	}
	switch enum.ResultCode(code) {
	case enum.ResultValidationError:
		return &ValidationError{base}
	case enum.ResultUnauthorized:
		return &UnauthorizedError{base}
	case enum.ResultForbidden:
		return &ForbiddenError{base}
	case enum.ResultNotFound:
		return &NotFoundError{base}
	case enum.ResultConflict:
		return &ConflictError{base}
	case enum.ResultLimitReached:
		return &RateLimitedError{base}
	case enum.ResultOutOfStock:
		return &OutOfStockError{base}
	case enum.ResultInsufficientFunds:
		return &InsufficientFundsError{base}
	case enum.ResultUpstreamError:
		return &UpstreamError{base}
	case enum.ResultInternalError:
		return &InternalServerError{base}
	default:
		return base
	}
}
