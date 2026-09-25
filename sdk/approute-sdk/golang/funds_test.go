package approute_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	approute "github.com/approute/public-api-sdk-go"
	"github.com/approute/public-api-sdk-go/apierror"
	"github.com/approute/public-api-sdk-go/enum"
	"github.com/approute/public-api-sdk-go/model"
	"github.com/approute/public-api-sdk-go/resource"
)

func TestFundsResource_Methods(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/funds/methods")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newFundingMethodsResponse(
			newFundingMethod(),
			newFundingMethod(func(m *model.FundingMethod) {
				m.Code = enum.FundingUSDT_TON
				m.Name = "USDT (TON)"
				m.MinAmount = 5.00
				m.Address = "UQAbc...xyz"
				m.TTLMinutes = 30
				m.ConfirmationsRequired = 1
			}),
		)))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	result, err := client.Funds.Methods(t.Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(result.Items) != 2 {
		t.Fatalf("expected 2 methods, got %d", len(result.Items))
	}
	assertEqual(t, "Items[0].Code", string(result.Items[0].Code), "USDT_TRC20")
	assertEqual(t, "Items[0].Name", result.Items[0].Name, "USDT (TRC-20)")
	assertEqual(t, "Items[0].MinAmount", result.Items[0].MinAmount, 10.00)
	assertEqual(t, "Items[1].Code", string(result.Items[1].Code), "USDT_TON")
}

func TestFundsResource_CreateInvoice(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "POST")
		assertEqual(t, "Path", r.URL.Path, "/funds/invoices")

		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatalf("failed to decode request body: %v", err)
		}
		if body["methodCode"] != "USDT_TRC20" {
			t.Errorf("expected methodCode=USDT_TRC20, got %v", body["methodCode"])
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newFundingInvoice()))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	invoice, err := client.Funds.CreateInvoice(t.Context(), &model.FundingInvoiceCreateRequest{
		MethodCode: enum.FundingUSDT_TRC20,
		Amount:     50.00,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "ID", invoice.ID, "inv-001")
	assertEqual(t, "MethodCode", string(invoice.MethodCode), "USDT_TRC20")
	assertEqual(t, "AmountExpected", invoice.AmountExpected, 50.00)
	assertEqual(t, "Status", string(invoice.Status), "pending")
}

func TestFundsResource_ListInvoices(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/funds/invoices")

		q := r.URL.Query()
		if q.Get("limit") == "" {
			t.Error("expected limit parameter")
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newFundingInvoiceList(
			newFundingInvoice(func(inv *model.FundingInvoice) {
				inv.ConfirmationsRequired = nil
				inv.Confirmations = nil
			}),
		)))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	result, err := client.Funds.ListInvoices(t.Context(), nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "Total", result.Total, 1)
	if len(result.Items) != 1 {
		t.Fatalf("expected 1 invoice, got %d", len(result.Items))
	}
	assertEqual(t, "Items[0].ID", result.Items[0].ID, "inv-001")
}

func TestFundsResource_ListInvoices_WithOptions(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		assertEqual(t, "status", q.Get("status"), "pending,success")
		assertEqual(t, "methodCode", q.Get("methodCode"), "USDT_TRC20")
		assertEqual(t, "limit", q.Get("limit"), "10")

		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newFundingInvoiceList(
			newFundingInvoice(func(inv *model.FundingInvoice) {
				inv.ConfirmationsRequired = nil
				inv.Confirmations = nil
			}),
		)))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Funds.ListInvoices(t.Context(), &resource.InvoiceListOptions{
		Status:     []enum.FundingStatus{enum.FundingPending, enum.FundingSuccess},
		MethodCode: []enum.FundingMethodCode{enum.FundingUSDT_TRC20},
		Limit:      10,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestFundsResource_GetInvoice(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/funds/invoices/inv-001")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newFundingInvoice(func(inv *model.FundingInvoice) {
			inv.Credited = 50.00
			inv.TxHash = strPtr("0xabc123")
			inv.Status = enum.FundingSuccess
			inv.ConfirmationsRequired = intPtr(20)
			inv.Confirmations = intPtr(20)
		})))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	invoice, err := client.Funds.GetInvoice(t.Context(), "inv-001")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "ID", invoice.ID, "inv-001")
	assertEqual(t, "Status", string(invoice.Status), "success")
	assertEqual(t, "Credited", invoice.Credited, 50.00)
	if invoice.TxHash == nil {
		t.Fatal("TxHash should not be nil")
	}
	assertEqual(t, "TxHash", *invoice.TxHash, "0xabc123")
}

func TestFundsResource_CheckInvoice(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "POST")
		assertEqual(t, "Path", r.URL.Path, "/funds/invoices/inv-001/check")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newFundingInvoice(func(inv *model.FundingInvoice) {
			inv.Status = enum.FundingConfirming
			inv.ConfirmationsRequired = intPtr(20)
			inv.Confirmations = intPtr(5)
		})))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	invoice, err := client.Funds.CheckInvoice(t.Context(), "inv-001")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "Status", string(invoice.Status), "confirming")
	if invoice.Confirmations == nil {
		t.Fatal("Confirmations should not be nil")
	}
	assertEqual(t, "Confirmations", *invoice.Confirmations, 5)
}

func TestFundsResource_InvoiceTimeLeft(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/funds/invoices/inv-001/time-left")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newFundingInvoiceTimeLeft()))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	result, err := client.Funds.InvoiceTimeLeft(t.Context(), "inv-001")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "InvoiceID", result.InvoiceID, "inv-001")
	assertEqual(t, "SecondsLeft", result.SecondsLeft, 1800)
	assertEqual(t, "Expired", result.Expired, false)
}

func TestFundsResource_TonDeposit(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/funds/ton/deposit")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newTonDepositState()))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	result, err := client.Funds.TonDeposit(t.Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "Address", result.Address, "UQAbc...xyz")
	assertEqual(t, "MemoTag", result.MemoTag, "12345")
}

func TestFundsResource_BybitState(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/funds/bybit/state")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newBybitState()))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	result, err := client.Funds.BybitState(t.Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "RecipientUID", result.RecipientUID, "bybit-uid-001")
	assertEqual(t, "Linked", result.Linked, true)
	if result.YourUID == nil {
		t.Fatal("YourUID should not be nil")
	}
	assertEqual(t, "YourUID", *result.YourUID, "my-uid-001")
}

func TestFundsResource_BybitAttach(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "POST")
		assertEqual(t, "Path", r.URL.Path, "/funds/bybit/attach")

		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatalf("failed to decode request body: %v", err)
		}
		if body["uid"] != "new-uid-002" {
			t.Errorf("expected uid=new-uid-002, got %v", body["uid"])
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newBybitState(func(s *model.BybitState) {
			s.YourUID = strPtr("new-uid-002")
		})))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	result, err := client.Funds.BybitAttach(t.Context(), "new-uid-002")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "Linked", result.Linked, true)
	if result.YourUID == nil {
		t.Fatal("YourUID should not be nil")
	}
	assertEqual(t, "YourUID", *result.YourUID, "new-uid-002")
}

func TestFundsResource_BybitUnlink(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "POST")
		assertEqual(t, "Path", r.URL.Path, "/funds/bybit/unlink")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newBybitState(func(s *model.BybitState) {
			s.Linked = false
			s.YourUID = nil
		})))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	result, err := client.Funds.BybitUnlink(t.Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "Linked", result.Linked, false)
	if result.YourUID != nil {
		t.Error("YourUID should be nil after unlink")
	}
}

func TestFundsResource_GetInvoice_NotFound(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
		w.Header().Set("Content-Type", "application/json")
		w.Write(errorEnvelope(t, "NOT_FOUND", "Invoice not found", "t-fund-err-1"))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Funds.GetInvoice(t.Context(), "nonexistent")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	var nf *apierror.NotFoundError
	if !errors.As(err, &nf) {
		t.Fatalf("expected *NotFoundError, got %T: %v", err, err)
	}
	assertEqual(t, "Code", nf.Code, "NOT_FOUND")
}
