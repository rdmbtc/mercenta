# Network workspaces and task-first onboarding

- Home now offers one guided choice: catalogue, agent goal or budget preview.
- Agent drafts are host-local and never grant consent or execute a purchase.
- Network selector opens trusted hosts after an explicit confirmation. Wallet sessions, balances and forms do not carry over.
- Mainnet chain 5042 renders a read-only workspace. Middleware, backend proxy and Bearer integration route reject financial forwarding.
- Swagger UI 5.33.1 is self-hosted with Apache-2.0 notices; POST execution and external validators are disabled.
- OpenAPI 3.1 includes 102 documented operations and source-derived input schemas. Generic response contracts remain deliberately untyped; final production real-buy payloads are not advertised as active.

## QA

260 web tests, including 24 network/onboarding tests, passed. Web TypeScript and production build passed. Docs tests/build passed. Existing unrelated lint warnings remain. No paid order, supplier invoice or on-chain transfer was created.

Live deployment verification is pending. Real mainnet checkout, deposits, refunds, withdrawals, Earn and Borrow are not enabled by this release.

## Reproduce

Run node scripts/generate-openapi.cjs from the repository root after installing web/backend dependencies; then run web tests/typecheck/build. The generator reads route/schema declarations without executing backend handlers.
