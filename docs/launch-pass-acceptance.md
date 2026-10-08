# Launch pass: acceptance and remaining runtime gates

This release changes the landing, public catalogue refresh and manual support requests. It does not enable Mainnet payments.

## Source verification

- Backend: 461 tests passed; TypeScript build passed.
- Web: 362 tests passed; lint and production build passed on the final metadata/source-label changes. Docs: 36 tests and production build passed.
- New support POST is nonfinancial, same-origin, HMAC-forwarded, encrypted at rest and rate limited. No public request reader or automatic refund exists.
- Inventory uses conservative stock signals and hides absent denominations/empty region products. A valid empty feed replaces old listings. Cache refresh is coalesced, with no long stale CDN window.
- Motion is user-controlled and respects reduced-motion preferences; the landing journey panel is explicitly illustrative and has no financial API calls.

## Deployment incident / release gate

During this pass the public backend API was unreachable and SSH was also inaccessible from two independent execution environments. DNS resolved, but TLS ended unexpectedly or timed out; SSH ended without a protocol banner or timed out. This is not proof of a supplier stock response. Do not declare current inventory, queue persistence, agent execution or a backend deployment verified while this outage remains.

Restore VPS connectivity using the owner's hosting console, check process/port/TLS/firewall/storage and inspect private service logs without publishing secrets. Do not blindly restart an unresolved financial settlement. Then deploy the tested immutable backend release, preserving the SQLite ledger and making a consistent encrypted/restricted backup first.

## Acceptance after restoration

1. Health 200; private wallet APIs remain 401 for guests; catalogue status ready with a genuine fetched timestamp.
2. Observe two stock refresh cycles. Verify zero/unknown/conflicting options disappear, supported regions update and valid empty inventory is not replaced with old rows.
3. Submit one clearly labelled engineering refund request (no real customer), confirm one encrypted ticket survives restart, retry returns the same ticket, forged signatures/cross-origin traffic fail and no financial ledger row changes. Close the engineering review using the filesystem-owner CLI, not a payment.
4. Confirm owner support staffing and manual refund/reconciliation procedure. SMTP notifications are not configured by this feature; the owner must review the queue and reply manually.
5. Keep Mainnet financial writes closed. Support submission for Mainnet is only unverified claim metadata, not an account bridge.

## Mainnet still requires separate implementation and evidence

- Production runtime/database/secrets/host-only ownership session, with no Testnet account fallback.
- Canonical Mainnet USDC quote/payment/credit/real-order/delivery lifecycle with exact precision, durable idempotency and UNKNOWN outcome quarantine.
- Fresh provider-side spending cap and explicit owner approval for one bounded real canary, plus delivery and manual refund reconciliation proof.
- Validated $10 procurement reserve/circuit breaker, alerts, backup restoration and staffed support.
- Gateway/x402, Onramp, USYC and Borrow are separate acceptance gates. Testnet technical proof and treasury math are not evidence of enabled production financial services.

A green build is source evidence, not operational uptime, pilot consent or approval to move real funds.
