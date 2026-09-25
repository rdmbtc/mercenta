package enum

// FieldErrorCode represents a machine-readable validation error code
// returned in the "errors[].code" field of an API response.
type FieldErrorCode string

const (
	FieldErrorMissing       FieldErrorCode = "MISSING"
	FieldErrorOutOfRange    FieldErrorCode = "OUT_OF_RANGE"
	FieldErrorInvalidFormat FieldErrorCode = "INVALID_FORMAT"
	FieldErrorInvalidValue  FieldErrorCode = "INVALID_VALUE"
	FieldErrorNotAllowed    FieldErrorCode = "NOT_ALLOWED"
	FieldErrorTooLong       FieldErrorCode = "TOO_LONG"
	FieldErrorTooShort      FieldErrorCode = "TOO_SHORT"
)
