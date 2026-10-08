# Mercenta manual refund review

`https://mercenta.xyz/refund` files a support request, not a payment, automatic credit, refund promise or proof of order ownership. Mainnet selection is metadata only. All decisions and any actual refunds are handled manually by the owner through Mercenta Support (`support@mercenta.xyz`). Statutory consumer rights are not waived by the form.

## Queue and review

Requests are durably saved in SQLite, encrypted using an independently derived AES-GCM support key. No public ticket list or read endpoint exists. Input is size-limited and validated; contact/source quotas persist across restart; retry IDs return the same ticket and changed submissions conflict. Request payloads are excluded from server logs. Never submit purchased codes, passwords or wallet secrets.

On the backend host, use the service user's environment and protected database:

- `node dist/cli/support-refunds.js list` lists only references/status/timestamps.
- `node dist/cli/support-refunds.js show <ticket-id>` decrypts one request for the filesystem-authorized operator. Run only in a private terminal; do not paste output into chats or public logs.
- `node dist/cli/support-refunds.js review <ticket-id> IN_REVIEW` records a review event.
- `node dist/cli/support-refunds.js review <ticket-id> CLOSED` closes the review; it **does not** mean paid and **does not** move funds.

Verify order ownership, environment, canonical payment receipt, delivery state and prior refunds before deciding. Contact the requester by email. Any approved refund remains a separate owner-controlled operation with reconciliation evidence. There is no automated SMTP notification in this implementation: check the queue regularly. Do not promise response times that cannot be staffed.

## Operational limitations

The same nonfinancial support queue can store claims for either network; financial accounts are never merged. Only the exact support POST is allowed on the Mainnet frontend, while all financial Mainnet writes remain blocked. Anonymous requests are unverified claims. Emails/source hashes are personal data; restrict database/backups to the service operator, review retention and legal obligations, and securely remove resolved records only under an approved retention policy. A protected restore drill and support staffing are launch prerequisites.

## Inventory

One coalesced server catalogue cache refreshes every 65 seconds while the service runs (not more than one upstream catalogue request/minute). The public CDN has at most 30 seconds of cache, without five-minute stale serving. Visible catalogue pages refresh every 75 seconds. Missing stock, explicit unavailable status, zero stock or conflicting zero counts fail closed. Long-order support does not prove stock. Prices, availability and payment authorization still require a fresh checkout check; this is not stock reservation or a Mainnet launch.
