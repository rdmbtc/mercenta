package resource

import (
	"context"
	"errors"
	"fmt"

	"github.com/approute/public-api-sdk-go/model"
)

// MaxLookupItems is the hard cap on the number of (serviceId, itemId) pairs
// that ServicesResource.LookupItems will accept in a single call. Matches
// the backend's max_length=100 on ItemLookupRequest.items; enforced
// client-side too so callers get a fail-fast error rather than a server
// 422 round-trip.
const MaxLookupItems = 100

// ServicesResource provides access to the product/service catalog endpoints.
type ServicesResource struct {
	t Transport
}

// NewServices creates a new ServicesResource using the given transport.
func NewServices(t Transport) *ServicesResource {
	return &ServicesResource{t: t}
}

// List returns all products in the catalog.
func (r *ServicesResource) List(ctx context.Context) (*model.ProductListResponse, error) {
	raw, err := r.t.Request(ctx, "GET", "/services", nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.ProductListResponse](raw, "ProductListResponse")
}

// Get retrieves a single product by its ID.
func (r *ServicesResource) Get(ctx context.Context, productID string) (*model.Product, error) {
	raw, err := r.t.Request(ctx, "GET", "/services/"+productID, nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.Product](raw, "Product")
}

// Stock returns the current stock levels for a product.
func (r *ServicesResource) Stock(ctx context.Context, productID string) (*model.ProductStockResponse, error) {
	raw, err := r.t.Request(ctx, "GET", "/services/"+productID+"/stock", nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.ProductStockResponse](raw, "ProductStockResponse")
}

// GetItem returns a single denomination/item from a service by id.
//
// Calls GET /services/{serviceID}/items/{itemID} and returns the same
// model.ProductItem shape that appears inside the items slice of
// GET /services/{serviceID}.
func (r *ServicesResource) GetItem(ctx context.Context, serviceID, itemID string) (*model.ProductItem, error) {
	raw, err := r.t.Request(ctx, "GET", "/services/"+serviceID+"/items/"+itemID, nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.ProductItem](raw, "ProductItem")
}

// LookupItems resolves up to MaxLookupItems (serviceId, itemId) pairs in
// one round-trip. The response items are in the same order as the input —
// callers can iterate request and response by index without re-keying.
//
// Returns an error before any HTTP call is made when items is empty or has
// more than MaxLookupItems entries.
func (r *ServicesResource) LookupItems(ctx context.Context, items []model.ItemLookupRequestItem) (*model.ItemLookupResponse, error) {
	if len(items) == 0 {
		return nil, errors.New("approute: items must not be empty")
	}
	if len(items) > MaxLookupItems {
		return nil, fmt.Errorf("approute: items must contain at most %d entries", MaxLookupItems)
	}
	body := model.ItemLookupRequest{Items: items}
	raw, err := r.t.Request(ctx, "POST", "/services/items/lookup", nil, body)
	if err != nil {
		return nil, err
	}
	return decode[model.ItemLookupResponse](raw, "ItemLookupResponse")
}
