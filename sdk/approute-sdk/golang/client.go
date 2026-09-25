package approute

import (
	"net/http"
	"time"

	"github.com/approute/public-api-sdk-go/internal/transport"
	"github.com/approute/public-api-sdk-go/resource"
)

// DefaultBaseURL is the default AppRoute API base URL.
const DefaultBaseURL = "https://approute.io/api/v1"

// Client is the top-level entry point for the AppRoute Public API SDK.
//
// Create one with NewClient and access resources through its exported fields:
//
//	client := approute.NewClient("sk_live_...")
//	products, err := client.Services.List(ctx)
type Client struct {
	// Services provides access to the product catalog.
	Services *resource.ServicesResource
	// Orders provides access to purchase and order operations.
	Orders *resource.OrdersResource
	// Accounts provides access to balance and transaction queries.
	Accounts *resource.AccountsResource
	// Funds provides access to funding methods and invoices.
	Funds *resource.FundsResource
	// SteamCurrency provides access to Steam exchange rates.
	SteamCurrency *resource.SteamCurrencyResource
}

// NewClient creates a new API client authenticated with the given API key.
// Use Option functions to customise behaviour:
//
//	client := approute.NewClient("sk_live_...",
//	    approute.WithTimeout(10*time.Second),
//	    approute.WithMaxRetries(5),
//	)
func NewClient(apiKey string, opts ...Option) *Client {
	cfg := &clientConfig{
		baseURL:    DefaultBaseURL,
		timeout:    30 * time.Second,
		maxRetries: 3,
	}
	for _, o := range opts {
		o(cfg)
	}

	httpClient := cfg.httpClient
	if httpClient == nil {
		httpClient = &http.Client{Timeout: cfg.timeout}
	}

	t := transport.New(cfg.baseURL, apiKey, httpClient, cfg.maxRetries)

	return &Client{
		Services:      resource.NewServices(t),
		Orders:        resource.NewOrders(t),
		Accounts:      resource.NewAccounts(t),
		Funds:         resource.NewFunds(t),
		SteamCurrency: resource.NewSteamCurrency(t),
	}
}
