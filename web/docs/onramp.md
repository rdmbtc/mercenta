# Circle Onramp integration

## Status: explicit direct-wallet launch mode; automated deposit accounting unavailable

The old `/onramp` simulator has been replaced by `@circle-fin/onramp-kit` 1.0.3. No artificial timer, invented fee or local success credit remains. The supplied live Circle API key passed the documented read-only `/v1/w3s/wallets` authentication check using the complete `LIVE_API_KEY:` prefix. This proves API authentication only, not Onramp entitlement, KYB/domain approval, hosted payment completion or webhook compatibility. A production SDK launch session was successfully minted for a disposable diagnostic wallet without opening the widget or submitting a payment. The live SDK response did not include a sessionId; the server supplies an internal launchReference in metadata when no provider sessionId exists. It is persisted only when a launch store is configured. This internal reference is not a provider order ID or proof of settlement. The hosted widget and a real deposit have not been tested. Existing Testnet account deposits are unchanged. Mainnet wallet funding links to `/onramp`; Mainnet checkout readiness remains independently gated.

### Deployment configuration

Map the complete issued live key to the sensitive server-only `ONRAMP_API_KEY` deployment variable. Use `ONRAMP_ENVIRONMENT=production` and `ONRAMP_APP_ORIGIN=https://mainnet.mercenta.xyz`. The operator explicitly requested direct-to-wallet funding. Configure `ONRAMP_ENABLED=true` and `ONRAMP_MODE=direct_wallet` to launch the official hosted widget without Mercenta deposit accounting. This mode is limited to the exact production origin `https://mainnet.mercenta.xyz`, requires the server API key and signed-wallet authentication, and never marks a deposit settled or credits the ledger. Customer eligibility/KYC and payment instructions remain inside the hosted provider. `ONRAMP_MODE=recorded` is the default and still requires verified backend reconciliation before production activation. Keep `ONRAMP_WEBHOOK_CONTRACT_VERIFIED` and `ONRAMP_RECONCILIATION_VERIFIED` false: direct-wallet launch does not attest that those integrations are complete. The supplied client key is not used by the standalone Onramp SDK and must not be published in a frontend bundle. VPS SSH credentials are deployment access only, not browser or Vercel application configuration. The original private credentials file remains untracked and is not uploaded with source code.

### Direct-wallet limitations

This is a non-custodial widget launch, not a complete automatic funding-history integration. Users must track the provider's reference and check their wallet; closing the browser does not cancel a bank transfer or prove failure. Do not use browser settlement notifications as financial authority. The hosted widget controls payment-method availability; select Bank Transfer for the BVNK path where eligible. The host does not force a provider or guarantee rails, country eligibility, rates or timing.

When `ONRAMP_DATABASE_URL` is absent in direct-wallet mode, launch attempts use a bounded, best-effort in-memory limit of three attempts per wallet/environment per ten minutes per server instance. It resets on restart and is not a global distributed limit. Circle API rate limits also apply. No launch metadata or session token is persisted in that no-store mode. Configure a durable launch store for global limits/audit metadata; do not claim verified bank-deposit records merely because launch metadata was stored. Recorded production mode still fails closed without its required storage and reconciliation.

### Webhook endpoint reachability

The v2 webhook setup guide requires both HEAD and POST. `HEAD https://mainnet.mercenta.xyz/api/onramp/webhooks` returns 204 with no response body and no side effects, including before event processing is enabled. Mainnet middleware allows HEAD only for this exact webhook route. A successful HEAD check proves the route is reachable, not that a subscription exists, notifications are accepted, or settlement reconciliation is ready. POST remains 503 until the explicit provider contract and durable inbox configuration are ready.

The supplied general webhook guide lists v2 products but does not list Onramp or provide its settlement notification schema. The Onramp lifecycle guide requires backend webhooks for final deposit state. Do not invent event names, treat a Wallets transaction event as an Onramp order, or register a wildcard subscription as proof of compatibility. Confirm the Onramp notification API version, event names, payload fields, order/session correlation, and authoritative status lookup with Circle before implementing the reconciliation worker.

References: https://developers.circle.com/api-reference/webhooks, https://developers.circle.com/api-reference/webhook-endpoints, https://docs.arc.io/app-kit/tutorials/onramp/handle-lifecycle-events.

### Sandbox setup

Configure server-side deployment secrets (never commit a key):

```
ONRAMP_ENABLED=true
ONRAMP_ENVIRONMENT=sandbox
ONRAMP_API_KEY=<whole sandbox kit key including prefix>
ONRAMP_APP_ORIGIN=http://localhost:3000
```

Use your actual exact origin without a trailing slash. Hosted sandbox deployments can use HTTPS. `referrerDomain` is derived from this trusted configuration, never from a client header. Sandbox API and widget origins are paired. Localhost cannot use the production widget. Sign in through the existing wallet challenge before creating a session. Use provider-approved sandbox test details, not real card data.

### Server / client boundary

- GET `/api/onramp/config`: public availability and environment only, no key.
- POST `/api/onramp/sessions`: same-origin request plus valid signed wallet cookie. Strict amount/currency only. The server binds appUserId and destination to the authenticated wallet and restricts assets to USDC on Arc. Arbitrary destinationAddress, appUserId, assets and metadata are rejected.
- Three launch attempts per wallet/environment per 10 minutes. Without a database, sandbox and explicit direct-wallet mode use bounded process-local best-effort limits. Recorded production mode requires durable Postgres.
- Returned session tokens are short-lived and never persisted by Mercenta. Responses are no-store. No tokens or payment data are logged.
- The client dynamically loads the official SDK on Continue, mounts a 720px iframe, and handles initialization, submission, reported settlement, cancellation, expiry, review and provider errors. Close/unmount/wallet changes dispose the widget and abort stale work.
- Browser settlement events are informational only. They do not credit the ledger or write a fulfilled deposit. Payment and identity data stay with the hosted provider.
- CSP additions are scoped to `/onramp`, so existing application RPC connections are not broken.

### Recorded-settlement production blockers — not prerequisites for direct-wallet launch

1. Obtain a production Kit key and confirm bank-transfer eligibility and USDC on Arc availability for your account. Bank transfers and card methods have different enablement requirements: do not treat card-method KYB as a blanket requirement for bank funding. The operator supplied Console evidence showing mainnet keys and bank transfers/domain registration enabled, with business verification optional for additional card methods. Customer identity checks and country/payment-rail eligibility still apply. This page now guides users toward the BVNK bank-transfer path inside Circle's hosted widget; the SDK has no documented force-provider/payment-method construction option, so the host does not invent one or guarantee a provider selection.
2. Configure `ONRAMP_APP_ORIGIN=https://mainnet.mercenta.xyz` and register the exact app hostname in Circle. The server derives the bare referrerDomain from trusted configuration. Additional card-method business approval remains independent from bank-transfer enablement.
3. Provision a separate production `ONRAMP_DATABASE_URL` (Postgres, TLS, least-privilege credentials) and a random 32-byte base64 `ONRAMP_WEBHOOK_ENCRYPTION_KEY` stored securely. Tables initialize on first use; provision/migrate them out of band if runtime DDL is disallowed. Back up and retain encrypted records per your privacy policy. The implementation does not provide retention automation.
4. Confirm the actual **Onramp-specific webhook authentication, payload schema, correlation IDs and delivery policy with Circle**. The public generic Circle v2 signature guide does not explicitly list Onramp. Do NOT assume compatibility. `/api/onramp/webhooks` is a disabled, opt-in Circle-v2 verification adapter, not a verified Onramp webhook integration. If the contract differs, replace the adapter before enabling it.
5. Only for a confirmed Circle-v2 profile, set `ONRAMP_WEBHOOK_PROFILE=circle-v2` and `ONRAMP_WEBHOOK_CONTRACT_VERIFIED=true`. The adapter verifies the raw body against an environment-specific Circle public key; bounds payload size; encrypts and durably records UUID notificationIds; deduplicates same-body replays and rejects conflicting IDs. An acknowledgment means **stored for reconciliation**, not credited.
6. **Implement and test a server-side reconciliation worker** for `mercenta_onramp_webhook_inbox`. This project currently does NOT implement Onramp-specific settlement reconciliation. Validate authoritative provider state, correlate session/environment/wallet/token/chain/amount, reject unknown or mismatched notifications, handle out-of-order/replayed events and provider retries, and apply idempotent transitions. Never credit funds from a browser callback or merely from signature verification. Funding goes to the user's wallet; a custodial ledger credit is a separate integration and must not be assumed.
7. After end-to-end sandbox tests, webhook outage/replay tests and audited production reconciliation are complete, set `ONRAMP_RECONCILIATION_VERIFIED=true`, then enable production. Flags are operator attestations, not proof of completion. Leave them false while any requirement is incomplete.
8. Test actual hosted iframe behavior on Safari/mobile privacy settings, wallet switching, cancellation, pending KYC, failed payment, session expiry and browser closure during deposit. Validate approved domain/CSP. If iframe storage is blocked, use a supported provider popup flow launched directly from a user click; popup fallback is not implemented in this version.

Relevant docs:
- https://docs.arc.io/app-kit/onramp
- https://docs.arc.io/app-kit/quickstarts/onramp-embed-widget
- https://docs.arc.io/app-kit/references/onramp-hosting-requirements
- https://docs.arc.io/app-kit/tutorials/onramp/customize-session-minting
- https://docs.arc.io/app-kit/tutorials/onramp/handle-lifecycle-events
- https://developers.circle.com/api-reference/verify-webhook-signatures
