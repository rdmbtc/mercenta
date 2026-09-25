package model

import "time"

// SteamCurrencyRate represents one currency conversion rate.
type SteamCurrencyRate struct {
	QuoteCurrencyCode string     `json:"quoteCurrencyCode"`
	Rate              string     `json:"rate"`
	ProviderCreatedAt *time.Time `json:"providerCreatedAt,omitempty"`
	FetchedAt         *time.Time `json:"fetchedAt,omitempty"`
}

// SteamCurrencyRatesResponse wraps the rates list.
type SteamCurrencyRatesResponse struct {
	BaseCurrencyCode string              `json:"baseCurrencyCode"`
	Items            []SteamCurrencyRate `json:"items"`
}
