# Mercenta — Tameion submission dossier

## Current positioning

Bounded digital procurement on Arc: the model proposes a purchase, deterministic server policy limits authority, and payment and supplier delivery are separate evidence records.

## Judge entry points

- Mainnet workspace and embedded Add USDC: https://mainnet.mercenta.xyz
- Testnet operator: https://testnet.mercenta.xyz/app?section=agent-chat
- Source: https://github.com/rdmbtc/mercenta
- Judge quickstart: JUDGE-QUICKSTART.md
- Evidence classification: tameion-evidence.json
- Read-only chain observations: tameion-chain-observations.json
- Reproduce chain checks: `node scripts/verify-tameion-evidence.mjs` from repository root. Node 24 recommended. No signing key needed and no payment is sent.

## Mainnet scope

The reviewed historical checkout transactions are successful native-USDC transfers directly to the merchant. They do NOT call the MercentaCheckout router. Router source/deployment and direct retail transfers are separate facts. Native transfers use 18-decimal value; account records express USDC in exact 6-decimal micro-units.

Add USDC mounts Circle Onramp Kit after authenticated wallet sign-in. The provider supplies funding amount, eligibility, verification and bank instructions. A minted session or browser lifecycle callback is not independently verified settlement or revenue. No completed bank deposit is asserted by this dossier.

## Traction disclosure

The founder reports funding a friend's purchase. Describe it as a **founder-funded assisted pilot**, not an independently funded customer or demonstrated business adoption. Two other linked transfers are owner probes. The public X post is linked in the manifest; its extraction was unavailable during this review. Real invoice and fulfillment evidence still need to be inspected and linked with publishing consent. Mainnet transfers alone do not prove a sale, delivery, agent execution or business identity.

## Agent scope

The documented Business Operator supports model-selected typed tools and bounded Testnet delegation. Its fixture live probe does not prove a deployed customer payment. Test goods are non-redeemable. Mainnet rules-based guidance is not the same as the Testnet model operator. Do not label manual retail purchases as autonomous agent execution.

## Remaining submission gates

- Inspect and redact the actual invoice, obtain participant consent, and connect it to the correct transaction and delivery record.
- Capture a genuine owner-authenticated deployed agent task with its decision, enforced limits, refusal/escalation, and receipt. Do not use mocks as traction.
- Obtain genuine independent business usage or honestly report the current pilot-only stage.
- Record and upload a real demo under three minutes; DEMO-SCRIPT.md is a script, not a finished video.
- Document product and user progress during Tameion rather than attributing the whole existing project to the event.
- Submit the final form at https://forms.gle/BBWrdfuircrKiG2i6 and check the official deadline at https://tameion.thecanteenapp.com/. CLI product/traction updates do not replace final submission.

No guarantee of winning, profit, finality latency, audit status, provider coverage or independent traction is made.
