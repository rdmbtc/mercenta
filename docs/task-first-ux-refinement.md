# Task-first workspace refinement

## Core question
What can I buy, how much can I spend, and what should I do next?

## Critical cuts shipped
- Removed the decorative application hero. The flagship landing is unchanged.
- Guests see explicitly simulated test products immediately, not a private dashboard of dashes and empty history.
- Authenticated home uses actual loaded account data. During read-only/unavailable service, a retained balance is labelled last loaded, not current verified availability.
- One primary catalogue action. No repeated sidebar setup invitation; budget planning remains optional and accessible through a contextual home action and secondary options.
- Renamed the primary Wallet destination to Account to distinguish Mercenta prepaid credit from an external wallet. Existing Funds URLs and backend routes remain compatible.

## Discovery and next actions
- Compact cards retain product identity, region and simulated delivery mode. View details replaces ambiguous arrow-only actions.
- Details expose the exact six-decimal preview price, quantity and total, with optional reference behind progressive disclosure. Invalid quantities are explained.
- A guest cannot confirm a purchase. The existing wallet sign-in can be reached contextually; the public selected product can be returned to after sign-in/funding. This is not a saved order, quote or payment authority.
- Failed background refreshes do not appear as checkout operation failures. A purchase failure prompts checking purchase history before retrying. Existing request identifiers, monetary guards, debit authority and signature requirements are retained.
- An in-flight order disables changes to displayed quantity/reference. The service outage is explained to guests as well as authenticated users.

## Budget and assistant
- Personal and business purposes choose different, editable starting templates: 85/15/0 and 70/20/10 for purchases/reserve/goal. These are examples, not recommended allocations or tax advice.
- Percentages and caps use integer micro-unit calculations. Rounding remainder stays in reserve; invalid totals cannot continue.
- Guest draft amounts/shares carry in memory to Budget. They are explicitly not saved to the account and never persisted as financial values in localStorage.
- Business next actions point to Budget, Journal and Assistant; personal next actions point to products, Account and Assistant. Budget planning is not verified profit allocation or a vault deposit.
- Assistant starts with a question field and concise context, not a large marketing welcome. Guests can draft and see a sign-in action, but cannot send protected requests. Proposal confirmation and contract signing remain separate.

## Typography and ergonomics
- Keep the flagship Geist system; use roughly 15–16px body/input copy and 44px-or-larger primary control targets. Most technical micro-labels are demoted.
- Compact amounts are presentation only. Rounded display values carry an approximation mark and preserve exact unit values; review retains six decimals. Server amount calculations are not replaced by display strings.
- Responsive one-column mobile product list, visible region/sort controls, light/dark preference, RU/EN copy, keyboard dialogs and history restoration.

## Verification and launch boundaries
- 158 frontend tests across 19 files; TypeScript, targeted new-module ESLint and production builds passed.
- Public guest walkthroughs: 34 desktop checks and 33 mobile checks, no page errors or Mercenta POST mutations during those walkthroughs. See task-first-ux-qa.json. Local layout fixtures are not payment or traction evidence.
- Authenticated saving, live purchasing and infrastructure recovery are not claimed: the VPS/API outage remains a separate blocker.
- Mainnet, redeemable supplier goods, live Earn, fiat and cross-chain settlement were not enabled. A real catalogue will require reviewed supplier access, product/region/redemption metadata, price/availability verification and stable expiring checkout quotes before production fulfillment.
