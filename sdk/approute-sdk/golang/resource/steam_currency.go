package resource

import (
	"context"
	"net/url"
	"strings"

	"github.com/approute/public-api-sdk-go/model"
)

// SteamCurrencyResource provides access to Steam currency rate endpoints.
type SteamCurrencyResource struct {
	t Transport
}

// NewSteamCurrency creates a new SteamCurrencyResource using the given transport.
func NewSteamCurrency(t Transport) *SteamCurrencyResource {
	return &SteamCurrencyResource{t: t}
}

// RatesOptions configures optional filters for fetching Steam currency rates.
type RatesOptions struct {
	// Quotes filters rates to only the listed quote currency codes.
	Quotes []string
}

// Rates returns Steam currency exchange rates. Pass nil for opts to retrieve
// all available rates.
func (r *SteamCurrencyResource) Rates(ctx context.Context, opts *RatesOptions) (*model.SteamCurrencyRatesResponse, error) {
	var params url.Values
	if opts != nil && len(opts.Quotes) > 0 {
		params = url.Values{}
		params.Set("quotes", strings.Join(opts.Quotes, ","))
	}

	raw, err := r.t.Request(ctx, "GET", "/steam-currency/rates", params, nil)
	if err != nil {
		return nil, err
	}
	return decode[model.SteamCurrencyRatesResponse](raw, "SteamCurrencyRatesResponse")
}
