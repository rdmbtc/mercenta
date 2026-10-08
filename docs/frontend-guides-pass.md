# Frontend guidance pass

Scope: informational onboarding and support; no financial backend changes.

- `/start`: three clear paths, region/quote/permission checks and English/Russian content.
- `/support`: searchable bilingual help, category filters, native keyboard disclosures, manual refund-review route and official contact details.
- Branded 404 recovery with useful destinations; no imaginary infrastructure jargon.
- Guides linked from landing navigation, official footers and workspace quick navigation.
- Correct ArrowUp entry/wrap behavior in quick navigation, covered by regression test.

Safety: no payment, auto-refund, wallet connection or ticket API is called by these pages. Mainnet remains closed. Catalogue snapshots are not stock promises. Service outage recovery does not instruct users to repeat uncertain payments.

Verification: run frontend tests, lint with zero warnings, TypeScript, production build and source/bundle security audit. Browser-check desktop/mobile routes and help search after publishing. Passing tests do not certify production financial readiness.
