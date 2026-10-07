# AGENT-14 — Accessibility & Keyboard QA Engineer

State: NOT_STARTED. Pin `585d4b4130292d2ae6424ecbd61db9de8524f12d`. No writes outside this brief.

## Exact write allowlist
- `web/src/__tests__/a11y-keyboard.test.ts`

## Read-only input interfaces
- `web/src/components/product/StartJourney.tsx`
- `web/src/components/product/NetworkSelector.tsx`
- `web/src/components/product/AgentOperator.tsx`
- `web/src/components/product/AccountConsole.tsx`

## Input contract

Use project Vitest + jsdom + existing React createRoot/act test pattern (not Jest migration). Accessible name can come from label/text/ARIA; explicit aria-label is not mandatory where visible text correctly names the control. Native dialog showModal must be realistically modelled.

## Exact deliverables
- Tab/Shift-Tab traps, Escape/focus restore, keyboard form controls, tooltip focus activation and disabled financial controls.

## Acceptance
- No CSS/JSX/source edits, zero spending/auth/RPC calls, guest cannot invoke account tools, menu reachable at narrow layout. jsdom cannot prove pixels/real-browser focus; record required lead browser checks. Exit 0.

## Verify command

```sh
cd web && npx --no-install vitest run src/__tests__/a11y-keyboard.test.ts
```

## Dependencies / blockers


Return the shared result contract. Never waive a failing production invariant. No real or public-network transactions.
