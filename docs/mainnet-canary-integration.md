# Mainnet identity and one-order canary integration

**Money state: CLOSED.** This change adds real identity routes and a contract-tested orchestration module. It is not a completed live purchase, a business pilot or public checkout.

## Identity is not a spending grant

`MainnetWalletAuth` uses a separate Mainnet database namespace, a fixed Mainnet origin, an unpredictable five-minute nonce, and a message explicitly naming chain 5042. The wallet signs identity only. Nonces are consumed atomically; sessions last fifteen minutes and store only token hashes.

The browser uses `__Host-mercenta-mainnet-session`, `Secure`, `HttpOnly`, `SameSite=Strict`, path `/`, no Domain attribute. It never stores a bearer token or key in localStorage. Identity responses contain no session token. Signing in does not authorize purchases, deposits, token allowances or refunds. No server signing key is provisioned by this change.

### HTTPS identity endpoints

The existing API TLS gateway forwards **only** `/mainnet-auth/{nonce,verify,session,logout}` to the isolated Mainnet service's `/api/auth/` namespace. It does not forward a Mainnet order/procurement route to Testnet. Every identity request requires the exact Origin `https://mainnet.mercenta.xyz`. CORS allows only that origin, with credentials; sibling Testnet and arbitrary sites are rejected. This public authentication flow uses wallet ownership proofs, not a shared Testnet proxy key.

- `POST /mainnet-auth/nonce`: `{address}` → `{nonce,message,expiresAt,chainId:5042,paymentsAuthorized:false}`.
- `POST /mainnet-auth/verify`: `{address,nonce,signature}` → identity metadata and a host-only session cookie.
- `GET /mainnet-auth/session`: identity availability and authenticated wallet, never a balance or spending permission.
- `POST /mainnet-auth/logout`: revokes the session and expires the cookie.

These four identity routes are not financial routes. All order, deposit and procurement HTTP routes remain closed. The EOA signature format is supported; contract-wallet/ERC-1271 sign-in is not claimed. The frontend shows a separate read-only sign-in control; the original landing and Testnet wallet/session are untouched.

## Owner-authorized canary module (not exposed as public checkout)

`MainnetCanaryOperator` connects the existing pinned Public API transport to the isolated order store:

1. Read the exact allowlisted voucher, stock and region. Compute an integer quote under an explicitly configured USD/USDC pricing policy, with at least 15% gross margin before separately disclosed fees. An owner-fixed peg policy is not advertised as a live FX feed.
2. Require an EIP-712 owner signature tied to chain, merchant, customer, immutable quote digest, order, exact cost/sale, nonce, gas ceiling, expiry and deliberate voucher receipt. Sign-in signatures and LLM text cannot substitute for this permission. The original signed grant is stored encrypted, not in public trace data.
3. Verify exact payment using two canonical witnesses. Preserve received-payment liability even if gas exceeds the approved cap; do not procure in that case. Native fee wei are recorded separately, not added as a second USDC balance or charged to merchant books as customer gas.
4. Recheck fresh stock, price, supplier cash, outstanding reservations and an independently verified exact provider-side spend cap. Require the server-owned release evidence, approved owner/merchant and exact server cost/sale pins. Preserve the $10 floor.
5. In one immediate transaction, consume the grant, claim the lifetime one-canary slot, reserve cash and persist the outbound attempt **before** purchase I/O.
6. Make exactly one purchase POST. Timeout or malformed charge enters unknown; restart/retry uses lookup only. The slot cannot be reset by deleting a row.
7. Bind the original order reference, denomination and exact provider debit before deliberately receiving one voucher. Partial, wrong-reference, wrong-cost or masked delivery is quarantined. Seal the code in encrypted custody and book delivery atomically; return metadata, never plaintext to the agent.

Already-attempted orders can still be reconciled after grant expiry, a pause or removal from the new-purchase allowlist. Refunds remain owner-issued through Mercenta Support. The module records verified manual refunds but never sends them.

`mainnetWitnesses()` pins the two Mainnet RPC URLs in code, uses read-only clients with zero automatic retries, and never imports a signing client. Caller-supplied witness URLs are not accepted by this factory.

## Not yet claimed or activated

The closed executable does **not** construct `MainnetCanaryOperator`, load a purchasing key, mount canary financial routes or automatically arm a launch policy. The supplied test transport is synthetic; a passing contract flow is not a real delivered item.

Before an actual canary: confirm the production owner and merchant addresses, private custody/permissions, actual provider-side cap evidence, reconciled opening balances/fees, customer restore and real alarm delivery. Then integrate the protected canary routes and obtain the owner's fresh exact permission. Keep public checkout closed until payment, real delivery and manual refund acceptance pass.

No new Mainnet purchase, transfer, refund or external pilot is claimed. Gateway/x402, USYC, Borrow and Onramp still have their own production access and acceptance requirements.
