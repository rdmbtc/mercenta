# VPS recovery: deployment and bounded acceptance

## Deployed backend

Backend source release: `f2eb06f2edd686e4f3ee4738a10678b8c5a777f6`. Public and local `/api/health` returned 200 with Arc Testnet chain ID 5042002. All 475 backend tests passed on the VPS; backend and Circle-ops TypeScript builds passed before switching the release symlink. No database snapshot was restored over the live ledger.

A consistent SQLite snapshot was encrypted with AES-256-GCM using a dedicated HMAC-derived backup domain and a server-held key. The persisted encrypted file was subsequently decrypted into a protected temporary file and passed SQLite integrity verification. The temporary plaintext restore was removed. This is a local restore check, not an offsite disaster-recovery guarantee.

## Model switch result

The temporary compatible-model configuration was applied privately, but it failed acceptance: the VPS endpoint timed out; an independent environment received HTTP 403. The cause of that 403 was not established. Only the five model environment settings were rolled back; financial settings and the new backend release were preserved. The previous provider registry then returned a successful synthetic guest response: HTTP 200, `llm-read-only-preview`, authority `READ_ONLY`, no purchase plans. Coach and finish-only operator responses passed their strict schemas. No agent tools or financial actions were executed by the schema probes. These probes do not certify a complete procurement task or sustained provider uptime.

## Catalogue

Two backend refresh observations returned `ready` with advancing fetched timestamps. The observed raw feed contained 1309 products and 7586 denomination options. The public browse endpoint returned `live:true`, `sourceStatus:ready`, 1179 regional products and positive available-option counts for every returned row. Three sampled detail responses contained only available denominations. Counts are observations, not a completeness or future-stock guarantee. Real purchasing remains disabled.

## Manual support

One clearly labelled internal engineering request was submitted without a real order or payment. Signed backend submission and replay returned the same ticket. Stored payload was encrypted; unsigned and forged-signature requests were rejected. Public web submission returned 202 and the same ticket; an untrusted Origin returned 403. The ticket survived a backend restart and was closed by the local owner-only review mechanism. `refundExecuted:false` throughout. Orders and ledger-entry counts were unchanged by this acceptance sequence; SQLite integrity was `ok` and journal mode `wal`. No email delivery is claimed.

## Circle read-only verification

The configured wallet identity, live Gateway balance read, owner-pinned unpaid x402 402 challenge, both Testnet RPC chain IDs and the historical funding receipt all passed. No signature, broadcast or new payment was performed. Existing funding proof is not business traction or a new paid-resource settlement.

## Frontend rendering correction

Integration checks exposed a catalogue hydration mismatch: Node and Chrome ICU versions generated different HK/PS region names. Explicit English/Russian labels and regression tests remove that dependency for the observed mismatches. The flagship landing and payment boundaries are unchanged. Final frontend verification is recorded separately after build/deployment.

## Remaining release gates

Mainnet financial APIs remain closed. Real purchasing, production custody/runtime/accounting, a freshly approved bounded canary, exact delivery/refund reconciliation, operational monitoring and customer-policy acceptance are still required. No external business pilot or revenue is claimed. The temporary provider must pass server-side acceptance before any future switch; rotate credentials previously shared outside the private secret store.
