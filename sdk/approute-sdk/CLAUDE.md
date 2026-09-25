# Public API SDK — AI Agent Reference

```
Repo:    official client SDKs for AppRoute Public API in FOUR languages:
         python/ (approute-public-api-sdk, py3.10+), javascript/
         (@approute/public-api-sdk, node18+), php/ (8.1+), golang/ (1.21+)
Source of truth: openapi.yaml + AppRoute-LK-Public-API's src/schemas/
Docs:    README.md + per-language READMEs
```

Workspace-level rules: [../CLAUDE.md](../CLAUDE.md).

Key facts:
- A breaking change in Public-API DTOs ⇒ change HERE in all four SDKs +
  version bump; keep openapi.yaml in sync with the service.
- All SDKs follow the same surface (API-key auth, same method names) —
  a feature added to one language must be added to all four.
- scripts/ holds generation/release helpers — prefer them over hand-editing
  generated parts.
