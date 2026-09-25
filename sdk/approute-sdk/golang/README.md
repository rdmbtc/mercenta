# AppRoute Public API SDK for Go

Official Go SDK for the [AppRoute Public API](https://approute.io). Zero external
dependencies -- only the Go standard library is used.

Use `https://approute.io/api/v1` for international clients and
`https://approute.ru/api/v1` for Russian clients. API keys are available in
the matching dashboard: `https://approute.io/dashboard` or
`https://approute.ru/dashboard`.

## Requirements

- Go 1.24 or later

## Installation

```bash
go get github.com/approute/public-api-sdk-go
```

## Quick Start

```go
package main

import (
	"context"
	"fmt"
	"log"

	approute "github.com/approute/public-api-sdk-go"
	"github.com/approute/public-api-sdk-go/model"
)

func main() {
	client := approute.NewClient("sk_live_your_api_key")

	ctx := context.Background()

	// List all products
	products, err := client.Services.List(ctx)
	if err != nil {
		log.Fatal(err)
	}
	for _, p := range products.Items {
		fmt.Printf("Product %s: %v\n", p.ID, p.Name)
	}

	// Get a single denomination/item directly
	item, err := client.Services.GetItem(ctx, "svc-id", "item-id")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Item %s: %.2f %s\n", item.ID, item.Price, item.Currency)

	// Batch lookup up to 100 (serviceId, itemId) pairs in one round-trip.
	// The response preserves input order; each row has Found + Item or Error.
	resp, err := client.Services.LookupItems(ctx, []model.ItemLookupRequestItem{
		{ServiceID: "svc-id-1", ItemID: "item-id-1"},
		{ServiceID: "svc-id-2", ItemID: "item-id-2"},
	})
	if err != nil {
		log.Fatal(err)
	}
	for _, row := range resp.Items {
		if row.Found && row.Item != nil {
			fmt.Printf("%s/%s: %.2f\n", row.ServiceID, row.ItemID, row.Item.Price)
		} else {
			fmt.Printf("%s/%s: MISSING (%s)\n", row.ServiceID, row.ItemID, row.Error)
		}
	}

	// Get account balances
	balances, err := client.Accounts.Balances(ctx)
	if err != nil {
		log.Fatal(err)
	}
	for _, a := range balances.Items {
		fmt.Printf("Balance %s: %.2f (available: %.2f)\n", a.Currency, a.Balance, a.Available)
	}
}
```

## Configuration

Use functional options to customise the client:

```go
import "time"

client := approute.NewClient("sk_live_...",
	approute.WithBaseURL("https://custom-api.example.com/api/v1"),
	approute.WithTimeout(10*time.Second),
	approute.WithMaxRetries(5),
)

// Russian clients
client := approute.NewClient("sk_live_...",
	approute.WithBaseURL("https://approute.ru/api/v1"),
)
```

You can also provide your own `*http.Client`:

```go
client := approute.NewClient("sk_live_...",
	approute.WithHTTPClient(myHTTPClient),
)
```

## Package Structure

```
approute                             # Root: Client, Options, Version
  apierror/                          # API error types (ApiError, NotFoundError, etc.)
  enum/                              # Typed string constants (ResultCode, ProductType, etc.)
  model/                             # Request/response data structures
  resource/                          # API resource types (ServicesResource, OrdersResource, etc.)
  internal/transport/                # HTTP transport (not importable by external code)
```

## Resources

| Resource           | Methods                                                                 |
|--------------------|-------------------------------------------------------------------------|
| `Services`         | `List`, `Get`, `Stock`, `GetItem`, `LookupItems`                        |
| `Orders`           | `Create`, `CheckDTU`, `List`                                            |
| `Accounts`         | `Balances`, `Transactions`                                              |
| `Funds`            | `Methods`, `CreateInvoice`, `ListInvoices`, `GetInvoice`, `CheckInvoice`, `InvoiceTimeLeft`, `TonDeposit`, `BybitState`, `BybitAttach`, `BybitUnlink` |
| `SteamCurrency`    | `Rates`                                                                 |

## Error Handling

All API errors are returned as typed error values that wrap `*apierror.ApiError`.
Use `errors.As` to inspect the specific error type:

```go
import (
	"errors"

	"github.com/approute/public-api-sdk-go/apierror"
)

products, err := client.Services.List(ctx)
if err != nil {
	var notFound *apierror.NotFoundError
	if errors.As(err, &notFound) {
		fmt.Println("Not found:", notFound.Message)
		return
	}

	var rateLimited *apierror.RateLimitedError
	if errors.As(err, &rateLimited) {
		fmt.Println("Rate limited, try again later")
		return
	}

	var apiErr *apierror.ApiError
	if errors.As(err, &apiErr) {
		fmt.Printf("API error [%s]: %s (trace=%s)\n", apiErr.Code, apiErr.Message, apiErr.TraceID)
		for _, fe := range apiErr.Errors {
			fmt.Printf("  field %s: %s - %s\n", fe.Field, fe.Code, fe.Message)
		}
		return
	}

	// Network or other error
	log.Fatal(err)
}
```

Available error types: `ValidationError`, `UnauthorizedError`, `ForbiddenError`,
`NotFoundError`, `ConflictError`, `RateLimitedError`, `OutOfStockError`,
`InsufficientFundsError`, `UpstreamError`, `InternalServerError`.

## Retries

The SDK automatically retries requests that receive HTTP 429 or 5xx responses,
using exponential backoff. The `Retry-After` header is honoured when present.
The default maximum number of retries is 3; override with `WithMaxRetries`.

## License

See repository root for license details.
