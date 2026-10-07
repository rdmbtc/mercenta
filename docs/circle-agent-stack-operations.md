# Circle Agent Stack: operational verification

## Scope and authority

Mercenta uses Circle Gateway and x402 batching SDKs on Arc Testnet. A funded wallet, a valid unpaid 402 challenge and unit tests are separate facts: none alone proves paid settlement or external business traction. Mainnet, live procurement, lending and yield execution remain disabled.

The server supports an existing local EOA or a Circle developer-controlled MPC wallet. Local EOA is server custody, not MPC and not an on-chain delegated wallet. Configure `CIRCLE_AGENT_CONFIG_FILE` with the existing private JSON file validated by `backend/src/services/circle-policy.ts`. Never place API keys, entity secrets or private keys in chat, Git, frontend variables or submission files. Do not generate a replacement identity for an already-funded wallet.

The configuration binds the owner, wallet, exact HTTPS service URL, recipient and per-payment ceiling. Keep execution disabled until the configured signer is verified and the owner authorizes the bounded Testnet request. Default service: `mercenta-margin-report`, `https://api.mercenta.xyz/api/x402/margin-report`, 1000 micro-USDC. This is an internal test service, not customer revenue.

## Read-only checks

After building backend, run `node scripts/circle-gateway-readiness.mjs`. It cannot sign or broadcast. It checks live Gateway balance, two RPC chain IDs, the existing public funding receipt, and an unpaid x402 challenge. Without private configuration, the challenge is protocol-only and its recipient is not owner-pinned. The report remains PARTIAL; the command exits nonzero instead of claiming end-to-end payment readiness.

The configured secondary local RPC was selected from the public Arc Testnet registry and checked for chain ID 5042002. Distinct endpoints do not by themselves establish administrative independence of operators. Deployment must carry both vetted RPC settings separately; this task does not modify production environment variables.

## Paid lifecycle

Use an authenticated owner session and the configured wallet. Prepare the exact quote, review network/recipient/resource/amount, confirm explicitly, retain the nonce and idempotency receipt. Gateway acceptance is not Arc settlement. Quarantine unknown results; reconcile the original operation rather than generating another payment. Never infer paid execution from the unpaid challenge check.

## External pilot

See `pilot-evidence-intake.md`. Real business consent, operational logs and actual mirror receipts must be supplied; platform funding is rejected by the pilot checker. Only owner-attested provenance plus independently checked chain transfers can produce the evidence report. Business identity is not independently verified by a JSON manifest. No external pilot is claimed by this task.

## Supplier origin migration

The server-only `SUPPLIER_API_URL` must have an exact `SUPPLIER_ALLOWED_ORIGIN` pin. Missing or mismatched pins block credential-bearing requests. Copy the vetted origin from the existing private server configuration, never from client input. A local origin pin has been migrated without changing credentials or execution flags; production migration is still required before deploying the updated backend.
