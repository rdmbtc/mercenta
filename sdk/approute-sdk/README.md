# AppRoute Public API SDK

Official SDK libraries for [AppRoute Public API](https://approute.io) — available in Python, JavaScript/TypeScript, PHP, and Go.

## Available SDKs

| Language | Package | Min Version |
|----------|---------|-------------|
| [Python](./python/) | `approute-public-api-sdk` | Python 3.10+ |
| [JavaScript/TypeScript](./javascript/) | `@approute/public-api-sdk` | Node.js 18+ |
| [PHP](./php/) | `approute/public-api-sdk` | PHP 8.1+ |
| [Go](./golang/) | `github.com/approute/public-api-sdk-go` | Go 1.21+ |

## Quick Start

All SDKs follow the same pattern:

1. Get your API key from the AppRoute Dashboard:
   - International clients: [approute.io/dashboard](https://approute.io/dashboard)
   - Russian clients: [approute.ru/dashboard](https://approute.ru/dashboard)
2. Install the SDK for your language
3. Initialize the client with your API key
4. Call API methods

## Regional Domains

Use the `.io` domain for international clients and the `.ru` domain for Russian clients:

| Region | Dashboard | API Base URL |
|--------|-----------|--------------|
| International | `https://approute.io/dashboard` | `https://approute.io/api/v1` |
| Russia | `https://approute.ru/dashboard` | `https://approute.ru/api/v1` |

The SDKs default to the international API endpoint. Russian clients should pass the `.ru` API base URL in client configuration.

## API Coverage

All SDKs cover the **Data Plane** endpoints:

- **Services** — product catalog (list, get by ID, get single item, batch item lookup)
- **Orders** — create purchases, DTU checks, list orders
- **Accounts** — balances, transaction history
- **Funds** — funding methods, invoices (create, list, check), TON deposits, Bybit UID management
- **Steam Currency** — exchange rates

## Authentication

All endpoints use API key authentication via `X-API-Key` header. The SDK handles this automatically.

## Response Handling

All API responses use a unified envelope format. The SDKs automatically:
- Unwrap successful responses, returning just the `data` field
- Throw/return typed errors for failed responses with `code`, `message`, `traceId`, and field-level `errors`

## Changelog

### 1.1.0

Added `ServicesResource.getItem` (single-item GET) and `lookupItems` (batch
POST, up to 100 `(serviceId, itemId)` pairs). No breaking changes.

### Breaking change (2026-05): `POST /orders` no longer returns 429 for API-key spend caps

**What changed.** `POST /api/v1/orders` previously returned HTTP 429
`LIMIT_REACHED` in two structurally different cases:

1. A genuine per-window rate-limit (Public-API or upstream shop-service).
2. The API key's static `transactionLimit` could not accommodate the order.

These are now disambiguated:

| Case | HTTP | `statusCode` | `errorCode` | Retryable? |
|------|------|--------------|-------------|------------|
| Per-window rate-limit | `429` | `LIMIT_REACHED` (8) | — | Yes — back-off retry |
| API-key spend cap | `409` | `API_KEY_LIMIT_EXCEEDED` (13) | `api_key_transaction_limit_exceeded` | **No** — raise the cap or reset `transactionUsed` |

**Migration.** If your application had special handling on HTTP 429
`LIMIT_REACHED` for the "API key transaction limit exhausted" case
(typically: stop retrying, surface to operator, page support), move that
branch onto HTTP 409 with
`errorCode === "api_key_transaction_limit_exceeded"`. Keep your existing
back-off path on HTTP 429 `LIMIT_REACHED` — it is now strictly the
per-window rate-limit signal.

The new error envelope's `statusMessage` for the spend-cap path includes
the attempted amount, the remaining headroom and the configured limit so
operators can act on it directly:

```
Order amount 0.5 USD exceeds api key remaining limit 0.2 of 1.0
```

The control-plane representation of an API key now also exposes
`transactionRemaining` (`transactionLimit - transactionUsed`, or `null`
when no limit is set). Use it instead of `status` to decide whether a
key can serve an order of expected size — a key with `status="active"`
can still refuse new orders with HTTP 409 if its remaining headroom is
below the quoted amount.

## License

MIT
