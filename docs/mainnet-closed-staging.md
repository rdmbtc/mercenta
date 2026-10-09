# Mainnet closed staging: release handoff

This is a **closed engineering environment**, not a production commerce launch. No public financial route, signer, purchase call, deposit, automatic refund or customer balance is enabled. A ready host is not a ready payment product.

## What this change provides

- Dedicated entrypoint `backend/src/mainnet-staging-server.ts`, loopback port 3014, separate system user and data directory. It never imports the Testnet config, signer or supplier purchase adapter.
- Isolated SQLite WAL/FULL store. It refuses a Testnet path, foreign tables or another network marker. It does not copy customer balances.
- Quote binding to owner, merchant, SKU, region, quantity, chain, micro-USDC amounts and expiry. One reference cannot silently adopt another request body.
- Read-only payment receipt verification through the existing two-witness Mainnet verifier before atomic transaction attribution. One transaction cannot pay for two orders. This is bounded to the one-USDC canary; it is not general public checkout.
- Reserve admission under an immediate transaction, including outstanding reservations, preserving at least $10. Unknown, future or stale upstream observations are rejected. This is only a store gate: authenticated balance fetching and submit-time rechecking still need production integration.
- Durable procurement intent before external I/O. Unknown outcomes retain reserves and forbid another submission. This module contains **no external procurement I/O** and no complete reconciliation/delivery implementation.
- Append-only state events and idempotent manual refund-review requests. **No refund transfer occurs.** Only Mercenta Support and the owner may approve and issue a real refund.
- Atomic double-entry journal: verified customer payments debit USDC cash and credit customer liability; exact full delivery releases the liability into revenue. USD supply costs use a separate currency subledger, never an implicit USD/USDC conversion. Receipt attribution, state changes and journal inserts roll back together on failure. These are transaction deltas, not a verified opening wallet/supplier balance or tax/fee/FX report.
- AES-256-GCM delivery custody binds ciphertext to chain, order, owner and immutable quote using authenticated data. Full delivery must match reference, SKU, region and procurement cost; partial delivery is not recognized as revenue. Repeat delivery cannot book twice or substitute another code. No plaintext is returned by the sealing action. The authenticated adapter/customer delivery route remains unwired, and no TEE or purchased-credential integration is claimed.
- Read-only recording of an already settled **manual** refund: two witnesses must confirm the exact merchant-to-customer amount. It books a liability release (undelivered) or sales return (delivered) once. It never initiates a refund. Refunding an unknown procurement deliberately leaves the supply reservation locked for separate reconciliation.

## Closed deployment

The systemd unit is `ops/mainnet/mercenta-mainnet-staging.service`. Install an exact tested Git revision in `/opt/mercenta-mainnet/releases/<revision>/backend`, with a read-only `current` symlink. Use a separate `mercenta-mainnet` Unix user and `/var/lib/mercenta-mainnet` mode 0700. No operational env file is attached. The unit denies access to the Testnet env and data directories. Do not publish port 3014 or add a financial reverse proxy.

```sh
systemctl start mercenta-mainnet-staging
curl --fail http://127.0.0.1:3014/api/health
curl --fail http://127.0.0.1:3014/api/readiness
```

Health must report chain 5042, WAL, integrity `ok` and payments/signing false. Unknown GET and every financial POST route must return 503. The separately mounted identity-only `/api/auth/` routes may issue and verify wallet challenges, read a session and revoke it; they never grant spending permission. The HTTPS proxy exposes only these four identity actions. See `mainnet-canary-integration.md` for the tested canary contract, which is not instantiated by this closed executable. Testnet port 3013 must remain chain 5042002. A restart must retain the database; do not wipe it to obtain a passing check.

## Still blocking money (in dependency order)

1. Establish independent production custody, scoped owner session, encryption and proxy secrets. Verify merchant recipient and provider production entitlements privately. Do not reuse Testnet balances, cookie domain, signer configuration or session keys.
2. Integrate fresh authenticated stock/cost/balance quotes, reserve rechecks, payment verification, provider-side spending caps, deterministic lookup-only recovery and exact real encrypted delivery.
3. Integrate the tested journal with production reconciliation, actual opening balances, fees/FX and manual refund authorization/execution. Journal and encrypted custody modules now exist, but a staging test is not acceptance of the complete live financial workflow.
4. Prove a consistent encrypted restore on a separate instance, alert delivery to a real operator, downtime reconciliation and support/refund obligations. An empty staging database restore does not prove customer recovery.
5. Obtain fresh owner authorization for one identified SKU/region/recipient, quantity one, exact sale/cost, procurement <= $1, payment <= 1 USDC, separate approved gas ceiling, expiry <= 10 minutes. Abort if price changes or the post-reserve balance falls below $10.
6. Execute one real bounded canary only after 1–5 pass. Review exact receipt, actual delivery and accounting with the owner. Keep the public site closed until this evidence passes; open only an allowlisted beta first.

Circle Gateway/x402, Onramp, USYC Earn and Borrow have independent acceptance gates. Bytecode presence and a positive balance do not prove all four work in production. No yield, immediate redemption, MPC custody or hardware enclave claim is made.

The launch date is a target, not an override of these controls. Existing customer orders/refund obligations must remain accessible when new purchases are paused. Never rollback a financial DB snapshot after money moves; preserve settlements and liabilities.
