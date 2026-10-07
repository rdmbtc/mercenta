# AGENT-13 — API Contract Guardian

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `backend/test/openapi-contract.test.ts`

## Read-only input interfaces
- `backend/src/routes/commerce.ts`
- `backend/src/routes/agent-operator.ts`
- `backend/src/routes/catalog-test-checkout.ts`
- `web/src/lib/openapi-testnet.json`
- `web/src/lib/openapi-mainnet.json`
- `web/src/app/api/openapi/route.ts`

## Input contract

Map actual backend and Next proxy methods, path params, Zod input constraints, auth and response status contracts. Distinguish account/operator routes from /api/v1 integration routes and mainnet-disabled profiles. Use generated artifacts, not assumed /api/quote aliases.

## Exact deliverables
- Operation parity matrix, strict input and response fixture validation, explicit exclusions with rationale for internal endpoints.

## Acceptance
- Mutation of a schema, method, required field or auth constraint makes suite fail. No assertion of 100% response typing while generic response objects remain untyped. Mainnet restrictions documented/tested; missing requested routes are blockers rather than fictional APIs. Exit 0.

## Verify command

```sh
cd backend && npx --no-install tsx --test test/openapi-contract.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
