# Mercenta Arc Testnet deployment

## Live topology

- App: https://app.mercenta.xyz (Vercel, project `mercenta`, root `web`). Host-only rewrite `/` → `/app`; the marketing domain keeps its landing page.
- Docs: https://docs.mercenta.xyz/docs (Vercel, project `mercenta-docs`, root `docs`).
- Backend: https://api.mercenta.xyz (Debian 12 VPS, nginx → loopback :3013). The TLS certificate also covers the temporary sslip.io address used for initial smoke tests.
- Account receiver: `0x58863e4a739dA0e62c2Eba258B7783e95D5C48cE`, Arc Testnet chain 5042002 only.
- Source releases: `/opt/mercenta/releases`; active symlink `/opt/mercenta/current`.
- Primary: `/var/lib/mercenta/mercenta.sqlite`, persistent SQLite WAL. The existing local database was migrated using a consistent online backup. Never run two writable primaries for the same receiver.
- Private backend environment: `/etc/mercenta/backend.env`, root:mercenta, mode 0640. No private keys are installed for the receiving wallet.

## Supervision and recovery

`systemctl status mercenta-backend` / `systemctl restart mercenta-backend`

Unprivileged service, Node heap cap 512 MB, RSS soft guard 768 MB, cgroup MemoryHigh 850 MB / MemoryMax 1100 MB, maximum 32 admitted requests. systemd restarts failed/OOM-killed processes. Monetary mutations fail closed under pressure; a restart does not authorize spending or retry unknown supplier outcomes.

`GET /api/health` and `GET /api/resilience/status` contain no credentials. Do not copy private environment files or full logs into public tickets.

## Backups

`systemctl start mercenta-backup` creates a consistent SQLite `.backup`, compresses it with owner-only access, and retains 14 days in `/var/backups/mercenta`. `mercenta-backup.timer` runs daily. Backups were installed and a first backup was created. These backups survive temporary external-store expiry, but NOT total VPS loss. Configure long-lived encrypted off-host backups before handling real value.

Restore procedure: stop the backend; preserve the current DB/WAL/SHM as a recovery set; unpack the selected backup into a separate file; run SQLite integrity checks; replace the primary and remove obsolete WAL/SHM only while the service is stopped; set owner mercenta; restart; reconcile journal and on-chain evidence. Never merge two independent monetary histories.

## Temporary stores (one-month provider lifetime)

Redis and PostgreSQL are optional read-only mirrors with a one-hour maximum age. They are never the ledger. Responses carry `stale`, `readOnly`, `asOf`, and `SNAPSHOT_NOT_SETTLEMENT`; the UI blocks monetary actions. Missing snapshots return an error instead of fabricated funds. API keys and deposit verification are never cached.

`TEMP_SERVICES_EXPIRES_AT` is mandatory. Initial deadline: 2026-10-31T18:31:58Z, based on setup +30 days, NOT a verified provider billing date. Set it earlier if Aiven expires earlier. Clients shut down at expiry; primary balances and auth remain on the VPS. Seven-day warnings are exposed by status/Settings. Provider outages before expiry are supported.

Redis verified TLS is connected. PostgreSQL is now ready: the user-provided Aiven CA was installed and a verified-TLS connection was tested. Obtain the Aiven public CA certificate, put it on the VPS (e.g. `/etc/mercenta/aiven-ca.pem`), set `TEMP_POSTGRES_CA_PATH`, and configure the same certificate as `TEMP_POSTGRES_CA_BASE64` in the Vercel server environment. Restart/redeploy and confirm `postgres: ready`. NEVER set rejectUnauthorized=false or disable TLS validation.

## Vercel configuration

Server-only production environment: `BACKEND_URL`, `BACKEND_PROXY_SECRET` (same as backend), `ARC_SESSION_SECRET`, optional `TEMP_REDIS_URL`, `TEMP_POSTGRES_URL`, `TEMP_POSTGRES_CA_BASE64`, `TEMP_SERVICES_EXPIRES_AT`. None use NEXT_PUBLIC_. Wallet challenges are stored/verified on the backend; Vercel signs session cookies only after a verified proof. App auth is not backed by ephemeral serverless SQLite.

Deploy from the repository root with the correct Vercel project ID because project Root Directories are `web` and `docs`. Stage only public frontend/docs sources; exclude environment files, backend, work, databases, dependencies, and private backups. `.vercelignore` enforces exclusions. The local portal launcher now starts web/docs only and targets the VPS.

## Verified / still gated

Builds and tests passed. Public smoke verified wallet signature auth, nonce replay rejection, CSRF origin checks, zero account balance, configured receiver, deposit intent without credit, settings persistence, account reads, scoped key creation/revocation, and sanitized branded docs. Controlled backend restart verified Redis fallback through the public BFF, read-only labels, blocked writes, no cached API keys, and restoration of fresh reads. A later funded acceptance test confirmed an 11-test-USDC treasury-to-buyer transfer, a 10-test-USDC buyer deposit, and two simulated orders (Shop + API Direct Top-Up). No real goods purchase was executed.

Cross-chain credit, fiat Onramp, withdrawals, real goods fulfillment and Mainnet remain disabled until reviewed integrations and evidence are supplied. The funded Arc deposit/receipt acceptance test is complete; this is not a Mainnet or real-goods release. Support contacts are not supplied.

Rotate passwords and service tokens shared in chat after handover. Do not rotate encryption/signing keys blindly: retain the required migration/recovery plan. Credentials are intentionally absent from this document and ops scripts.

## Funded test evidence

Correct RPC: https://rpc.testnet.arc.network, verified chain 5042002. Buyer: `0x46a59E6d774cD7eb722B30fFc3425F8e69A7Da54`; receiver: `0x58863e4a739dA0e62c2Eba258B7783e95D5C48cE`. Buyer key is kept only in protected `.local/arc-test-buyer.json` on the user machine; the supplied treasury key is never deployed.

Deposit: https://testnet.arcscan.app/tx/0x3646bf586aaf64a182d7b986b1865dad1ff980150471e2ea3badca9d7eea258c

Account credit 10.000000 USDC; spend 6.805400 USDC; available 3.194600 USDC; reserved 0.000000. Two orders are simulated fulfillment only. Wallet gas reserve is distinct from account balance. Receipt success/canonical block/two confirmations, deposit replay, both order idempotency checks, API bearer revocation and UTC dashboard ranges were checked.
`nPublic PostgreSQL-only BFF failover was also verified after the CA deployment: the buyer Redis cache entry was absent, PostgreSQL served the owner-bound read-only 3.194600-USDC snapshot, writes returned 503, primary recovery restored fresh reads, and no extra chain transfers occurred.

## Agent model registry
Set server-only `LLM_PROVIDERS_FILE=/etc/mercenta/llm-providers.json`. Keep the file root:mercenta 0640; never copy it into the repository or Vercel. The registry supports Groq/OpenAI-compatible, Gemini generateContent, Mistral and OpenRouter adapters. The server validates fixed HTTPS endpoints and strict intent JSON, with a 12-second total budget and bounded response size. Provider 429 responses honor Retry-After and do not rotate keys to evade quotas; other providers can serve legitimate failover. Monetary tools still require independent confirmation and deterministic ledger checks. Historical responses keep their original rules/LLM mode; new messages use the configured providers. All chat history is wallet-authenticated, and known registry secrets are rejected before persistence or provider calls.
