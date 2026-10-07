# AGENT-03 — Catalog Data Architect

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/src/fixtures/catalog-expanded.json`
- `backend/test/catalog-expanded.test.ts`

## Read-only input interfaces
- `backend/src/services/catalog.ts`
- `backend/src/services/supplier-preview.ts`

## Input contract

Fixture v1: {schemaVersion:1,synthetic:true,network:"fixture",items:[{sku,name,categoryId,categoryLabel,regions,deliveryKind,baseCostUsd,markupBps,salePriceUsd,available,metadata}]}. Money uses canonical decimal strings (6 decimals), markup integer bps. Stable Mercenta-only IDs. Category IDs map existing gaming/streaming/creator/developer/cloud to the five exact labels in the dispatch contract.

## Exact deliverables
- At least 125 synthetic items, at least 25 in each category. Region/recipient requirements and denomination metadata; Zod validation inside the isolated test file.

## Acceptance
- Unique SKUs, allowed region enum, exact floor/ceil rounding policy, consistent cost+markup, no real credentials or fabricated live inventory. No catalogue bootstrap/source replacement. Zod rejects unknown categories, NaN, negative amounts and malformed region. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/catalog-expanded.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
