package apierror

import (
	"errors"
	"testing"

	"github.com/approute/public-api-sdk-go/model"
)

func assertEqual[T comparable](t *testing.T, fieldName string, got, want T) {
	t.Helper()
	if got != want {
		t.Errorf("%s: got %v, want %v", fieldName, got, want)
	}
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func TestRaiseForCode_MapsAllKnownCodes(t *testing.T) {
	tests := []struct {
		code     string
		wantType any
		desc     string
	}{
		{"VALIDATION_ERROR", &ValidationError{}, "ValidationError"},
		{"UNAUTHORIZED", &UnauthorizedError{}, "UnauthorizedError"},
		{"FORBIDDEN", &ForbiddenError{}, "ForbiddenError"},
		{"NOT_FOUND", &NotFoundError{}, "NotFoundError"},
		{"CONFLICT", &ConflictError{}, "ConflictError"},
		{"LIMIT_REACHED", &RateLimitedError{}, "RateLimitedError"},
		{"OUT_OF_STOCK", &OutOfStockError{}, "OutOfStockError"},
		{"INSUFFICIENT_FUNDS", &InsufficientFundsError{}, "InsufficientFundsError"},
		{"UPSTREAM_ERROR", &UpstreamError{}, "UpstreamError"},
		{"INTERNAL_ERROR", &InternalServerError{}, "InternalServerError"},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			err := RaiseForCode(tt.code, "msg", "trace-1", 400, nil)
			if err == nil {
				t.Fatal("expected error, got nil")
			}

			// Verify it wraps ApiError
			var apiErr *ApiError
			if !errors.As(err, &apiErr) {
				t.Fatalf("expected error to wrap *ApiError, got %T", err)
			}
			assertEqual(t, "Code", apiErr.Code, tt.code)
			assertEqual(t, "Message", apiErr.Message, "msg")
			assertEqual(t, "TraceID", apiErr.TraceID, "trace-1")
		})
	}
}

func TestRaiseForCode_UnknownCodeReturnsBaseApiError(t *testing.T) {
	err := RaiseForCode("UNKNOWN_CODE", "something broke", "trace-2", 500, nil)

	var apiErr *ApiError
	if !errors.As(err, &apiErr) {
		t.Fatalf("expected *ApiError, got %T", err)
	}
	assertEqual(t, "Code", apiErr.Code, "UNKNOWN_CODE")

	// Should NOT be a sub-type
	var notFound *NotFoundError
	if errors.As(err, &notFound) {
		t.Error("should not match NotFoundError for unknown code")
	}
}

func TestRaiseForCode_WithFieldErrors(t *testing.T) {
	fieldErrs := []model.FieldError{
		{Field: "email", Code: "required", Message: "email is required"},
		{Field: "name", Code: "too_short", Message: "name is too short"},
	}

	err := RaiseForCode("VALIDATION_ERROR", "Validation failed", "trace-3", 422, fieldErrs)

	var valErr *ValidationError
	if !errors.As(err, &valErr) {
		t.Fatalf("expected *ValidationError, got %T", err)
	}

	if len(valErr.Errors) != 2 {
		t.Fatalf("expected 2 field errors, got %d", len(valErr.Errors))
	}
	assertEqual(t, "Errors[0].Field", valErr.Errors[0].Field, "email")
	assertEqual(t, "Errors[1].Field", valErr.Errors[1].Field, "name")
}

func TestApiError_ErrorString(t *testing.T) {
	err := &ApiError{
		Code:       "NOT_FOUND",
		Message:    "Resource not found",
		TraceID:    "trace-4",
		StatusCode: 404,
	}

	s := err.Error()
	if s == "" {
		t.Fatal("error string should not be empty")
	}
	// Verify it contains important parts
	for _, sub := range []string{"NOT_FOUND", "Resource not found", "trace-4", "404"} {
		if !containsSubstring(s, sub) {
			t.Errorf("error string %q should contain %q", s, sub)
		}
	}
}

func TestApiError_ErrorStringWithFieldErrors(t *testing.T) {
	err := &ApiError{
		Code:       "VALIDATION_ERROR",
		Message:    "Bad input",
		TraceID:    "trace-5",
		StatusCode: 422,
		Errors: []model.FieldError{
			{Field: "amount", Code: "min", Message: "must be positive"},
		},
	}

	s := err.Error()
	if !containsSubstring(s, "amount") {
		t.Errorf("error string should contain field name 'amount': %s", s)
	}
}

func TestErrorsAs_SubTypesToApiError(t *testing.T) {
	err := RaiseForCode("NOT_FOUND", "gone", "trace-6", 404, nil)

	// errors.As should match both *NotFoundError and *ApiError
	var nf *NotFoundError
	if !errors.As(err, &nf) {
		t.Error("expected to match *NotFoundError")
	}

	var apiErr *ApiError
	if !errors.As(err, &apiErr) {
		t.Error("expected to match *ApiError via embedding")
	}
}
