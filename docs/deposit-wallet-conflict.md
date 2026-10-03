# Deposit receiver / signed-in wallet conflict

## Diagnosis

The production deposit-intent request reached the backend and returned HTTP 400. A read-only metadata check found that the most recent successfully verified wallet was the configured receiving wallet. The existing `createDeposit` guard rejects a receiver equal to the authenticated actor wallet with `DEPOSIT_RECEIVER_INVALID`, before creating an intent or changing the ledger.

A self-transfer cannot provide new backing for prepaid customer liabilities. This guard must not be removed or worked around by assigning an artificial balance. Production database permissions, schema and SQLite quick integrity check were normal. No credentials, wallet challenges, signatures or private account data are published here.

## Interface correction

- The intent form now detects equal sender/receiver addresses case-insensitively and explains the conflict before any request.
- The create button is disabled for the conflict. An explicit “Sign out to change wallet” action closes the dialog and invokes the existing wallet sign-out control. The user selects another wallet they own in MetaMask and signs in again; this is not a payment.
- Amounts are validated before submitting: positive, decimal point, up to six decimals, no exponents/ambiguous commas and no more than 1,000,000 test USDC. No floating-point rounding is used.
- Recognized deposit errors receive meaningful English/Russian messages instead of an opaque refresh instruction. Unknown errors remain generic, not raw exceptions.
- Concurrent duplicate clicks are blocked. An ambiguous retry in the same unchanged form reuses the same request ID. Check funding history before closing/restarting the form after uncertainty.

## Correct user flow

1. Sign out of the receiver wallet; choose a **different wallet you own**, with Arc Testnet USDC and enough for gas, and sign in again.
2. Create the deposit intent. Creating it moves and credits no funds.
3. Send from that same signed-in wallet to the intent's displayed recipient. Wait for two confirmations and verify the transaction.
4. Credit is shown only after backend verification. MVP withdrawals remain disabled; test assets only.

## Financial release boundary

Backend financial/configuration code is unchanged. No merchant-address change, production balance adjustment, test funding, deposit confirmation, real supplier order or mainnet activation is part of this fix. React interaction tests use local mocked callbacks; the backend guard regression uses an isolated in-memory database, never a forged production session. Successful user-funded production checkout is not claimed by these tests.

## Verified release

208 frontend tests and 138 backend tests passed. Local and published frontend production builds passed. Seven guest deployed checks passed, preserving private guest balances, funding guidance, the 24-card artwork-first catalogue and absence of runtime errors or mutating requests. Self-wallet blocking, valid intent creation callbacks and duplicate/retry behavior were tested locally with mocks; no production wallet session was impersonated. A first unconstrained frontend test run hit a catalogue-fixture timeout under concurrent backend-test load; the complete suite passed with two workers and a 20-second test timeout, with assertions unchanged. See `deposit-wallet-conflict-qa.json`.
