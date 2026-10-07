# Catalogue and assistant refinement — 2026-10-03

> Follow-up: authorized supplier access is now connected. See [the current catalogue report](./supplier-authorized-catalog.md). Procurement and mainnet remain disabled.

## Shipped

- Shared product imagery in the app, public catalogue and exact order-review dialog: 16 original local WebP illustrations. Covers are explicitly illustrative, **not** official artwork, supplier product photos or delivery codes.
- Reduced catalogue marketing noise; consistent search/category controls, product metadata, price/region hierarchy and clear source status. Desktop and 390/360px layouts checked.
- Separate supplier read-only view. Server-held supplier credential, bounded/validated response, short cache and safe public metadata. No invented stock, currency conversion, pagination or claim of full inventory.
- Working guest help through the backend and official configured model providers. Final live request used **Groq**, returned `READ_ONLY`, and produced zero purchase plans. Authenticated explanatory chat also updated; existing monetary confirmation boundaries remain.
- Guest quota: five questions per signed browser session/day plus shared 100/day safety cap, request deduplication and credential rejection. Upstream provider cooldowns retained; no key rotation to evade quotas.
- Verified product facts supplied to the model, readable safe bold formatting, response feedback and explicit untrusted-guidance provenance. Budget saving is a server request after wallet login, not a wallet payment. Models can still make mistakes; the backend—not prose—enforces budgets and authority.
- Assistant documentation published with the same boundaries.

## Verification

Backend: **124** tests passed, build and Circle ops typecheck passed on VPS. Web: **163** tests passed, TypeScript/build passed. Docs: **34** tests passed and build passed.

Final live checks: **38/38** passed; narrow-layout/documentation checks: **6/6** passed. No JavaScript errors or financial mutation requests observed. Product images loaded, creator review kept the exact **1.532000** total, guest could not confirm a purchase, Escape dismissed review. Actual guest UI send returned Groq-backed help; provider, read-only authority and zero plans checked. Final Russian answer reviewed for current-month behavior and wallet login before saving; this is not a guarantee of every model statement.

No wallet-authenticated purchase, supplier procurement, paid x402 call or on-chain transfer was executed during this phase. SQLite was backed up online and checked; configuration, provider credentials and signer were not changed. A final activation permission issue triggered rollback; source service-group readability was corrected and the checked release reactivated successfully.

See [machine-readable evidence](./catalog-ai-refinement.json).

## supplier blocker — not complete

The configured read-only endpoint `https://supplier.io/api/v1/services` returned **403** with its configured API-key header. A separate read using the legacy Bearer auth returned **401**. This does not establish whether the cause is credential validity, permission or provider IP policy.

**No real supplier catalogue or supplier imagery was imported.** Coverage stays `unverified`. Illustrative examples are unavailable and are not presented as supplier inventory. The transport/parser still requires validation against the provider's actual authorized response and documented pagination before anyone can claim all products are synchronized.

Needed to finish: authorized supplier catalogue access (including any IP allowlist requirements), official schema/pagination documentation or an official export. Do not put credentials in the public repo or chat. Live procurement must remain off until inventory, exact pricing, fulfilment/refund/idempotency behavior and delivery handling are verified.

## Mainnet boundary

Arc Testnet only; test-USDC transfers and simulated digital goods are separate concepts. Mainnet, redeemable supplier codes and live Earn remain disabled. These changes are not a production launch/security audit or proof of customer traction. Rotate credentials previously exposed in chat before a real-money rollout.
