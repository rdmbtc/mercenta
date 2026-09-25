package enum

// ResultCode represents the result code returned in every API envelope.
type ResultCode string

const (
	ResultOK                ResultCode = "OK"
	ResultAccepted          ResultCode = "ACCEPTED"
	ResultIdempotencyReplay ResultCode = "IDEMPOTENCY_REPLAY"
	ResultValidationError   ResultCode = "VALIDATION_ERROR"
	ResultUnauthorized      ResultCode = "UNAUTHORIZED"
	ResultForbidden         ResultCode = "FORBIDDEN"
	ResultNotFound          ResultCode = "NOT_FOUND"
	ResultConflict          ResultCode = "CONFLICT"
	ResultLimitReached      ResultCode = "LIMIT_REACHED"
	ResultOutOfStock        ResultCode = "OUT_OF_STOCK"
	ResultInsufficientFunds ResultCode = "INSUFFICIENT_FUNDS"
	ResultUpstreamError     ResultCode = "UPSTREAM_ERROR"
	ResultInternalError     ResultCode = "INTERNAL_ERROR"
)
