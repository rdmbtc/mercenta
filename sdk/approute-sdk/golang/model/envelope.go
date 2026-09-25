package model

import "encoding/json"

// FieldError describes a single field-level validation problem returned by the API.
type FieldError struct {
	Field   string `json:"field"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Envelope is the JSON shape shared by every API response.
type Envelope struct {
	Status  string          `json:"status"`
	Code    string          `json:"code"`
	Message string          `json:"message"`
	TraceID string          `json:"traceId"`
	Data    json.RawMessage `json:"data"`
	Errors  []FieldError    `json:"errors,omitempty"`
}
