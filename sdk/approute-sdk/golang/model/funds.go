package model

import (
	"time"

	"github.com/approute/public-api-sdk-go/enum"
)

// FundingMethod describes one available deposit method.
type FundingMethod struct {
	Code                  enum.FundingMethodCode `json:"code"`
	Name                  string                 `json:"name"`
	MinAmount             float64                `json:"minAmount"`
	Commission            float64                `json:"commission"`
	Address               string                 `json:"address"`
	TTLMinutes            int                    `json:"ttlMinutes"`
	ConfirmationsRequired int                    `json:"confirmationsRequired"`
}

// FundingMethodsResponse is the list returned by GET /funds/methods.
type FundingMethodsResponse struct {
	Items []FundingMethod `json:"items"`
}

// FundingInvoice represents a single funding invoice.
type FundingInvoice struct {
	ID                    string                 `json:"id"`
	MethodCode            enum.FundingMethodCode `json:"methodCode"`
	AmountExpected        float64                `json:"amountExpected"`
	Commission            float64                `json:"commission"`
	Credited              float64                `json:"credited"`
	MemoTag               *string                `json:"memoTag,omitempty"`
	Address               string                 `json:"address"`
	TxHash                *string                `json:"txHash,omitempty"`
	Status                enum.FundingStatus     `json:"status"`
	ConfirmationsRequired *int                   `json:"confirmationsRequired,omitempty"`
	Confirmations         *int                   `json:"confirmations,omitempty"`
	CreatedAt             time.Time              `json:"createdAt"`
	ExpiresAt             time.Time              `json:"expiresAt"`
	Direction             string                 `json:"direction,omitempty"`
}

// FundingInvoiceList is the paginated response for GET /funds/invoices.
type FundingInvoiceList struct {
	Items []FundingInvoice `json:"items"`
	Total int              `json:"total"`
}

// FundingInvoiceCreateRequest is the body for POST /funds/invoices.
type FundingInvoiceCreateRequest struct {
	MethodCode enum.FundingMethodCode `json:"methodCode"`
	Amount     float64               `json:"amount"`
}

// FundingInvoiceTimeLeft reports how much time remains before an invoice expires.
type FundingInvoiceTimeLeft struct {
	InvoiceID   string    `json:"invoiceId"`
	ExpiresAt   time.Time `json:"expiresAt"`
	SecondsLeft int       `json:"secondsLeft"`
	Expired     bool      `json:"expired"`
}

// TonDepositState holds the TON deposit address and memo tag.
type TonDepositState struct {
	Address string `json:"address"`
	MemoTag string `json:"memoTag"`
}

// BybitState reports the Bybit UID linkage state.
type BybitState struct {
	RecipientUID string  `json:"recipientUid"`
	Linked       bool    `json:"linked"`
	YourUID      *string `json:"yourUid,omitempty"`
}

// BybitAttachRequest is the body for POST /funds/bybit/attach.
type BybitAttachRequest struct {
	UID string `json:"uid"`
}
