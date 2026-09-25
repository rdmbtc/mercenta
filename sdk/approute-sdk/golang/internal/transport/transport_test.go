package transport

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
)

func assertEqual[T comparable](t *testing.T, fieldName string, got, want T) {
	t.Helper()
	if got != want {
		t.Errorf("%s: got %v, want %v", fieldName, got, want)
	}
}

func TestTransport_SetsHeaders(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "X-API-Key", r.Header.Get("X-API-Key"), "test-key-123")
		assertEqual(t, "Accept", r.Header.Get("Accept"), "application/json")

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","code":"OK","message":"Success","traceId":"t-1","data":null}`))
	}))
	defer srv.Close()

	tr := New(srv.URL, "test-key-123", &http.Client{}, 0)
	_, err := tr.Request(context.Background(), "GET", "/test", nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestTransport_SetsContentTypeOnPOST(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Content-Type", r.Header.Get("Content-Type"), "application/json")
		assertEqual(t, "Method", r.Method, "POST")

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","code":"OK","message":"Success","traceId":"t-1","data":{}}`))
	}))
	defer srv.Close()

	tr := New(srv.URL, "key", &http.Client{}, 0)
	_, err := tr.Request(context.Background(), "POST", "/test", nil, map[string]string{"k": "v"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestTransport_RetriesOnServerError(t *testing.T) {
	var attempts int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n := atomic.AddInt32(&attempts, 1)
		if n <= 2 {
			w.WriteHeader(502)
			w.Write([]byte(`{"status":"cancelled","code":"INTERNAL_ERROR","message":"Bad gateway","traceId":"t-1"}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","code":"OK","message":"Success","traceId":"t-1","data":{"ok":true}}`))
	}))
	defer srv.Close()

	tr := New(srv.URL, "key", &http.Client{}, 3)
	raw, err := tr.Request(context.Background(), "GET", "/test", nil, nil)
	if err != nil {
		t.Fatalf("unexpected error after retries: %v", err)
	}

	var result map[string]bool
	if err := json.Unmarshal(raw, &result); err != nil {
		t.Fatalf("failed to unmarshal data: %v", err)
	}
	if !result["ok"] {
		t.Error("expected ok=true in response data")
	}
	if atomic.LoadInt32(&attempts) != 3 {
		t.Errorf("expected 3 attempts, got %d", atomic.LoadInt32(&attempts))
	}
}

func TestTransport_InvalidJSON(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte(`not json`))
	}))
	defer srv.Close()

	tr := New(srv.URL, "key", &http.Client{}, 0)
	_, err := tr.Request(context.Background(), "GET", "/test", nil, nil)
	if err == nil {
		t.Fatal("expected error for invalid JSON, got nil")
	}
}

func TestTransport_ContextCancellation(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(503)
		w.Write([]byte(`{"status":"cancelled","code":"INTERNAL_ERROR","message":"Unavailable","traceId":"t-1"}`))
	}))
	defer srv.Close()

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // cancel immediately

	tr := New(srv.URL, "key", &http.Client{}, 3)
	_, err := tr.Request(ctx, "GET", "/test", nil, nil)
	if err == nil {
		t.Fatal("expected error for cancelled context, got nil")
	}
}

func TestTransport_TrimsTrailingSlash(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "path", r.URL.Path, "/test")
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","code":"OK","message":"Success","traceId":"t-1","data":null}`))
	}))
	defer srv.Close()

	tr := New(srv.URL+"/", "key", &http.Client{}, 0)
	_, err := tr.Request(context.Background(), "GET", "/test", nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestTransport_AcceptedCode(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","code":"ACCEPTED","message":"Accepted","traceId":"t-1","data":{"queued":true}}`))
	}))
	defer srv.Close()

	tr := New(srv.URL, "key", &http.Client{}, 0)
	raw, err := tr.Request(context.Background(), "GET", "/test", nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var result map[string]bool
	if err := json.Unmarshal(raw, &result); err != nil {
		t.Fatalf("failed to unmarshal data: %v", err)
	}
	if !result["queued"] {
		t.Error("expected queued=true in response data")
	}
}

func TestTransport_IdempotencyReplayCode(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","code":"IDEMPOTENCY_REPLAY","message":"Replay","traceId":"t-1","data":{"replayed":true}}`))
	}))
	defer srv.Close()

	tr := New(srv.URL, "key", &http.Client{}, 0)
	raw, err := tr.Request(context.Background(), "GET", "/test", nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var result map[string]bool
	if err := json.Unmarshal(raw, &result); err != nil {
		t.Fatalf("failed to unmarshal data: %v", err)
	}
	if !result["replayed"] {
		t.Error("expected replayed=true in response data")
	}
}
