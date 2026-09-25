package model

import "github.com/approute/public-api-sdk-go/enum"

// ProductFieldOption describes one selectable value within a product field.
type ProductFieldOption struct {
	Label string   `json:"label"`
	Value string   `json:"value"`
	Price *float64 `json:"price,omitempty"`
}

// ProductFieldValidation contains optional constraints for a product field.
type ProductFieldValidation struct {
	Min     *float64 `json:"min,omitempty"`
	Max     *float64 `json:"max,omitempty"`
	Pattern *string  `json:"pattern,omitempty"`
	Message *string  `json:"message,omitempty"`
}

// ProductField describes a single input field required to purchase a product.
type ProductField struct {
	Key        string                  `json:"key"`
	Type       string                  `json:"type"`
	Required   bool                    `json:"required"`
	Label      *string                 `json:"label,omitempty"`
	Options    []ProductFieldOption    `json:"options,omitempty"`
	Validation *ProductFieldValidation `json:"validation,omitempty"`
}

// ProductItem represents a purchasable denomination/variant of a product.
type ProductItem struct {
	ID                string  `json:"id"`
	Name              *string `json:"name,omitempty"`
	Nominal           float64 `json:"nominal"`
	Price             float64 `json:"price"`
	Currency          string  `json:"currency"`
	Available         bool    `json:"available"`
	Stock             *int    `json:"stock,omitempty"`
	IsLongOrder       *bool   `json:"isLongOrder,omitempty"`
	MinQtyToLongOrder *int    `json:"minQtyToLongOrder,omitempty"`
}

// Product is a catalog entry (voucher or direct top-up).
type Product struct {
	ID              string           `json:"id"`
	Name            *string          `json:"name,omitempty"`
	Type            enum.ProductType `json:"type"`
	ImageURL        *string          `json:"imageUrl,omitempty"`
	CountryCode     *string          `json:"countryCode,omitempty"`
	CategoryName    *string          `json:"categoryName,omitempty"`
	SubcategoryName *string          `json:"subcategoryName,omitempty"`
	Items           []ProductItem    `json:"items"`
	Fields          []ProductField   `json:"fields,omitempty"`
}

// ProductListResponse is the paginated list returned by GET /services.
type ProductListResponse struct {
	Items   []Product `json:"items"`
	HasNext bool      `json:"hasNext"`
}

// ProductStockItem reports the stock level for a single product item.
type ProductStockItem struct {
	ItemID string `json:"itemId"`
	Stock  *int   `json:"stock,omitempty"`
}

// ProductStockResponse reports stock levels for all items of a product.
type ProductStockResponse struct {
	ProductID string             `json:"productId"`
	Items     []ProductStockItem `json:"items"`
}

// ---------------------------------------------------------------------------
// Per-item lookup endpoints
//   GET  /services/{serviceId}/items/{itemId}
//   POST /services/items/lookup
// JSON field names mirror the backend ItemLookup* schemas verbatim
// (serviceId, itemId, found, item, error, items).
// ---------------------------------------------------------------------------

// ItemLookupRequestItem is one (serviceId, itemId) pair inside a batch
// lookup request body.
type ItemLookupRequestItem struct {
	ServiceID string `json:"serviceId"`
	ItemID    string `json:"itemId"`
}

// ItemLookupRequest is the request body for POST /services/items/lookup.
// The Items slice must contain between 1 and 100 entries; callers should
// rely on ServicesResource.LookupItems which enforces those bounds
// client-side before any HTTP call is made.
type ItemLookupRequest struct {
	Items []ItemLookupRequestItem `json:"items"`
}

// ItemLookupRow is one row in the batch-lookup response. Always present
// per input pair, in the same order as the request.
//
// When Found is true, Item holds the resolved ProductItem and Error is
// empty. When Found is false, Item is nil and Error holds a code such as
// "service_not_found" or "item_not_found".
type ItemLookupRow struct {
	ServiceID string       `json:"serviceId"`
	ItemID    string       `json:"itemId"`
	Found     bool         `json:"found"`
	Item      *ProductItem `json:"item,omitempty"`
	Error     string       `json:"error,omitempty"`
}

// ItemLookupResponse is the response body for POST /services/items/lookup.
// Items is in the same order as the request — callers can iterate request
// and response by index without re-keying.
type ItemLookupResponse struct {
	Items []ItemLookupRow `json:"items"`
}
