package approute_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	approute "github.com/approute/public-api-sdk-go"
	"github.com/approute/public-api-sdk-go/apierror"
	"github.com/approute/public-api-sdk-go/model"
)

func BenchmarkNewClient(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = approute.NewClient("sk_live_bench_key")
	}
}

func BenchmarkServicesList(b *testing.B) {
	resp := successEnvelope(b, newProductListResponse(
		newProduct(),
		newProduct(func(p *model.Product) {
			p.ID = "prod-2"
			p.Name = strPtr("Mobile Top-Up")
		}),
	))
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(resp)
	}))
	defer srv.Close()

	client := approute.NewClient("bench-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	ctx := context.Background()

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := client.Services.List(ctx)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkOrderCreate(b *testing.B) {
	resp := successEnvelope(b, newPurchaseResponse())
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(resp)
	}))
	defer srv.Close()

	client := approute.NewClient("bench-key", approute.WithBaseURL(srv.URL), approute.WithMaxRetries(0))
	ctx := context.Background()
	req := &model.PurchaseRequest{
		ItemID:   "item-1",
		Quantity: 1,
	}

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := client.Orders.Create(ctx, req)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkErrorFormatting(b *testing.B) {
	err := apierror.RaiseForCode(
		"VALIDATION_ERROR",
		"Validation failed",
		"trace-bench",
		422,
		[]model.FieldError{
			{Field: "email", Code: "required", Message: "email is required"},
			{Field: "name", Code: "too_short", Message: "name must be at least 2 characters"},
		},
	)

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = fmt.Sprintf("%v", err)
	}
}

func BenchmarkJSONDecode_ProductList(b *testing.B) {
	data := newProductListResponse(
		newProduct(),
		newProduct(func(p *model.Product) {
			p.ID = "prod-2"
			p.Name = strPtr("Another Product")
		}),
	)
	raw, err := json.Marshal(data)
	if err != nil {
		b.Fatal(err)
	}

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var out model.ProductListResponse
		if err := json.Unmarshal(raw, &out); err != nil {
			b.Fatal(err)
		}
	}
}
