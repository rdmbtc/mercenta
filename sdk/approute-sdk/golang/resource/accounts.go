package resource

import (
	"context"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/approute/public-api-sdk-go/enum"
	"github.com/approute/public-api-sdk-go/model"
)

// AccountsResource provides access to account balance and transaction endpoints.
type AccountsResource struct {
	t Transport
}

// NewAccounts creates a new AccountsResource using the given transport.
func NewAccounts(t Transport) *AccountsResource {
	return &AccountsResource{t: t}
}

// Balances returns all account balances for the API key owner.
func (r *AccountsResource) Balances(ctx context.Context) (*model.AccountListResponse, error) {
	raw, err := r.t.Request(ctx, "GET", "/accounts", nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.AccountListResponse](raw, "AccountListResponse")
}

// TransactionListOptions configures optional filters for listing balance
// transactions.
type TransactionListOptions struct {
	Currency      string
	Category      []enum.BalanceCategory
	Search        string
	TransactionID string
	OrderID       string
	DateFrom      *time.Time
	DateTo        *time.Time
	Limit         int
	Offset        int
}

// Transactions returns a paginated list of balance transactions.
func (r *AccountsResource) Transactions(ctx context.Context, opts *TransactionListOptions) (*model.AccountTransactionPage, error) {
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
		if opts.Currency != "" {
			params.Set("currency", opts.Currency)
		}
		if len(opts.Category) > 0 {
			cats := make([]string, len(opts.Category))
			for i, c := range opts.Category {
				cats[i] = string(c)
			}
			params.Set("category", strings.Join(cats, ","))
		}
		if opts.Search != "" {
			params.Set("search", opts.Search)
		}
		if opts.TransactionID != "" {
			params.Set("transactionId", opts.TransactionID)
		}
		if opts.OrderID != "" {
			params.Set("orderId", opts.OrderID)
		}
		if opts.DateFrom != nil {
			params.Set("dateFrom", opts.DateFrom.Format(time.RFC3339))
		}
		if opts.DateTo != nil {
			params.Set("dateTo", opts.DateTo.Format(time.RFC3339))
		}
	}
	params.Set("limit", strconv.Itoa(limit))
	params.Set("offset", strconv.Itoa(offset))

	raw, err := r.t.Request(ctx, "GET", "/accounts/transactions", params, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.AccountTransactionPage](raw, "AccountTransactionPage")
}
