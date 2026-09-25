# @approute/public-api-sdk

Official JavaScript/TypeScript SDK for the AppRoute Public API.

Use `https://approute.io/api/v1` for international clients and
`https://approute.ru/api/v1` for Russian clients. API keys are available in
the matching dashboard: `https://approute.io/dashboard` or
`https://approute.ru/dashboard`.

## Requirements

- **Node.js 18+** (uses native `fetch`)
- TypeScript 5.4+ (for development)

## Installation

```bash
npm install @approute/public-api-sdk
```

## Quick Start

```typescript
import { AppRouteClient } from "@approute/public-api-sdk";

const client = new AppRouteClient({ apiKey: "sk_live_..." });

// List products
const catalog = await client.services.list();
for (const product of catalog.items) {
  console.log(product.id, product.name, product.type);
}

// Get a single product
const product = await client.services.get("product-id");

// Check stock
const stock = await client.services.stock("product-id");

// Get a single denomination/item directly
const item = await client.services.getItem("service-id", "item-id");
console.log(item.id, item.price, item.currency);

// Batch lookup up to 100 (serviceId, itemId) pairs in one round-trip.
// The response preserves input order; each row has found + item or error.
const lookup = await client.services.lookupItems([
  { serviceId: "service-id-1", itemId: "item-id-1" },
  { serviceId: "service-id-2", itemId: "item-id-2" },
]);
for (const row of lookup.items) {
  if (row.found && row.item) {
    console.log(`${row.serviceId}/${row.itemId}: ${row.item.price}`);
  } else {
    console.log(`${row.serviceId}/${row.itemId}: MISSING (${row.error})`);
  }
}

// Purchase a voucher
const order = await client.orders.create({
  ordersType: "shop",
  itemId: "item-id",
  quantity: 1,
});
console.log(order.status, order.transactionUuid);

// Check DTU eligibility
const check = await client.orders.checkDtu({
  itemId: "dtu-item-id",
  fields: [{ key: "phone", value: "+1234567890" }],
});
console.log(check.canRecharge, check.price);

// List orders
const orders = await client.orders.list({ limit: 10 });

// Account balances
const balances = await client.accounts.balances();
for (const account of balances.items) {
  console.log(account.currency, account.balance);
}

// Account transactions
const txns = await client.accounts.transactions({
  category: ["funding", "shop"],
  limit: 25,
});

// Funding methods
const methods = await client.funds.methods();

// Create a funding invoice
const invoice = await client.funds.createInvoice({
  methodCode: "USDT_TRC20",
  amount: 50,
});
console.log(invoice.address, invoice.amountExpected);

// Steam currency rates
const rates = await client.steamCurrency.rates({ quotes: ["USD", "EUR"] });
```

## Configuration

```typescript
const client = new AppRouteClient({
  apiKey: "sk_live_...",          // Required: your API key
  baseUrl: "https://...",         // Optional: custom base URL
  timeout: 30000,                 // Optional: request timeout in ms (default: 30000)
  maxRetries: 3,                  // Optional: max retries on 429/5xx (default: 3)
});

// Russian clients
const ruClient = new AppRouteClient({
  apiKey: "sk_live_...",
  baseUrl: "https://approute.ru/api/v1",
});
```

## Error Handling

The SDK provides a rich error hierarchy:

```typescript
import {
  AppRouteError,
  NetworkError,
  ApiError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  InsufficientFundsError,
  RateLimitedError,
} from "@approute/public-api-sdk";

try {
  await client.orders.create({ itemId: "item-id", quantity: 1 });
} catch (err) {
  if (err instanceof ValidationError) {
    console.error("Validation failed:", err.message);
    for (const fieldErr of err.errors) {
      console.error(`  ${fieldErr.field}: ${fieldErr.code} - ${fieldErr.message}`);
    }
  } else if (err instanceof InsufficientFundsError) {
    console.error("Not enough balance:", err.message);
  } else if (err instanceof NotFoundError) {
    console.error("Product not found:", err.message);
  } else if (err instanceof RateLimitedError) {
    console.error("Rate limited, try again later");
  } else if (err instanceof UnauthorizedError) {
    console.error("Invalid API key");
  } else if (err instanceof NetworkError) {
    console.error("Network issue:", err.message);
  } else if (err instanceof ApiError) {
    console.error(`API error [${err.code}]:`, err.message);
    console.error("Trace ID:", err.traceId);
  }
}
```

### Error Hierarchy

```
AppRouteError (base)
  +-- NetworkError
  +-- ApiError
        +-- ValidationError
        +-- UnauthorizedError
        +-- ForbiddenError
        +-- NotFoundError
        +-- ConflictError
        +-- RateLimitedError
        +-- OutOfStockError
        +-- InsufficientFundsError
        +-- UpstreamError
        +-- InternalError
```

## Enums

The SDK exports const-object enums for type-safe usage:

```typescript
import {
  ResultCode,
  TransactionStatus,
  BalanceCategory,
  ProductType,
  FundingMethodCode,
  FundingStatus,
  OrdersType,
} from "@approute/public-api-sdk";

// Use as values
const type = ProductType.VOUCHER; // "voucher"
const status = FundingStatus.SUCCESS; // "success"

// Use as types
function handleStatus(s: TransactionStatus) {
  // ...
}
```

## API Resources

| Resource         | Methods                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `services`       | `list()`, `get(id)`, `stock(id)`, `getItem(serviceId, itemId)`, `lookupItems(items)`        |
| `orders`         | `create(opts)`, `checkDtu(opts)`, `list(opts?)`                                             |
| `accounts`       | `balances()`, `transactions(opts?)`                                                         |
| `funds`          | `methods()`, `createInvoice(opts)`, `listInvoices(opts?)`, `getInvoice(id)`, `checkInvoice(id)`, `invoiceTimeLeft(id)`, `tonDeposit()`, `bybitState()`, `bybitAttach(uid)`, `bybitUnlink()` |
| `steamCurrency`  | `rates(opts?)`                                                                              |

## License

MIT
