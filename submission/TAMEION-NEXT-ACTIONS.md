# Tameion: highest-impact remaining evidence

The goal is a strong, checkable submission—not a claim that winning is guaranteed. Read `JUDGE-QUICKSTART.md` first. Existing code and real evidence should be presented separately from simulations and roadmap.

## 1. Close the credential incident before inviting buyers

The fulfillment runtime previously embedded a supplier credential and a historical voucher seed. During source inspection those appeared in diagnostic output. They must no longer be treated as private. The credential has been moved out of source into a private server file; this does NOT revoke the old credential. Rotate it in the supplier console, install the replacement securely, revoke the original, and inspect provider activity. Do not paste it in chat, put it in git, or send it to judges. If the old voucher is unredeemed, consult the provider about replacement; do not publish its value.

The public history endpoint has been changed to deny anonymous requests. New frontend retail routes require a signed wallet session, same-origin writes, a signed live-price quote, payer ownership and adequate exact payment. A durable claim prevents automatic repeat procurement after uncertainty. These changes are targeted hardening, not a comprehensive security certification.

## 2. Turn the existing mainnet invoice into independently checkable evidence

Prepare one redacted invoice/provider receipt, exact transaction hash, amount, item, supplier order/reference and delivery outcome. Keep the voucher/PIN and recipient identifiers hidden. A chain transfer proves payment, not redemption. A browser history record is not a provider invoice.

The friend purchase is a **founder-funded external-user pilot**, because the founder supplied the money. The user interaction and posted feedback can still demonstrate usability. Do not describe it as independently funded customer demand, organic revenue or autonomous router execution. Obtain permission before attaching identifiable feedback or a recording.

## 3. Capture one actual agent workflow—not just chat

Record the existing Testnet agent making a business decision: goal and spend cap → live supplier search → concrete comparison/choice → policy accept or block → authorized execution → auditable result. Show the agent's inputs, decision and real tool calls. If a human must approve, show that approval honestly. Mainnet direct merchant checkout is a separate retail path; it is not evidence that the agent autonomously executed the five-step router policy.

The recorded Circle/x402 Testnet acceptance in `docs/verified-testnet-x402.md` is technical evidence. It was an internal owner-authorized acceptance run, not customer revenue and not a guarantee of current uptime. Never imply Circle MPC when the recorded signer was a local EOA.

## 4. Seek genuinely independent usage

Invite a small number of users who actually need a supported product. Let them choose whether to buy with their own funds; no manufactured reviews or required positive posts. Log unique consenting users, attempted/completed purchases, provider delivery confirmations, support issues, founder subsidies and repeat usage separately. A few well-documented independent purchases are stronger than inflated wallet or transaction counts.

## 5. Make the final submission easy to verify

- Public repository and deployed app links.
- A real demo video under three minutes, following `DEMO-SCRIPT.md` with the distinctions above.
- Redacted mainnet invoice plus explorer evidence.
- Circle technical acceptance evidence and precise environment labels.
- A concise account of what changed during the event.
- Final submission form completed; arc-canteen product updates are not the final submission.

## Suggested product update draft

Mercenta added an embedded Add USDC flow powered by Circle Onramp Kit and shipped wallet-bound mainnet purchase history, signed exact-price quotes, payer/payment checks, pending-delivery recovery and redacted receipts. The direct retail path is separate from the Testnet agent ledger. Our mainnet evidence includes a founder-funded external-user pilot; we do not count it as independently funded demand. A bank deposit or full agent-to-mainnet checkout is not claimed without its own evidence.

This is a draft. Attach verified invoice/video links before posting. It intentionally does not name the upstream supplier or make unverified architecture claims.
