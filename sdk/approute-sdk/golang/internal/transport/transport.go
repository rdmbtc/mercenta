package transport

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/approute/public-api-sdk-go/apierror"
	"github.com/approute/public-api-sdk-go/enum"
	"github.com/approute/public-api-sdk-go/model"
)

// successCodes are the result codes that indicate a successful API response.
var successCodes = map[enum.ResultCode]struct{}{
	enum.ResultOK:                {},
	enum.ResultAccepted:          {},
	enum.ResultIdempotencyReplay: {},
}

// retryableStatusCodes are HTTP status codes eligible for automatic retry.
var retryableStatusCodes = map[int]struct{}{
	429: {},
	500: {},
	502: {},
	503: {},
	504: {},
}

const (
	backoffBase = 1.0 // seconds
)

// HttpTransport handles low-level HTTP communication with the API.
type HttpTransport struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
	maxRetries int
}

// New creates a configured HttpTransport.
func New(baseURL, apiKey string, httpClient *http.Client, maxRetries int) *HttpTransport {
	return &HttpTransport{
		baseURL:    strings.TrimRight(baseURL, "/"),
		apiKey:     apiKey,
		httpClient: httpClient,
		maxRetries: maxRetries,
	}
}

// Request executes an HTTP request against the API, handling retries and
// envelope unwrapping. On success it returns the raw JSON from the "data"
// field; on error it returns a typed *apierror.ApiError (or sub-type).
func (t *HttpTransport) Request(ctx context.Context, method, path string, params url.Values, body any) (json.RawMessage, error) {
	fullURL := t.baseURL + path
	if len(params) > 0 {
		fullURL += "?" + params.Encode()
	}

	var bodyReader io.Reader
	var bodyBytes []byte
	if body != nil {
		var err error
		bodyBytes, err = json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("approute: failed to marshal request body: %w", err)
		}
	}

	var lastErr error
	for attempt := 0; attempt <= t.maxRetries; attempt++ {
		if bodyBytes != nil {
			bodyReader = bytes.NewReader(bodyBytes)
		}

		req, err := http.NewRequestWithContext(ctx, method, fullURL, bodyReader)
		if err != nil {
			return nil, fmt.Errorf("approute: failed to create request: %w", err)
		}

		req.Header.Set("X-API-Key", t.apiKey)
		req.Header.Set("Accept", "application/json")
		if body != nil {
			req.Header.Set("Content-Type", "application/json")
		}

		resp, err := t.httpClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("approute: request failed: %w", err)
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return nil, fmt.Errorf("approute: failed to read response body: %w", err)
		}

		// Retry on retryable status codes (except on last attempt).
		if _, ok := retryableStatusCodes[resp.StatusCode]; ok && attempt < t.maxRetries {
			delay := t.retryDelay(resp, attempt)
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(delay):
				continue
			}
		}

		return t.handleResponse(resp.StatusCode, respBody)
	}

	if lastErr != nil {
		return nil, lastErr
	}
	return nil, fmt.Errorf("approute: max retries exceeded")
}

// handleResponse parses the envelope and either returns data or an error.
func (t *HttpTransport) handleResponse(statusCode int, body []byte) (json.RawMessage, error) {
	var env model.Envelope
	if err := json.Unmarshal(body, &env); err != nil {
		return nil, fmt.Errorf("approute: invalid JSON response (HTTP %d): %w", statusCode, err)
	}

	code := enum.ResultCode(env.Code)
	if _, ok := successCodes[code]; ok {
		return env.Data, nil
	}

	return nil, apierror.RaiseForCode(env.Code, env.Message, env.TraceID, statusCode, env.Errors)
}

// retryDelay computes the backoff duration for a given attempt, respecting
// the Retry-After header when present.
func (t *HttpTransport) retryDelay(resp *http.Response, attempt int) time.Duration {
	if ra := resp.Header.Get("Retry-After"); ra != "" {
		if secs, err := strconv.ParseFloat(ra, 64); err == nil {
			return time.Duration(secs * float64(time.Second))
		}
	}
	secs := backoffBase * math.Pow(2, float64(attempt))
	return time.Duration(secs * float64(time.Second))
}
