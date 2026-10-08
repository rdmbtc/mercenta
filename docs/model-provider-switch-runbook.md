# Temporary model-provider switch

This changes model inference only. It does not replace the backend, ledger, wallet, catalogue or order service. No payment is authorized by a model response.

## Private configuration

Keep endpoint and credential in the server secret store, never source code, client environment, build artefacts or request logs.

- `LLM_PROVIDERS_FILE`: explicitly clear when selecting the compatible endpoint. A configured provider registry takes precedence.
- `LLM_API_URL`: full HTTPS completion endpoint ending in `/chat/completions`, not the base URL.
- `LLM_API_KEY`: server-side credential only.
- `LLM_MODEL`: independently probed primary model ID.
- `LLM_FALLBACK_MODELS`: up to three independently probed IDs, comma-separated. Do not choose models on availability claims alone.

The pending private override is not a deployment and must not be copied into Git. Preserve the existing private configuration for rollback; apply only the five model settings, not financial environment variables.

## Acceptance

1. Restore backend hosting and deploy the reviewed backend commit using the normal backup/rollback procedure.
2. Check permissions on the secret store. Read the pending override privately; atomically update model settings without logging values.
3. Restart the backend. Confirm ordinary health and run a synthetic read-only operator request. A finish-only compatibility probe does not prove a complete procurement workflow.
4. Validate intent, coach and operator output against their respective strict schemas. Check the selected model in private telemetry, without secrets or purchased credentials.
5. Exercise failover using mocked 503, malformed output and timeout tests. Never invalidate a production key to simulate an outage.
6. Check 401/403/429 stop further model attempts and establish credential cooldown. Model failures have model-specific cooldown. The overall call budget is 12 seconds, individual attempts at most 5 seconds.
7. Roll back only model settings if inference fails; do not change ledger state or enable financial routes.

## Boundaries

Responses are size-limited and schema-validated. Redirects are rejected. Secrets detected in prompts are not sent and credential echoes are not returned. This is not a general data-loss-prevention or DNS-rebinding guarantee: the owner must approve and pin the endpoint and assess the provider's privacy policy before sending production customer data.

Provider quota, billing, retention, physical model identity and production region reachability are not inferred from a successful chat request. A probe from a developer workstation is not proof of reachability from the VPS.

The operational backend remains Testnet-only. This switch does not activate Mainnet payments, procurement, yield or refunds.
