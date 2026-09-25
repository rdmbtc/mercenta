package approute_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	approute "github.com/approute/public-api-sdk-go"
)

func TestNewClient_DefaultFields(t *testing.T) {
	client := approute.NewClient("test-key")
	if client.Services == nil {
		t.Error("Services should not be nil")
	}
	if client.Orders == nil {
		t.Error("Orders should not be nil")
	}
	if client.Accounts == nil {
		t.Error("Accounts should not be nil")
	}
	if client.Funds == nil {
		t.Error("Funds should not be nil")
	}
	if client.SteamCurrency == nil {
		t.Error("SteamCurrency should not be nil")
	}
}

func TestNewClient_WithBaseURL(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","code":"OK","message":"Success","traceId":"t-1","data":{"items":[],"hasNext":false}}`))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL))
	_, err := client.Services.List(t.Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestNewClient_WithTimeout(t *testing.T) {
	// Just verify the option does not panic; the timeout is applied to the
	// internal http.Client which is not publicly accessible.
	client := approute.NewClient("test-key", approute.WithTimeout(5*time.Second))
	if client == nil {
		t.Fatal("client should not be nil")
	}
}

func TestNewClient_WithMaxRetries(t *testing.T) {
	client := approute.NewClient("test-key", approute.WithMaxRetries(10))
	if client == nil {
		t.Fatal("client should not be nil")
	}
}

func TestNewClient_WithHTTPClient(t *testing.T) {
	custom := &http.Client{Timeout: 1 * time.Second}
	client := approute.NewClient("test-key", approute.WithHTTPClient(custom))
	if client == nil {
		t.Fatal("client should not be nil")
	}
}

func TestNewClient_MultipleOptions(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "X-API-Key", r.Header.Get("X-API-Key"), "multi-key")
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","code":"OK","message":"Success","traceId":"t-1","data":{"items":[],"hasNext":false}}`))
	}))
	defer srv.Close()

	client := approute.NewClient("multi-key",
		approute.WithBaseURL(srv.URL),
		approute.WithTimeout(5*time.Second),
		approute.WithMaxRetries(1),
	)
	_, err := client.Services.List(t.Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
