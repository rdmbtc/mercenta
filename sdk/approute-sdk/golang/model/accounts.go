package model

import (
	"time"

	"github.com/approute/public-api-sdk-go/enum"
)

// AccountActivity represents a single recent balance movement.
type AccountActivity struct {
	ID        string    `json:"id"`
	Currency  string    `json:"currency"`
	Amount    float64   `json:"amount"`
	Operation string    `json:"operation"`
	CreatedAt time.Time `json:"createdAt"`
}

// Account holds the balance information for a single currency.
type Account struct {
	Currency       string            `json:"currency"`
	Balance        float64           `json:"balance"`
	Available      float64           `json:"available"`
	OverdraftLimit float64           `json:"overdraftLimit"`
	RecentActivity []AccountActivity `json:"recentActivity"`
}

// AccountListResponse is the top-level response for GET /accounts.
type AccountListResponse struct {
	Items []Account `json:"items"`
}

// AccountTransaction represents one balance-transaction record.
type AccountTransaction struct {
	ID            string               `json:"id"`
	Currency      string               `json:"currency"`
	TransactionID string               `json:"transactionId"`
	Category      enum.BalanceCategory `json:"category"`
	Balance       float64              `json:"balance"`
	Amount        float64              `json:"amount"`
	OrderID       string               `json:"orderId"`
	OrderIDRaw    *string              `json:"orderIdRaw,omitempty"`
	Description   *string              `json:"description,omitempty"`
	CreatedAt     time.Time            `json:"createdAt"`
}

// AccountTransactionPage is the paginated response for GET /accounts/transactions.
type AccountTransactionPage struct {
	TotalCount int                  `json:"totalCount"`
	Items      []AccountTransaction `json:"items"`
}
