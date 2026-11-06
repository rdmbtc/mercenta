# Mercenta external reference ledger

This project adapts interaction patterns rather than importing external visual branding.

| Reference | Local use | Adaptation rule |
| --- | --- | --- |
| Prompt Kit | Agent chat message, prompt input, suggestion, streaming and tool-step composition | Keep policy boundary, deterministic decisions, explicit confirmation and receipt evidence visible. |
| COSS UI / Kibo UI | Composable fields, dialogs, drawers, tabs, filters, tables and empty states | Use existing Mercenta tokens, native semantics and 44px targets. |
| Motion Primitives / React Bits | Isolated state transitions and non-critical hero decoration | Respect reduced motion; never animate financial authorization or settlement as if it happened. |
| StageShow | Existing landing scroll story | Keep deterministic stages, native scroll and readable fallback; no wheel traps or snap-scrolling. |
| panelui | Internal source of truth for Frame, Stat, Kpi, status orb and settlement presentation | Preserve compound APIs and server-friendly rendering. |
| Uiverse / Fancy Components | Optional future decorative references | Inspect and adapt only a specific component; do not assume inaccessible or unverified code. |

External references are not copied as full themes. Any future adapted component must document its source, local changes, accessibility behavior and license/attribution requirements here before merging.
