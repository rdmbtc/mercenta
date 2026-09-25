package resource

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
)

// Transport is the interface that resource types use to execute HTTP requests.
// The internal/transport package provides the production implementation.
type Transport interface {
	Request(ctx context.Context, method, path string, params url.Values, body any) (json.RawMessage, error)
}

// decode is a generic helper that unmarshals a json.RawMessage into the
// specified type T. The typeName parameter is used in error messages.
func decode[T any](raw json.RawMessage, typeName string) (*T, error) {
	var out T
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("approute: failed to decode %s: %w", typeName, err)
	}
	return &out, nil
}
