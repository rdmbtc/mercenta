# Mercenta Business Operator — bounded testnet procurement

## Scope and proof

This is a tool-driven procurement workflow, not a chat message claiming that a purchase happened. The model chooses the next typed tool from actual observations; deterministic server policy decides whether that tool may run. Actor-scoped task history records observed tool results and verified order/delivery records.

The source feed currently contains 1,298 received products, not a verified claim of every product the supplier offers. Catalogue USD prices are indicative. Rehearsal checkout is **1.000000 test USDC per unit**, maximum 10 units, and delivers **non-redeemable saved test artifacts**. Real supplier ordering, real invoices, withdrawals, mainnet and live Earn remain disabled.

`agent-operator-live-probe.json` records a successful live-model/read-only-catalogue cycle, using an **isolated in-memory fixture ledger**. Groq selected observed options and requested the server quote; one fixture order was saved with no duplicate debit. This is not a real authenticated production payment, external customer or traction proof. Existing stable provider configuration is used; no credentials are sent to the browser or included in evidence.

## Use in the app

1. Open **Assistant**. Sign in with your wallet to use account tools. Guests may draft only.
2. Describe the product to source, set a task cap, quantity, region and minimum balance to leave on the prepaid account. Wallet and prepaid account balances are separate.
3. Choose **Review the plan first** to stop at a server quote, or **Delegate one test purchase** and explicitly accept the displayed task boundaries.
4. Run the task. Observe balance, saved spending limits, full-catalogue search and available option inspection. A model rationale is not payment evidence.
5. Review mode requires a separate exact-debit/non-redeemable confirmation. Delegated mode may execute one order within its pre-authorized limits. Both recheck current saved budgets, available funds and the remaining-balance floor at execution.
6. Inspect the saved test delivery, order ID and purchase history. No real goods or revenue are implied.
7. Stop a planning task to revoke future execution. If a connection fails, resume the same task or inspect history before starting a replacement.

The permission expires after ten minutes and allows one order. Six durable step claims bound model/tool work. Up to 40 tasks per authenticated account/day. Tasks advance while the Assistant is open; they are not an unattended background daemon. Reopening restores the original task; restart recovery retains original IDs, limits and delivery. An interrupted lease may wait up to 45 seconds before resuming. Already executed orders cannot be cancelled to manufacture a refund.

## Tool and authority boundaries

- `account.balance`: read verified prepaid funds.
- `budget.read`: read saved limits and actual usage.
- `catalog.search`: search the complete received catalogue, with region and availability checks, return a bounded shortlist.
- `catalog.options`: inspect available options of an observed product, never invented IDs.
- `checkout.quote`: quote an observed available option with the exact requested quantity and fixed test pricing.
- `checkout.confirm`: server-only execution after exact quote consent or durable bounded delegation. Not an unrestricted model tool.
- `receipt.verify`: server records saved delivery and ledger evidence, never a model assertion of success.

No arbitrary URL, shell, raw credential, external transfer, real supplier POST or unrestricted signer tool is exposed. Untrusted goals/catalogue strings cannot change execution policy. Tool JSON is strictly validated; model failures are explicitly blocked, not relabelled deterministic responses as AI. Private APIs require the existing wallet-authenticated, body/path/method-bound backend HMAC and are never publicly cached.

## Retry and concurrency

Task creation has a durable request fingerprint. Ambiguous same-form retries use the same request UUID. One atomic lease claims each step, including across restarts. Cancellation invalidates the lease token. Quote, original confirmation ID, debit and encrypted delivery commit in a SQLite transaction; completed confirmation returns the original order and saved codes without a second debit. Append-only events and immutable task identity prevent rewriting permission/history. Current account balance in a history response is current funds, not a frozen historical balance snapshot.

## Circle paid-service path

The same screen offers preparation of a separate **0.001000 test-USDC** margin-scenario report quote. It uses the existing separate agent wallet/Gateway balance and exact payment confirmation. Report preparation does not pay. Gateway acceptance/queued state is not final settlement. The report is a scenario, not verified revenue; Profit First needs separately verified buyer funds and genuine owner signatures.

## Evidence still required for submission

Record a genuine owner-authenticated deployed operator purchase, separate Circle paid-service execution and final matching settlement. Capture an external business's actual workflow and public existence proof; own-wallet funding and fixture/mock tests are not traction. Keep the final video under three minutes. Mainnet remains NO-GO until real fulfillment, financial security, recovery, withdrawal/refund operations and compliance gates are evidenced.
