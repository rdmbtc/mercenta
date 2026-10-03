# Commerce completion and hackathon priorities

## Current truth

The connected merchant catalogue is read-only. The separate Test purchase flow uses test USDC and simulated goods. A catalogue feed, a draft JSON manifest and a provider API key are not a real checkout, paid procurement, delivery or customer traction.

## P0 — one real order, correctly

1. **Validate an actual procurement contract.** Merchant-side product/option IDs must map to the chosen provider's IDs, regions and required fields. Do not reuse IDs across providers or assume the legacy generic `/orders` transport matches a real API. Keep provider names/credentials server-side. Verify fresh-price, create-order, order-status, fulfilment and refund schemas; identify permission/IP requirements.
2. **Retail quote and budget policy.** Store immutable, expiring quote with product, region, required recipient fields, source price/currency, actual retail test/real-USDC price, approved markup/FX/fee policy and quantity constraints. A USD feed price must not silently become a USDC invoice. Check per-order/day/month caps, margin and available customer/provider funds server-side.
3. **Customer confirmation.** Present the exact payable amount, fees, delivery conditions and refund rules. Login is not payment consent; a chat request is not payment consent. Only a separate explicit confirmation can proceed. No live supplier USD purchase funded by a simulated customer test-USDC checkout.
4. **Durable attempt / uncertainty.** Reserve budget/credit atomically in the authoritative ledger and persist attempt/ref before sending. Use documented provider idempotency when it exists. If it is undocumented or absent, make a single attempt, keep timeout as UNKNOWN and reconcile manually; never blindly resend. A local unique key alone cannot promise upstream exactly-once semantics.
5. **Delivery and recovery.** Do not mark an accepted/pending supplier response as delivered. Poll the documented status against the original order; encrypt actual codes at rest, reveal only to the authenticated owner, avoid code logging/model forwarding. Verify account top-ups separately. Release reservations/refund only after a verified terminal failure, not an uncertain timeout.
6. **Acceptance evidence.** Cover stale quote, stock changed, insufficient funds, duplicate click, quota/cap violation, request timeout before/after provider acceptance, app restart, pending delivery, terminal failure/refund and owner-only code access. Use real sandbox only if the provider documents one. Otherwise any chargeable validation needs a separately confirmed bounded purchase; none is authorized or executed by this planning document.

**Done means:** a customer can choose a real product, receive a real quote, authorize a real payment, see one tracked order and obtain actual delivery or a reconciled refund. Merely enabling the existing generic transport is not sufficient.

## P1 — agentic sophistication with evidence

Bounded assistant tools: catalogue search → availability/price read → comparison within the buyer's budget → deterministic margin/budget policy → expiring purchase proposal. Explain accepted and rejected options from tool evidence, not invented reasoning. Re-quote before confirmation. Agent output never grants itself transaction authority. Show provenance, policy checks and verified receipt/state.

## P1 — external business pilot

Use one genuine freelancer, reseller or business with consent. Record who they are and proof they exist; film their actual workflow. Keep declared journal notes, deposits, self-wallet transfers and verified customer sales distinct. Capture attributable customer/order/payment/delivery evidence rather than inventing traction. Report real product/traction progress as the event requires. A safe testnet pilot is preferable to an unreviewed real-money launch; mainnet needs its own readiness approval.

## P2 — submission package

Public repository and progress history; readable architecture/authority diagram; deployed demo; contract/wallet addresses with explorer evidence; video under three minutes. The video should show one useful bounded decision, customer confirmation, delivery/receipt and the real business user. Do not present mocks as live execution or self-hosted paid-report calls as external customers.

## Images

The image-source API's product list and the sampled detail response contain no image fields; its public site redirects to sign-in. Need an authorized media export/asset URL mapping or a supported media endpoint. Validate product/region/variant matching rather than merging provider IDs or prices. Use clearly labelled illustrations until real media is obtained; no guessed brand domains, fabricated photos or leaked API credentials in URLs.

## No win guarantee

Priority is end-to-end commerce and attributable business use, not another round of decorative polish. Product progress and evidence can strengthen a submission; rankings depend on the judges and other teams.
