// Package approute provides a Go SDK for the AppRoute Public API.
//
// The SDK wraps all REST endpoints exposed by the AppRoute data-plane gateway
// and returns strongly typed Go structs. Only the Go standard library is
// required; there are no third-party dependencies.
//
// # Sub-packages
//
//   - [github.com/approute/public-api-sdk-go/enum] -- typed string constants
//   - [github.com/approute/public-api-sdk-go/model] -- request / response structs
//   - [github.com/approute/public-api-sdk-go/apierror] -- error types
//   - [github.com/approute/public-api-sdk-go/resource] -- API resource types
package approute
