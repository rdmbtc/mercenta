package approute

import (
	"net/http"
	"time"
)

// clientConfig holds values configurable via Option functions.
type clientConfig struct {
	baseURL    string
	timeout    time.Duration
	maxRetries int
	httpClient *http.Client
}

// Option is a functional option for configuring the Client.
type Option func(*clientConfig)

// WithBaseURL overrides the default API base URL.
func WithBaseURL(url string) Option {
	return func(c *clientConfig) { c.baseURL = url }
}

// WithTimeout sets the HTTP client timeout. Ignored when WithHTTPClient is
// used, because the caller-supplied client is expected to carry its own
// timeout configuration.
func WithTimeout(d time.Duration) Option {
	return func(c *clientConfig) { c.timeout = d }
}

// WithMaxRetries sets the maximum number of automatic retries on 429/5xx
// responses. The default is 3.
func WithMaxRetries(n int) Option {
	return func(c *clientConfig) { c.maxRetries = n }
}

// WithHTTPClient supplies a fully configured *http.Client. When provided, the
// WithTimeout option is ignored.
func WithHTTPClient(c *http.Client) Option {
	return func(cfg *clientConfig) { cfg.httpClient = c }
}
