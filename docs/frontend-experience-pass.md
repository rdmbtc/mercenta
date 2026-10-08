# Frontend experience pass

## Scope

UI-only changes while backend hosting is unavailable. No financial network, signing, account credit, procurement or refund-execution logic is changed.

- Testnet and Mainnet quick navigation: Ctrl/Command K, bilingual search, native modal containment, Escape/focus restoration. Mainnet only offers its existing read-only views. Navigation never authorizes payment.
- Catalogue guide, category SVGs, explicit region help, artwork-first default, name/price sorting, compact/card views, responsive result controls and actionable empty states. Price comparisons are grouped by currency and use selected-region catalogue prices, not USDC quotes. Missing prices sort last.
- Home workflow glyphs and modest intersection-based reveals. Screen changes use a 240ms content transition; reduced-motion preference prevents WAAPI effects and cancels existing transitions.
- Custom SVG map in the landing's explicitly labelled interactive example, plus native-details FAQ about wallets, regions, permissions and manual support.
- Tooltips are portalled to the nearest native modal or document body, bounded horizontally, dismissed on Escape/outside pointer/scroll, and inherit the source theme. Escape is consumed only when a tooltip is open.
- Operator event icons distinguish blocked, stopped, pending, proposal, successful and unknown statuses. A quoted or authorized event is not settlement evidence.

## Release acceptance

Run frontend tests, lint with zero warnings, TypeScript and production build. Scan source and bundles for forbidden supplier identity and the privately supplied model credential. Never include private configuration in commits.

Verify live desktop and mobile routes: landing, public catalogue, Testnet Home/Shop/Assistant, Mainnet read-only workspace. Test command-menu focus, keyboard navigation, Escape and no overflow; exercise catalogue sorting/view switching and region help; check reduced motion. Browser verification is read-only and must not sign, pay, create an order or submit a refund.

Native dialog focus-trapping requires a browser check; jsdom tests do not prove browser top-layer behaviour. A frontend release does not restore the unavailable backend or enable Mainnet payments. No accessibility certification or performance SLA is claimed from this pass.
