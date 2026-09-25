package model

import (
	"time"

	"github.com/approute/public-api-sdk-go/enum"
)

// PurchaseField is a key-value pair submitted with an order.
type PurchaseField struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// PurchaseRequest is the body sent to POST /orders for a shop purchase.
type PurchaseRequest struct {
	OrdersType  enum.OrdersType `json:"ordersType,omitempty"`
	ReferenceID *string         `json:"referenceId,omitempty"`
	Reference   *string         `json:"reference,omitempty"`
	AccountID   *int            `json:"accountId,omitempty"`
	ClientTime  *time.Time      `json:"clientTime,omitempty"`
	ProductID   *string         `json:"productId,omitempty"`
	ItemID      string          `json:"itemId"`
	Quantity    int             `json:"quantity"`
	Amount      *float64        `json:"amount,omitempty"`
	Currency    *string         `json:"currency,omitempty"`
	Fields      []PurchaseField `json:"fields,omitempty"`
	DirectOrder *bool           `json:"directOrder,omitempty"`
	CheckOnly   *bool           `json:"checkOnly,omitempty"`
}

// Voucher represents a delivered voucher code.
type Voucher struct {
	Pin          string     `json:"pin"`
	SerialNumber *string    `json:"serialNumber,omitempty"`
	Expiration   *time.Time `json:"expiration,omitempty"`
}

// Esim represents a delivered eSIM activation.
type Esim struct {
	MatchingID  string  `json:"matchingId"`
	QRCodeText  string  `json:"qrCodeText"`
	SmdpAddress string  `json:"smdpAddress"`
	ICCID       *string `json:"iccid,omitempty"`
}

// PurchaseResult holds delivered goods (vouchers, eSIM, or generic attributes).
type PurchaseResult struct {
	Vouchers   []Voucher         `json:"vouchers,omitempty"`
	Esim       *Esim             `json:"esim,omitempty"`
	Attributes map[string]string `json:"attributes,omitempty"`
}

// PurchaseResponse is returned by POST /orders for a completed purchase.
type PurchaseResponse struct {
	TransactionUUID string               `json:"transactionUUID"`
	OrderID         *string              `json:"orderId,omitempty"`
	Status          enum.TransactionStatus `json:"status"`
	Price           float64              `json:"price"`
	Currency        string               `json:"currency"`
	Result          *PurchaseResult      `json:"result,omitempty"`
}

// DtuCheckResponse is the result of a DTU check-only order.
type DtuCheckResponse struct {
	CanRecharge     *bool             `json:"canRecharge,omitempty"`
	Price           *float64          `json:"price,omitempty"`
	Currency        *string           `json:"currency,omitempty"`
	ProviderStatus  *string           `json:"providerStatus,omitempty"`
	ProviderMessage *string           `json:"providerMessage,omitempty"`
	Attributes      map[string]string `json:"attributes,omitempty"`
}

// TransactionListItem is one entry in the orders list.
type TransactionListItem struct {
	TransactionUUID string                 `json:"transactionUUID"`
	OrderID         *string                `json:"orderId,omitempty"`
	Reference       *string                `json:"reference,omitempty"`
	ServerTime      *time.Time             `json:"serverTime,omitempty"`
	ClientTime      *time.Time             `json:"clientTime,omitempty"`
	Status          enum.TransactionStatus `json:"status"`
	ProductID       *string                `json:"productId,omitempty"`
	ItemID          *string                `json:"itemId,omitempty"`
	ProductName     *string                `json:"productName,omitempty"`
	ItemName        *string                `json:"itemName,omitempty"`
	Quantity        int                    `json:"quantity"`
	Amount          *float64               `json:"amount,omitempty"`
	Currency        string                 `json:"currency"`
	AccountNumber   *string                `json:"accountNumber,omitempty"`
	Vouchers        []Voucher              `json:"vouchers,omitempty"`
}

// TransactionPage holds a page of transaction list items.
type TransactionPage struct {
	Items   []TransactionListItem `json:"items"`
	HasNext bool                  `json:"hasNext"`
}

// TransactionListResponse wraps the paginated order list.
type TransactionListResponse struct {
	Page TransactionPage `json:"page"`
}
