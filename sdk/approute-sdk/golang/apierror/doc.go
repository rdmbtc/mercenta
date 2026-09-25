// Package apierror defines the error types returned by the AppRoute SDK when
// the API responds with a non-success result code.
//
// All errors embed [*ApiError] so callers can use [errors.As] to match either
// the specific sub-type (e.g. [*NotFoundError]) or the generic [*ApiError].
package apierror
