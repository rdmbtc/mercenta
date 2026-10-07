# Demo Video Teleprompter — AGENT-17 (Demo Narrative Director)

**Pin**: `585d4b4130292d2ae6424ecbd61db9de8524f12d`
**Total duration**: exactly 165 seconds (2m45s), five segments, no other cuts.
**Dependencies**: AGENT-09 (source & policy proof), AGENT-11 (verified evidence manifest + pilot consent).
**Recording state**: REHEARSAL until every `[EVIDENCE ...]` marker below is replaced by an AGENT-11 manifest entry. Markers are never spoken.

## Narration rules (binding)

1. Narrator asserts only events visible on screen during the take.
2. Unverified fact = bracketed `[EVIDENCE n]` note. Not read aloud, never rewritten as a narrator claim.
3. Missing live evidence for a shot → shot stamped `FALLBACK: TESTNET REHEARSAL` on screen and in the margin. Rehearsal still runs full ledger validation and local SHA-256 digests.
4. x402 wording, exact: "x402 payment authorization, EIP-712 typed data, verified by the Gateway". Never called a product quote signature, order signature or receipt unless that exact call is implemented and shown.
5. Forbidden on screen and in audio: edited balances, edited hashes, edited counters, invented explorer links, live USYC claims, pilot/design-partner consent claims. The real blocked attempt and raw tool events are shown instead.
6. No real funds, no Mainnet, no public-network transactions in any take.

## Time-code map (sums to 165s)

| # | Segment | In → Out | Seconds |
|---|---------|----------|---------|
| 1 | Repo, app, evidence surface | `00:00 → 00:30` | 30 |
| 2 | Agent asks, policy resists | `00:30 → 01:00` | 30 |
| 3 | Bounded loop: goal → plan → approval → observed action → receipt | `01:00 → 01:40` | 40 |
| 4 | Gateway x402 authorization & settlement | `01:40 → 02:15` | 35 |
| 5 | Traction & institutional horizon | `02:15 → 02:45` | 30 |

---

## Shot 1: Repo, app, evidence surface

**Time**: `00:00 → 00:30` (30s)
**Fallback**: `FALLBACK: TESTNET REHEARSAL` when testnet RPC is degraded at take time.
**Screen action**: public repository tree → running console on Arc Testnet → evidence surface (raw `scripts/smoke-test-all.mjs` output, then the traction report). Terminal output is the take's own capture, unedited.

### Spoken script (≈60 words)

> "This is Mercenta: a contract-bound commerce gateway for software agents, running on Arc Testnet.
>
> Everything on screen comes from this repository — the console, the ledger, the verification scripts. No composited frames, no retouched output."

`[EVIDENCE 1 — AGENT-11: verified repository/app fingerprint. Absent → keep REHEARSAL stamp, do not claim "verified".]`

---

## Shot 2: Agent asks, policy resists

**Time**: `00:30 → 01:00` (30s)
**Screen action**: developer request (`5000 USDC`) → Gateway return: "USD 5,000.00 violates Agent Settled Order Limit" → deliberate invalid policy attempt → attempt blocked with policy engine error code. Real request/response objects on screen, values unedited.
**Fallback**: `FALLBACK: TESTNET REHEARSAL` when no live request trace exists.

### Spoken script (≈65 words)

> "An agent asks for five thousand dollars. The Gateway does not take the request on trust: it checks the contract-bound policy, and the order is refused, with the error code the developer actually receives.
>
> A second attempt tries to slip past the policy. Blocked again — validation before value transfer."

`[EVIDENCE 2 — AGENT-09: block #1 policy proof + official CLI syntax for the shown request. Absent → do not say "the contract refuses"; say only what the screen shows.]`

---

## Shot 3: Bounded loop — goal → plan → approval → observed action → receipt

**Time**: `01:00 → 01:40` (40s)
**Screen action**, one continuous take, five labelled stages on screen in this order:

1. **Goal** — bounded agent request (amount, counterparty, cap).
2. **Plan** — settlement plan proposed by the operator.
3. **Approval** — policy decision card, verdict read verbatim from UI.
4. **Observed action** — first the real blocked attempt (rejection shown), then the in-limit order executed; raw ledger reserve-lock event in the terminal, id copied from output.
5. **Receipt** — reserve lock / receipt reference opened in the console, id matching the terminal line.

**Fallback**: `FALLBACK: TESTNET REHEARSAL` when no live evidence manifest entry covers this loop.

### Spoken script (≈75 words)

> "Here is the full loop the protocol guarantees.
>
> One: the goal — a bounded order, amount and counterparty fixed. Two: the settlement plan. Three: policy approval, verdict shown as the system returned it.
>
> Four: the action is observed — you saw the blocked attempt first, then the accepted order writing its reserve-lock event to the ledger.
>
> Five: the receipt. Same id, terminal and console agree — the cryptographic evidence surface, not a screenshot."

`[EVIDENCE 3 — AGENT-11: manifest entry tying the shown receipt id to recorded testnet execution. Absent → stamp REHEARSAL, narration keeps "as the system returned it" wording only.]`

---

## Shot 4: Gateway x402 authorization & settlement

**Time**: `01:40 → 02:15` (35s)
**Screen action**: x402 authorization flow — EIP-712 typed data shown, Gateway verification result, then the settlement confirmation in the console with its SHA-256 evidence digest. Any explorer link is opened live, never typed in.
**Fallback**: `FALLBACK: TESTNET REHEARSAL` when RPC/verification path is unavailable.

### Spoken script (≈70 words)

> "Payment is authorized under x402: EIP-712 typed data, verified by the Gateway — an authorization, not a quote signature.
>
> On verification, settlement executes and the ledger closes the order. The confirmation carries a SHA-256 evidence digest; the hash you see is the one the process printed, unedited.
>
> No funds move outside the testnet."

`[EVIDENCE 4 — AGENT-11: settlement receipt + digest + live explorer navigation. Absent → no tx link on screen, no spoken claim that settlement is verified; keep "prints" wording only.]`

---

## Shot 5: Traction & institutional horizon

**Time**: `02:15 → 02:45` (30s)
**Screen action**: traction report generated by `scripts/traction-reporter.mjs` (live run, counters as printed), then Shadow Mode view separating synthetic streams from verified testnet volume.
**Fallback**: `FALLBACK: TESTNET REHEARSAL` when report run fails or numbers are pre-rendered.

### Spoken script (≈70 words)

> "Traction, straight from the reporter script: volumes and verified order counts as the tool prints them — no hand-entered figures.
>
> Shadow Mode keeps synthetic load separate from verified testnet volume, so the dashboard never mixes the two.
>
> Institutional settlement and supply-side categories live behind the same policy wall. Two minutes forty-five: contract-bound commerce, verifiable end to end."

`[EVIDENCE 5 — AGENT-11: consent record for any partner/USYC claim. Absent → no pilot, partner, live USYC or yield wording in narration or captions.]`

---

## Fallback index

| Shot | Condition for `FALLBACK: TESTNET REHEARSAL` |
|---|---|
| 1 | testnet RPC degraded / repo not verifiable |
| 2 | no live request trace |
| 3 | no AGENT-11 manifest entry for the loop |
| 4 | verification path or explorer unavailable |
| 5 | reporter run fails or counters pre-rendered |

## Verify

```
node scripts/dispatch-validate.mjs --task AGENT-17
```

Expected: `{"task":"AGENT-17","status":"STRUCTURAL_ONLY", ...}` exit 0. Structural pass is not execution or financial evidence.

## Prohibited content checklist

- [ ] No edited balance / hash / counter anywhere in the take
- [ ] No `[EVIDENCE ...]` marker spoken aloud or rewritten as a claim
- [ ] x402 never described as a product quote signature
- [ ] No live USYC, pilot or partner-consent claim without AGENT-11 manifest entry
- [ ] Blocked attempt visible before every successful order
- [ ] Total runtime exactly 165s; no sixth segment
