# AppRoute Public API SDK for Python

Official Python SDK for [AppRoute Public API](https://approute.io).

Use `https://approute.io/api/v1` for international clients and
`https://approute.ru/api/v1` for Russian clients. API keys are available in
the matching dashboard: `https://approute.io/dashboard` or
`https://approute.ru/dashboard`.

## Installation

```bash
pip install approute-public-api-sdk
```

## Quick Start

```python
from approute import AppRouteClient

client = AppRouteClient(api_key="sk_live_...")

# List products
products = client.services.list()
for product in products.items:
    print(f"{product.name} ({product.type})")

# Get a product
product = client.services.get("product-uuid")

# Get a single denomination/item directly
item = client.services.get_item("svc-uuid", "item-uuid")
print(f"{item.name}: {item.price} {item.currency}")

# Batch lookup up to 100 (serviceId, itemId) pairs in one round-trip.
# The response preserves input order; each row has found + item or error.
from approute.models import ItemLookupRequestItem

resp = client.services.lookup_items([
    ItemLookupRequestItem(service_id="svc-uuid-1", item_id="item-uuid-1"),
    ItemLookupRequestItem(service_id="svc-uuid-2", item_id="item-uuid-2"),
])
for row in resp.items:
    if row.found:
        print(f"{row.service_id}/{row.item_id}: {row.item.price}")
    else:
        print(f"{row.service_id}/{row.item_id}: MISSING ({row.error})")

# Create an order
order = client.orders.create(
    orders_type="shop",
    reference_id="my-unique-ref",
    item_id="item-uuid",
    quantity=1,
)
print(f"Order {order.transaction_uuid}: {order.status}")

# Check balances
accounts = client.accounts.balances()
for acc in accounts.items:
    print(f"{acc.currency}: {acc.available}")

# Fund your account
methods = client.funds.methods()
invoice = client.funds.create_invoice(method_code="USDT_TRC20", amount=100.0)
print(f"Send {invoice.amount_expected} to {invoice.address}")

# Steam currency rates
rates = client.steam_currency.rates(quotes=["RUB", "KZT"])

client.close()
```

## Async Usage

```python
import asyncio
from approute import AsyncAppRouteClient

async def main():
    async with AsyncAppRouteClient(api_key="sk_live_...") as client:
        products = await client.services.list()
        print(f"Found {len(products.items)} products")

asyncio.run(main())
```

## Configuration

```python
client = AppRouteClient(
    api_key="sk_live_...",
    base_url="https://approute.io/api/v1",  # default
    timeout=30.0,       # seconds, default 30
    max_retries=3,      # default 3 (retries on 429/5xx)
)

# Russian clients
client = AppRouteClient(
    api_key="sk_live_...",
    base_url="https://approute.ru/api/v1",
)
```

## Error Handling

```python
from approute import AppRouteClient, NotFoundError, RateLimitedError, ApiError

client = AppRouteClient(api_key="sk_live_...")

try:
    product = client.services.get("nonexistent-id")
except NotFoundError as e:
    print(f"Not found: {e.message} (trace: {e.trace_id})")
except RateLimitedError as e:
    print(f"Rate limited: {e.message}")
except ApiError as e:
    print(f"API error [{e.code}]: {e.message}")
    for field_err in e.errors:
        print(f"  {field_err.field}: {field_err.message}")
```

### Error Hierarchy

- `AppRouteError` — base for all SDK errors
  - `NetworkError` — connection/timeout errors
  - `ApiError` — API returned an error response
    - `ValidationError` — 422, validation failed
    - `UnauthorizedError` — 401, invalid API key
    - `ForbiddenError` — 403, insufficient scopes
    - `NotFoundError` — 404
    - `ConflictError` — 409
    - `RateLimitedError` — 429
    - `OutOfStockError` — 422, product out of stock
    - `InsufficientFundsError` — 422, not enough balance
    - `UpstreamError` — 502
    - `InternalError` — 500

## Requirements

- Python 3.10+
- httpx
- pydantic >= 2.0
