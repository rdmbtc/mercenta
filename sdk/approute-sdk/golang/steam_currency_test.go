package approute_test

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	approute "github.com/approute/public-api-sdk-go"
	"github.com/approute/public-api-sdk-go/apierror"
	"github.com/approute/public-api-sdk-go/model"
	"github.com/approute/public-api-sdk-go/resource"
)

func TestSteamCurrencyResource_Rates(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/steam-currency/rates")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newSteamCurrencyRatesResponse(
			newSteamCurrencyRate(),
			newSteamCurrencyRate(func(r *model.SteamCurrencyRate) {
				r.QuoteCurrencyCode = "TRY"
				r.Rate = "38.20"
			}),
		)))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	result, err := client.SteamCurrency.Rates(t.Context(), nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "BaseCurrencyCode", result.BaseCurrencyCode, "USD")
	if len(result.Items) != 2 {
		t.Fatalf("expected 2 rates, got %d", len(result.Items))
	}
	assertEqual(t, "Items[0].QuoteCurrencyCode", result.Items[0].QuoteCurrencyCode, "KZT")
	assertEqual(t, "Items[0].Rate", result.Items[0].Rate, "475.50")
	assertEqual(t, "Items[1].QuoteCurrencyCode", result.Items[1].QuoteCurrencyCode, "TRY")
	assertEqual(t, "Items[1].Rate", result.Items[1].Rate, "38.20")

	// Verify timestamps were parsed
	if result.Items[0].ProviderCreatedAt == nil {
		t.Error("ProviderCreatedAt should not be nil")
	}
	if result.Items[0].FetchedAt == nil {
		t.Error("FetchedAt should not be nil")
	}
}

func TestSteamCurrencyResource_Rates_WithQuotes(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		assertEqual(t, "quotes", q.Get("quotes"), "KZT,TRY")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newSteamCurrencyRatesResponse(
			newSteamCurrencyRate(),
			newSteamCurrencyRate(func(r *model.SteamCurrencyRate) {
				r.QuoteCurrencyCode = "TRY"
				r.Rate = "38.20"
			}),
		)))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.SteamCurrency.Rates(t.Context(), &resource.RatesOptions{
		Quotes: []string{"KZT", "TRY"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestSteamCurrencyResource_Rates_Forbidden(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(403)
		w.Header().Set("Content-Type", "application/json")
		w.Write(errorEnvelope(t, "FORBIDDEN", "Access denied", "t-steam-err-1"))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.SteamCurrency.Rates(t.Context(), nil)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	var forbidden *apierror.ForbiddenError
	if !errors.As(err, &forbidden) {
		t.Fatalf("expected *ForbiddenError, got %T: %v", err, err)
	}
	assertEqual(t, "Code", forbidden.Code, "FORBIDDEN")
	assertEqual(t, "TraceID", forbidden.TraceID, "t-steam-err-1")
}
