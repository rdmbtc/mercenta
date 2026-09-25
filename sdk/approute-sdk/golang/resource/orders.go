package resource

import (
	"context"
	"net/url"
	"strconv"

	"github.com/approute/public-api-sdk-go/enum"
	"github.com/approute/public-api-sdk-go/model"
)

// OrdersResource provides access to the purchase/order endpoints.
type OrdersResource struct {
	t Transport
}

// NewOrders creates a new OrdersResource using the given transport.
func NewOrders(t Transport) *OrdersResource {
	return &OrdersResource{t: t}
}

// Create submits a new purchase order.
// The PurchaseRequest body is sent directly as JSON.
func (r *OrdersResource) Create(ctx context.Context, req *model.PurchaseRequest) (*model.PurchaseResponse, error) {
	raw, err := r.t.Request(ctx, "POST", "/orders", nil, req)
	if err != nil {
		return nil, err
	}
	return decode[model.PurchaseResponse](raw, "PurchaseResponse")
}

// DtuCheckRequest contains the parameters for a DTU check-only validation.
type DtuCheckRequest struct {
	ItemID   string                `json:"itemId"`
	Fields   []model.PurchaseField `json:"fields,omitempty"`
	Amount   *float64              `json:"amount,omitempty"`
	Currency *string               `json:"currency,omitempty"`
}

// CheckDTU validates a DTU order without creating it (checkOnly=true).
func (r *OrdersResource) CheckDTU(ctx context.Context, req *DtuCheckRequest) (*model.DtuCheckResponse, error) {
	body := struct {
		OrdersType string                `json:"ordersType"`
		CheckOnly  bool                  `json:"checkOnly"`
		ItemID     string                `json:"itemId"`
		Fields     []model.PurchaseField `json:"fields,omitempty"`
		Amount     *float64              `json:"amount,omitempty"`
		Currency   *string               `json:"currency,omitempty"`
	}{
		OrdersType: string(enum.OrdersDTU),
		CheckOnly:  true,
		ItemID:     req.ItemID,
		Fields:     req.Fields,
		Amount:     req.Amount,
		Currency:   req.Currency,
	}

	raw, err := r.t.Request(ctx, "POST", "/orders", nil, body)
	if err != nil {
		return nil, err
	}
	return decode[model.DtuCheckResponse](raw, "DtuCheckResponse")
}

// OrderListOptions configures optional filters for listing orders.
type OrderListOptions struct {
	Limit       int
	Offset      int
	OrderID     string
	ReferenceID string
	Unhide      *bool
}

// List returns a paginated list of orders.
func (r *OrdersResource) List(ctx context.Context, opts *OrderListOptions) (*model.TransactionListResponse, error) {
	params := url.Values{}

	limit := 50
	offset := 0
	if opts != nil {
		if opts.Limit > 0 {
			limit = opts.Limit
		}
		if opts.Offset > 0 {
			offset = opts.Offset
		}
		if opts.OrderID != "" {
			params.Set("orderId", opts.OrderID)
		}
		if opts.ReferenceID != "" {
			params.Set("referenceId", opts.ReferenceID)
		}
		if opts.Unhide != nil {
			params.Set("unhide", strconv.FormatBool(*opts.Unhide))
		}
	}
	params.Set("limit", strconv.Itoa(limit))
	params.Set("offset", strconv.Itoa(offset))

	raw, err := r.t.Request(ctx, "GET", "/orders", params, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.TransactionListResponse](raw, "TransactionListResponse")
}
