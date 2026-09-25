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

// FundsResource provides access to funding methods, invoices, TON and Bybit
// endpoints.
type FundsResource struct {
	t Transport
}

// NewFunds creates a new FundsResource using the given transport.
func NewFunds(t Transport) *FundsResource {
	return &FundsResource{t: t}
}

// Methods returns all available funding methods.
func (r *FundsResource) Methods(ctx context.Context) (*model.FundingMethodsResponse, error) {
	raw, err := r.t.Request(ctx, "GET", "/funds/methods", nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.FundingMethodsResponse](raw, "FundingMethodsResponse")
}

// CreateInvoice creates a new funding invoice.
func (r *FundsResource) CreateInvoice(ctx context.Context, req *model.FundingInvoiceCreateRequest) (*model.FundingInvoice, error) {
	raw, err := r.t.Request(ctx, "POST", "/funds/invoices", nil, req)
	if err != nil {
		return nil, err
	}
	return decode[model.FundingInvoice](raw, "FundingInvoice")
}

// InvoiceListOptions configures optional filters for listing funding invoices.
type InvoiceListOptions struct {
	Status      []enum.FundingStatus
	MethodCode  []enum.FundingMethodCode
	Search      string
	CreatedFrom *time.Time
	CreatedTo   *time.Time
	WithTx      *bool
	Limit       int
	Offset      int
}

// ListInvoices returns a paginated list of funding invoices.
func (r *FundsResource) ListInvoices(ctx context.Context, opts *InvoiceListOptions) (*model.FundingInvoiceList, error) {
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
		if len(opts.Status) > 0 {
			ss := make([]string, len(opts.Status))
			for i, s := range opts.Status {
				ss[i] = string(s)
			}
			params.Set("status", strings.Join(ss, ","))
		}
		if len(opts.MethodCode) > 0 {
			mm := make([]string, len(opts.MethodCode))
			for i, m := range opts.MethodCode {
				mm[i] = string(m)
			}
			params.Set("methodCode", strings.Join(mm, ","))
		}
		if opts.Search != "" {
			params.Set("search", opts.Search)
		}
		if opts.CreatedFrom != nil {
			params.Set("createdFrom", opts.CreatedFrom.Format(time.RFC3339))
		}
		if opts.CreatedTo != nil {
			params.Set("createdTo", opts.CreatedTo.Format(time.RFC3339))
		}
		if opts.WithTx != nil {
			params.Set("withTx", strconv.FormatBool(*opts.WithTx))
		}
	}
	params.Set("limit", strconv.Itoa(limit))
	params.Set("offset", strconv.Itoa(offset))

	raw, err := r.t.Request(ctx, "GET", "/funds/invoices", params, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.FundingInvoiceList](raw, "FundingInvoiceList")
}

// GetInvoice retrieves a single funding invoice by its ID.
func (r *FundsResource) GetInvoice(ctx context.Context, invoiceID string) (*model.FundingInvoice, error) {
	raw, err := r.t.Request(ctx, "GET", "/funds/invoices/"+invoiceID, nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.FundingInvoice](raw, "FundingInvoice")
}

// CheckInvoice triggers a status check (refresh) for a funding invoice.
func (r *FundsResource) CheckInvoice(ctx context.Context, invoiceID string) (*model.FundingInvoice, error) {
	raw, err := r.t.Request(ctx, "POST", "/funds/invoices/"+invoiceID+"/check", nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.FundingInvoice](raw, "FundingInvoice")
}

// InvoiceTimeLeft returns how much time remains before an invoice expires.
func (r *FundsResource) InvoiceTimeLeft(ctx context.Context, invoiceID string) (*model.FundingInvoiceTimeLeft, error) {
	raw, err := r.t.Request(ctx, "GET", "/funds/invoices/"+invoiceID+"/time-left", nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.FundingInvoiceTimeLeft](raw, "FundingInvoiceTimeLeft")
}

// TonDeposit returns the TON deposit address and memo tag.
func (r *FundsResource) TonDeposit(ctx context.Context) (*model.TonDepositState, error) {
	raw, err := r.t.Request(ctx, "GET", "/funds/ton/deposit", nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.TonDepositState](raw, "TonDepositState")
}

// BybitState returns the current Bybit UID linkage state.
func (r *FundsResource) BybitState(ctx context.Context) (*model.BybitState, error) {
	raw, err := r.t.Request(ctx, "GET", "/funds/bybit/state", nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.BybitState](raw, "BybitState")
}

// BybitAttach links a Bybit UID to the account.
func (r *FundsResource) BybitAttach(ctx context.Context, uid string) (*model.BybitState, error) {
	body := model.BybitAttachRequest{UID: uid}
	raw, err := r.t.Request(ctx, "POST", "/funds/bybit/attach", nil, body)
	if err != nil {
		return nil, err
	}
	return decode[model.BybitState](raw, "BybitState")
}

// BybitUnlink removes the linked Bybit UID from the account.
func (r *FundsResource) BybitUnlink(ctx context.Context) (*model.BybitState, error) {
	raw, err := r.t.Request(ctx, "POST", "/funds/bybit/unlink", nil, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.BybitState](raw, "BybitState")
}
