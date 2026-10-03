# Mercenta documentation — task-first refinement

## Verdict
The previous documentation looked like a separate marketing site. Its main task is finding a usable answer, not selling the platform again.

## Cuts
- Removed the architectural promotional image and oversized documentation map.
- Collapsed long technical lists into task-grouped, progressively disclosed navigation.
- Removed inherited green article links and generic template typography.
- Kept current limitations in one readable release notice, with deeper safety details in the relevant guides.

## Shared product language
Geist matches the deployed workspace. JetBrains Mono is reserved for short labels and code. Dark surfaces, pale cyan accents, light-theme blue accents, hairline borders and restrained radii follow the workspace/landing family. Body copy is 15–16px; primary controls and navigation targets are at least 44px.

## Practical paths
The home page points directly to purchasing, balances, spending limits and API authentication. First-use instructions reflect Home / Shop / Account / Assistant. New budget and journal pages explain the difference between plans, manual records and verified ledger activity.

Native modal dialogs provide search/menu focus containment, Escape dismissal and focus restoration. Search keeps keyboard navigation and labels its unavailable state. Active navigation is marked; its folder expands automatically. Small-screen release notices keep a full-width text column.

## Backend recovery
The prior seller release was reachable but lacked workspace/catalog-preview/launch-readiness routes. The reviewed onboarding release was compared byte-for-byte against the current public backend source (76 files), staged without environments, keys or databases, tested on the VPS (119 passed), then activated after an integrity-checked SQLite online backup. Existing ledger, environment and signer configuration were preserved. Failure handling retained a rollback to the previous release without restoring an outdated ledger.

Public health and catalogue requests succeeded. Private workspace and journal requests returned 401 without wallet authentication. Launch-readiness still reports mainnet and live goods disabled.

## Verification boundary
See `docs-refinement-qa.json` for actual public browser checks. Unit tests, TypeScript and production builds are recorded separately. Guest browser checks are not authenticated purchase/funding tests, business traction, a security audit or production approval. No paid request, deposit, mainnet transaction or signing-key change was made by this refinement.
