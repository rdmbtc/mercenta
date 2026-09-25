package approute_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/approute/public-api-sdk-go/model"
)

// ── Pointer helpers ──────────────────────────────────────────────

func strPtr(s string) *string       { return &s }
func intPtr(i int) *int             { return &i }
func floatPtr(f float64) *float64   { return &f }
func boolPtr(b bool) *bool          { return &b }
func timePtr(t time.Time) *time.Time { return &t }

// assertEqual is a test helper that fails the test if got != want.
func assertEqual[T comparable](tb testing.TB, fieldName string, got, want T) {
	tb.Helper()
	if got != want {
		tb.Errorf("%s: got %v, want %v", fieldName, got, want)
	}
}

// ── Envelope helpers ─────────────────────────────────────────────

// successEnvelope wraps data in the standard API success envelope and returns JSON bytes.
func successEnvelope(tb testing.TB, data any) []byte {
	tb.Helper()
	body := map[string]any{
		"status":  "ok",
		"code":    "OK",
		"message": "Success",
		"traceId": "t-test",
		"data":    data,
	}
	b, err := json.Marshal(body)
	if err != nil {
		tb.Fatal(err)
	}
	return b
}

// errorEnvelope builds a standard API error envelope and returns JSON bytes.
func errorEnvelope(tb testing.TB, code, message, traceID string) []byte {
	tb.Helper()
	body := map[string]any{
		"status":  "cancelled",
		"code":    code,
		"message": message,
		"traceId": traceID,
	}
	b, err := json.Marshal(body)
	if err != nil {
		tb.Fatal(err)
	}
	return b
}

// validationErrorEnvelope builds a validation error envelope with field errors.
func validationErrorEnvelope(tb testing.TB, code, message, traceID string, fieldErrors []model.FieldError) []byte {
	tb.Helper()
	body := map[string]any{
		"status":  "cancelled",
		"code":    code,
		"message": message,
		"traceId": traceID,
		"errors":  fieldErrors,
	}
	b, err := json.Marshal(body)
	if err != nil {
		tb.Fatal(err)
	}
	return b
}

// containsSubstring checks if s contains substr.
func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
