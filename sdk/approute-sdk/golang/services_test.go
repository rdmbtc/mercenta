package approute_test

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	approute "github.com/approute/public-api-sdk-go"
	"github.com/approute/public-api-sdk-go/apierror"
	"github.com/approute/public-api-sdk-go/enum"
	"github.com/approute/public-api-sdk-go/model"
)

func TestServicesResource_List(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/services")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newProductListResponse(
			newProduct(),
			newProduct(func(p *model.Product) {
				p.ID = "prod-2"
				p.Name = strPtr("Mobile Top-Up")
				p.Type = enum.ProductDirectTopup
				p.ImageURL = nil
				p.CountryCode = strPtr("TR")
				p.CategoryName = strPtr("Mobile")
				p.SubcategoryName = nil
				p.Items = []model.ProductItem{
					newProductItem(func(pi *model.ProductItem) {
						pi.ID = "item-2"
						pi.Name = nil
						pi.Nominal = 50.00
						pi.Price = 5.00
						pi.Stock = nil
					}),
				}
				p.Fields = []model.ProductField{newProductField()}
			}),
		)))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	result, err := client.Services.List(t.Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(result.Items) != 2 {
		t.Fatalf("expected 2 products, got %d", len(result.Items))
	}
	assertEqual(t, "Items[0].ID", result.Items[0].ID, "prod-1")
	assertEqual(t, "Items[0].Type", string(result.Items[0].Type), "voucher")
	assertEqual(t, "Items[1].ID", result.Items[1].ID, "prod-2")
	assertEqual(t, "Items[1].Type", string(result.Items[1].Type), "direct_topup")
	assertEqual(t, "HasNext", result.HasNext, false)

	// Verify nested items
	if len(result.Items[0].Items) != 1 {
		t.Fatalf("expected 1 item in product 0, got %d", len(result.Items[0].Items))
	}
	assertEqual(t, "Items[0].Items[0].ID", result.Items[0].Items[0].ID, "item-1")
	assertEqual(t, "Items[0].Items[0].Price", result.Items[0].Items[0].Price, 10.50)
	assertEqual(t, "Items[0].Items[0].Available", result.Items[0].Items[0].Available, true)

	// Verify fields on product 2
	if len(result.Items[1].Fields) != 1 {
		t.Fatalf("expected 1 field in product 1, got %d", len(result.Items[1].Fields))
	}
	assertEqual(t, "Items[1].Fields[0].Key", result.Items[1].Fields[0].Key, "phone")
	assertEqual(t, "Items[1].Fields[0].Required", result.Items[1].Fields[0].Required, true)
}

func TestServicesResource_Get(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/services/prod-1")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newProduct()))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	product, err := client.Services.Get(t.Context(), "prod-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "ID", product.ID, "prod-1")
	if product.Name == nil {
		t.Fatal("Name should not be nil")
	}
	assertEqual(t, "Name", *product.Name, "Steam Wallet 10 USD")
	assertEqual(t, "Type", string(product.Type), "voucher")
}

func TestServicesResource_Stock(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/services/prod-1/stock")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newProductStockResponse(
			newProductStockItem(),
			newProductStockItem(func(s *model.ProductStockItem) {
				s.ItemID = "item-2"
				s.Stock = nil
			}),
		)))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	stock, err := client.Services.Stock(t.Context(), "prod-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "ProductID", stock.ProductID, "prod-1")
	if len(stock.Items) != 2 {
		t.Fatalf("expected 2 stock items, got %d", len(stock.Items))
	}
	assertEqual(t, "Items[0].ItemID", stock.Items[0].ItemID, "item-1")
	if stock.Items[0].Stock == nil {
		t.Fatal("Items[0].Stock should not be nil")
	}
	assertEqual(t, "Items[0].Stock", *stock.Items[0].Stock, 100)
	if stock.Items[1].Stock != nil {
		t.Error("Items[1].Stock should be nil")
	}
}

func TestServicesResource_Get_NotFound(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
		w.Header().Set("Content-Type", "application/json")
		w.Write(errorEnvelope(t, "NOT_FOUND", "Product not found", "t-prod-err-1"))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Services.Get(t.Context(), "nonexistent")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	var nf *apierror.NotFoundError
	if !errors.As(err, &nf) {
		t.Fatalf("expected *NotFoundError, got %T: %v", err, err)
	}
	assertEqual(t, "Code", nf.Code, "NOT_FOUND")
	assertEqual(t, "TraceID", nf.TraceID, "t-prod-err-1")
}

func TestServicesResource_GetItem(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "GET")
		assertEqual(t, "Path", r.URL.Path, "/services/svc-1/items/item-1")
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newProductItem(func(pi *model.ProductItem) {
			pi.ID = "item-1"
			pi.Price = 12.34
		})))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	item, err := client.Services.GetItem(t.Context(), "svc-1", "item-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertEqual(t, "ID", item.ID, "item-1")
	assertEqual(t, "Price", item.Price, 12.34)
}

func TestServicesResource_GetItem_NotFound(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
		w.Header().Set("Content-Type", "application/json")
		w.Write(errorEnvelope(t, "NOT_FOUND", "Item not found", "t-item-err-1"))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Services.GetItem(t.Context(), "svc-1", "missing")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	var nf *apierror.NotFoundError
	if !errors.As(err, &nf) {
		t.Fatalf("expected *NotFoundError, got %T: %v", err, err)
	}
	assertEqual(t, "Code", nf.Code, "NOT_FOUND")
}

func TestServicesResource_LookupItems_HappyPath(t *testing.T) {
	var capturedBody model.ItemLookupRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assertEqual(t, "Method", r.Method, "POST")
		assertEqual(t, "Path", r.URL.Path, "/services/items/lookup")
		raw, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("read body: %v", err)
		}
		if err := json.Unmarshal(raw, &capturedBody); err != nil {
			t.Fatalf("decode body: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newItemLookupResponse()))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	resp, err := client.Services.LookupItems(t.Context(), []model.ItemLookupRequestItem{
		{ServiceID: "svc-1", ItemID: "item-1"},
		{ServiceID: "svc-2", ItemID: "item-9"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify request body shape — JSON keys must be camelCase on the wire.
	if len(capturedBody.Items) != 2 {
		t.Fatalf("expected 2 items in body, got %d", len(capturedBody.Items))
	}
	assertEqual(t, "Body[0].ServiceID", capturedBody.Items[0].ServiceID, "svc-1")
	assertEqual(t, "Body[0].ItemID", capturedBody.Items[0].ItemID, "item-1")
	assertEqual(t, "Body[1].ServiceID", capturedBody.Items[1].ServiceID, "svc-2")
	assertEqual(t, "Body[1].ItemID", capturedBody.Items[1].ItemID, "item-9")

	// Mixed-outcome default fixture: 1 hit, 1 service_not_found, 1 item_not_found.
	if len(resp.Items) != 3 {
		t.Fatalf("expected 3 rows, got %d", len(resp.Items))
	}
	// Row 0 — hit
	assertEqual(t, "Items[0].Found", resp.Items[0].Found, true)
	if resp.Items[0].Item == nil {
		t.Fatal("Items[0].Item should not be nil for a hit row")
	}
	assertEqual(t, "Items[0].Error", resp.Items[0].Error, "")
	// Row 1 — service_not_found
	assertEqual(t, "Items[1].Found", resp.Items[1].Found, false)
	if resp.Items[1].Item != nil {
		t.Error("Items[1].Item should be nil for a miss row")
	}
	assertEqual(t, "Items[1].Error", resp.Items[1].Error, "service_not_found")
	// Row 2 — item_not_found
	assertEqual(t, "Items[2].Found", resp.Items[2].Found, false)
	if resp.Items[2].Item != nil {
		t.Error("Items[2].Item should be nil for a miss row")
	}
	assertEqual(t, "Items[2].Error", resp.Items[2].Error, "item_not_found")
}

func TestServicesResource_LookupItems_PreservesInputOrder(t *testing.T) {
	// Backend contract: response items are in the same order as the request
	// items. Verify the SDK surfaces that ordering verbatim.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(successEnvelope(t, newItemLookupResponse(
			newItemLookupRow(func(row *model.ItemLookupRow) {
				row.ServiceID = "svc-A"
				row.ItemID = "item-X"
			}),
			newItemLookupRow(func(row *model.ItemLookupRow) {
				row.ServiceID = "svc-B"
				row.ItemID = "item-Y"
			}),
			newItemLookupRow(func(row *model.ItemLookupRow) {
				row.ServiceID = "svc-C"
				row.ItemID = "item-Z"
			}),
		)))
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	resp, err := client.Services.LookupItems(t.Context(), []model.ItemLookupRequestItem{
		{ServiceID: "svc-A", ItemID: "item-X"},
		{ServiceID: "svc-B", ItemID: "item-Y"},
		{ServiceID: "svc-C", ItemID: "item-Z"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	want := [][2]string{
		{"svc-A", "item-X"},
		{"svc-B", "item-Y"},
		{"svc-C", "item-Z"},
	}
	for i, w := range want {
		assertEqual(t, "Items["+strconv.Itoa(i)+"].ServiceID", resp.Items[i].ServiceID, w[0])
		assertEqual(t, "Items["+strconv.Itoa(i)+"].ItemID", resp.Items[i].ItemID, w[1])
	}
}

func TestServicesResource_LookupItems_EmptyInputRejectedClientSide(t *testing.T) {
	// Server must not be hit when the input is empty — fail fast client-side.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Errorf("server should not have been called for empty input; got %s %s", r.Method, r.URL.Path)
	}))
	defer srv.Close()

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Services.LookupItems(t.Context(), nil)
	if err == nil {
		t.Fatal("expected error for empty input, got nil")
	}
	if !containsSubstring(err.Error(), "must not be empty") {
		t.Errorf("error message should mention emptiness; got: %v", err)
	}

	// Also verify the empty-slice (non-nil) case.
	_, err = client.Services.LookupItems(t.Context(), []model.ItemLookupRequestItem{})
	if err == nil {
		t.Fatal("expected error for empty slice, got nil")
	}
}

func TestServicesResource_LookupItems_OversizedInputRejectedClientSide(t *testing.T) {
	// Server must not be hit when the input exceeds the cap — fail fast.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Errorf("server should not have been called for oversized input; got %s %s", r.Method, r.URL.Path)
	}))
	defer srv.Close()

	tooMany := make([]model.ItemLookupRequestItem, 101)
	for i := range tooMany {
		tooMany[i] = model.ItemLookupRequestItem{ServiceID: "svc-1", ItemID: "item-" + strconv.Itoa(i)}
	}

	client := approute.NewClient("test-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	_, err := client.Services.LookupItems(t.Context(), tooMany)
	if err == nil {
		t.Fatal("expected error for oversized input, got nil")
	}
	if !containsSubstring(err.Error(), "at most 100") {
		t.Errorf("error message should mention the cap; got: %v", err)
	}
}

