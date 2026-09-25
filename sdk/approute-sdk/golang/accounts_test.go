package approute_test

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	approute "github.com/approute/public-api-sdk-go"
	"github.com/approute/public-api-sdk-go/apierror"
	"github.com/approute/public-api-sdk-go/enum"
	"github.com/approute/public-api-sdk-go/model"
	"github.com/approute/public-api-sdk-go/resource"
)

func TestAccountsResource_Balances(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/accounts")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newAccountListResponse(
			newAccount(),
			newAccount(func(a *model.Account) {
				a.Currency = "EUR"
				a.Balance = 75.25
				a.Available = 75.25
				a.OverdraftLimit = 0
				a.RecentActivity = []model.AccountActivity{}
			}),
		)))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	result, err := client.Accounts.Balances(t.Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(result.Items) != 2 {
		t.Fatalf("expected 2 accounts, got %d", len(result.Items))
	}
	assertEqual(t, "Items[0].Currency", result.Items[0].Currency, "USD")
	assertEqual(t, "Items[0].Balance", result.Items[0].Balance, 150.50)
	assertEqual(t, "Items[0].Available", result.Items[0].Available, 120.00)
	assertEqual(t, "Items[1].Currency", result.Items[1].Currency, "EUR")

	// Verify recent activity
	if len(result.Items[0].RecentActivity) != 1 {
		t.Fatalf("expected 1 activity for USD account, got %d", len(result.Items[0].RecentActivity))
	}
	assertEqual(t, "RecentActivity[0].ID", result.Items[0].RecentActivity[0].ID, "act-1")
	assertEqual(t, "RecentActivity[0].Amount", result.Items[0].RecentActivity[0].Amount, -10.00)
}

func TestAccountsResource_Transactions(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/accounts/transactions")

		q := r.URL.Query()
		if q.Get("limit") == "" {
			t.Error("expected limit parameter")
		}
		if q.Get("offset") == "" {
			t.Error("expected offset parameter")
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newAccountTransactionPage()))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	result, err := client.Accounts.Transactions(t.Context(), nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "TotalCount", result.TotalCount, 1)
	if len(result.Items) != 1 {
		t.Fatalf("expected 1 transaction, got %d", len(result.Items))
	}
	assertEqual(t, "Items[0].ID", result.Items[0].ID, "txn-1")
	assertEqual(t, "Items[0].Category", string(result.Items[0].Category), "shop")
	assertEqual(t, "Items[0].Amount", result.Items[0].Amount, -10.00)
}

func TestAccountsResource_Transactions_WithOptions(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		assertEqual(t, "currency", q.Get("currency"), "USD")
		assertEqual(t, "category", q.Get("category"), "shop,funding")
		assertEqual(t, "search", q.Get("search"), "test-search")
		assertEqual(t, "limit", q.Get("limit"), "25")
		assertEqual(t, "offset", q.Get("offset"), "10")

		if q.Get("dateFrom") == "" {
			t.Error("expected dateFrom parameter")
		}
		if q.Get("dateTo") == "" {
			t.Error("expected dateTo parameter")
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newAccountTransactionPage()))
	}))
	defer srv.Close()

	from := time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)
	to := time.Date(2026, 3, 5, 0, 0, 0, 0, time.UTC)

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Accounts.Transactions(t.Context(), &resource.TransactionListOptions{
		Currency: "USD",
		Category: []enum.BalanceCategory{enum.BalanceShop, enum.BalanceFunding},
		Search:   "test-search",
		Limit:    25,
		Offset:   10,
		DateFrom: &from,
		DateTo:   &to,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestAccountsResource_Balances_Unauthorized(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(401)
		w.Header().Set("Content-Type", "application/json")
		w.Write(errorEnvelope(t, "UNAUTHORIZED", "Invalid API key", "t-acc-err-1"))
	}))
	defer srv.Close()

	client := approute.NewClient("bad-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Accounts.Balances(t.Context())
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	var unauth *apierror.UnauthorizedError
	if !errors.As(err, &unauth) {
		t.Fatalf("expected *UnauthorizedError, got %T: %v", err, err)
	}
	assertEqual(t, "Code", unauth.Code, "UNAUTHORIZED")
	assertEqual(t, "TraceID", unauth.TraceID, "t-acc-err-1")
}
