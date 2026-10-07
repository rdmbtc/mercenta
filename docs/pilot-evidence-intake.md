# External Testnet pilot evidence intake

This is an evidence checker, not an auto-payment script. Do not manufacture business activity, customers, invoices or consent. No real procurement or Mainnet action is enabled.

Keep the business consent record and operational logs private. Supply a local JSON manifest to `node scripts/pilot-evidence-check.mjs --manifest <private-file>`. The schema lives in backend/src/services/pilot-evidence.ts. It requires explicit non-synthetic provenance, owner-attested consent, permission to publish receipt links, and operational event source digests. Each event needs its actual ERC-20 receipt, sender, recipient and exact six-decimal units.

The checker queries two configured Testnet RPC endpoints, rejects platform funding, verifies exact transfer amounts and canonical receipt blocks, and refuses ambiguous evidence. Passing chain evidence does not independently verify business identity or turn test assets into real revenue. No business pilot has been attested by this integration task.
