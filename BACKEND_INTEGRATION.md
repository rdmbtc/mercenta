# Mercenta backend integration

Current local endpoints: frontend http://localhost:3011; backend http://127.0.0.1:3013. Port 3012 belongs to the existing docs server and is not stopped.

Frontend uses a same-origin BFF with signed HttpOnly visitor sessions or verified wallet sessions and server-to-server HMAC. Body-provided wallet IDs are never trusted. Financial API endpoints proxy to backend; the older local illustrative policy UI is not an executable financial authority. Order creation requires a UUID requestId and a fresh server-side USDC supplier quote; an empty executable catalog intentionally rejects purchases. Read-only catalog snapshots are not verified purchase quotes.

## Enabled now
- Persistent sandbox treasury isolated from the real immutable ledger. Earn deposit/withdrawal, cirBTC loan/repayment calculations and previews use BigInt; no transaction is signed.
- Circle Earn SDK discovery, server-side hosted onramp session integration (credentials required), typed human-wallet integration boundaries for Earn/Borrow/Swap/Bridge/Gateway.
- Arc native and ERC20 payment verifier, P1–P11, replay prevention, review queue with merchant authorization and policy revalidation, one purchase claim, HMAC reference reconciliation, authenticated one-time AES-GCM delivery.
- Ten server-owned free advisory requests, failed-provider quota restoration, idempotent chat requests, trusted catalog DTOs for recommendations. Without model credentials the UI explicitly identifies the rule-based advisor. Future paid mainnet mode is disabled.

## Release blockers: not production-certified
1. Circle SDK dependency audit currently reports 28 findings (9 high); do not force-downgrade the SDK to remove features. Track supported patched upstream versions and re-audit before public deployment.
2. Circle API keys / onboarding, verified Arc vault and cirBTC market addresses, oracle, human signing flow and recorded settlement evidence are not configured. 5.4% APY and 92,400 price are sandbox assumptions, not live data.
3. Model provider endpoint, key and private model identifier are not configured.
4. Supply adapter is disabled until the actual API contract, fresh quote semantics, cost currency/FX evidence and fulfillment/reconciliation response schema are validated. Never infer USD/USDC FX from a currency label.
5. Explicitly rejected or blocked paid orders require a merchant-reviewed refund flow; no automatic refund transaction is invented. Review revalidation still needs fresh chain/oracle evidence immediately before production execution.
6. Add HTTPS/reverse proxy configuration, stronger anti-abuse identity, backup/restore and load/fault tests, crash recovery for pending advisory requests, API trace observability and deployment hardening. No public deployment, mainnet spend or contracts were performed.

## Confidentiality
Publication-candidate source and docs have neutral provider terms. Private env files, local work scripts, backups, artifacts, node_modules and Git history are not publication candidates; exclude them from public release. This does not rewrite historical commits.
