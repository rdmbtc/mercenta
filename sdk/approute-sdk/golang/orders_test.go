package approute_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	approute "github.com/approute/public-api-sdk-go"
	"github.com/approute/public-api-sdk-go/apierror"
	"github.com/approute/public-api-sdk-go/model"
	"github.com/approute/public-api-sdk-go/resource"
)

func TestOrdersResource_Create(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "POST")
		assertEqual(t, "Path", r.URL.Path, "/orders")
		assertEqual(t, "Content-Type", r.Header.Get("Content-Type"), "application/json")

		// Verify request body was sent
		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatalf("failed to decode request body: %v", err)
		}
		if body["itemId"] != "item-1" {
			t.Errorf("expected itemId=item-1, got %v", body["itemId"])
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newPurchaseResponse()))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	resp, err := client.Orders.Create(t.Context(), &model.PurchaseRequest{
		ItemID:   "item-1",
		Quantity: 1,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "TransactionUUID", resp.TransactionUUID, "txn-uuid-abc")
	assertEqual(t, "Status", string(resp.Status), "completed")
	assertEqual(t, "Price", resp.Price, 10.50)
	assertEqual(t, "Currency", resp.Currency, "USD")

	if resp.Result == nil {
		t.Fatal("Result should not be nil")
	}
	if len(resp.Result.Vouchers) != 1 {
		t.Fatalf("expected 1 voucher, got %d", len(resp.Result.Vouchers))
	}
	assertEqual(t, "Voucher.Pin", resp.Result.Vouchers[0].Pin, "ABCD-EFGH-1234")
}

func TestOrdersResource_CheckDTU(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "POST")
		assertEqual(t, "Path", r.URL.Path, "/orders")

		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatalf("failed to decode request body: %v", err)
		}
		assertEqual(t, "ordersType", body["ordersType"].(string), "dtu")
		assertEqual(t, "checkOnly", body["checkOnly"].(bool), true)

		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newDtuCheckResponse()))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	resp, err := client.Orders.CheckDTU(t.Context(), &resource.DtuCheckRequest{
		ItemID: "item-2",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.CanRecharge == nil || !*resp.CanRecharge {
		t.Error("expected CanRecharge=true")
	}
	if resp.Price == nil || *resp.Price != 5.00 {
		t.Errorf("expected Price=5.00, got %v", resp.Price)
	}
}

func TestOrdersResource_List(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/orders")

		// Verify default pagination parameters
		q := r.URL.Query()
		if q.Get("limit") == "" {
			t.Error("expected limit query parameter")
		}
		if q.Get("offset") == "" {
			t.Error("expected offset query parameter")
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newTransactionListResponse(newTransactionListItem())))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	resp, err := client.Orders.List(t.Context(), nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(resp.Page.Items) != 1 {
		t.Fatalf("expected 1 order, got %d", len(resp.Page.Items))
	}
	assertEqual(t, "Page.Items[0].TransactionUUID", resp.Page.Items[0].TransactionUUID, "txn-uuid-abc")
	assertEqual(t, "Page.Items[0].Status", string(resp.Page.Items[0].Status), "completed")
	assertEqual(t, "Page.HasNext", resp.Page.HasNext, false)
}

func TestOrdersResource_List_WithOptions(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		assertEqual(t, "limit", q.Get("limit"), "10")
		assertEqual(t, "offset", q.Get("offset"), "20")
		assertEqual(t, "orderId", q.Get("orderId"), "ord-filter")
		assertEqual(t, "referenceId", q.Get("referenceId"), "ref-filter")

		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newTransactionListResponse(newTransactionListItem())))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Orders.List(t.Context(), &resource.OrderListOptions{
		Limit:       10,
		Offset:      20,
		OrderID:     "ord-filter",
		ReferenceID: "ref-filter",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestOrdersResource_Create_InsufficientFunds(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(402)
		w.Header().Set("Content-Type", "application/json")
		w.Write(errorEnvelope(t, "INSUFFICIENT_FUNDS", "Not enough balance", "t-ord-err-1"))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Orders.Create(t.Context(), &model.PurchaseRequest{
		ItemID:   "item-1",
		Quantity: 1,
	})
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	var insuf *apierror.InsufficientFundsError
	if !errors.As(err, &insuf) {
		t.Fatalf("expected *InsufficientFundsError, got %T: %v", err, err)
	}
	assertEqual(t, "Code", insuf.Code, "INSUFFICIENT_FUNDS")
}

func TestOrdersResource_Create_OutOfStock(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(409)
		w.Header().Set("Content-Type", "application/json")
		w.Write(errorEnvelope(t, "OUT_OF_STOCK", "Item is out of stock", "t-ord-err-2"))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Orders.Create(t.Context(), &model.PurchaseRequest{
		ItemID:   "item-1",
		Quantity: 999,
	})
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	var oos *apierror.OutOfStockError
	if !errors.As(err, &oos) {
		t.Fatalf("expected *OutOfStockError, got %T: %v", err, err)
	}
}

func TestOrdersResource_Create_ValidationError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(422)
		w.Header().Set("Content-Type", "application/json")
		w.Write(validationErrorEnvelope(t, "VALIDATION_ERROR", "Validation failed", "t-ord-err-3", []model.FieldError{
			{Field: "itemId", Code: "required", Message: "itemId is required"},
		}))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Orders.Create(t.Context(), &model.PurchaseRequest{})
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	var valErr *apierror.ValidationError
	if !errors.As(err, &valErr) {
		t.Fatalf("expected *ValidationError, got %T: %v", err, err)
	}
	if len(valErr.Errors) != 1 {
		t.Fatalf("expected 1 field error, got %d", len(valErr.Errors))
	}
	assertEqual(t, "Errors[0].Field", valErr.Errors[0].Field, "itemId")
}
