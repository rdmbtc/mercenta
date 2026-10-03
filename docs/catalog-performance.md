# Catalogue first paint and artwork-first ordering

## Published scope

- Both the public catalogue and Shop → Catalogue render the first 24 cards in their server HTML. Opening Shop no longer first renders Home and then waits for a catalogue fetch.
- The complete received catalogue remains searchable: 1,298 product records and 7,554 options, including two products with no supplied options. Option-name search is retained in compact summaries; full selected variants are retrieved on opening details.
- Default ordering puts 395 platform-artwork listings above illustrative placeholders, preserving diversified brand order inside each partition. Explicit price/currency or stock sorting in the public catalogue still follows the user's selected order.
- First-row artwork is eager/high-priority; later artwork remains lazy. Cards are not hidden by a mount animation. Hover motion and reduced-motion support remain.
- A dated, verified public browse snapshot is used for immediate rendering. A shared, deduplicated public-only refresh replaces it after success. A refresh failure keeps the dated snapshot visible, not a false claim of current inventory.
- No flashing catalogue-checking text. Where no bootstrap exists, a stable accessible skeleton is used. Product-option retrieval has its own skeleton and retry state.

## Measurements

The measurements below are single guest runs, not a general speed guarantee or a Core Web Vitals field study. Browser timings include automation/CDP round trips and locator checks.

| Measure | Before | After |
|---|---:|---:|
| Public catalogue decoded HTML | 1,922,929 bytes | 524,539 bytes |
| Public catalogue compressed transfer | 369,800 bytes | 108,949 bytes |
| Browse API decoded payload | 1,644,224 bytes | 426,198 bytes |
| Browse API compressed transfer | 354,423 bytes | 94,098 bytes |
| Mobile public catalogue first-card check | 2,962 ms | 2,394 ms |
| Mobile Shop first-card check | 2,689 ms | 1,858 ms |
| Shop cards present in initial HTML | 0 | 24 |

The measured warm/stale-while-revalidate browse API response completed in 0.037688 seconds, with `x-vercel-cache: STALE`. The first deployed browse request still took 3.504809 seconds; it now runs in the background and does not block initial cards. Do not claim every cold request became instantaneous.

## Verification

- 199 frontend tests passed; local production build and published production build passed. Existing lint warnings remain; this is not a claim of a warning-free codebase.
- 32 deployed guest browser checks passed: artwork-first ordering, complete first page, no loading-text flash, decoded artwork, mobile overflow, search accuracy, independently loaded variants, safe test-only drawer, JavaScript-disabled server rendering, refresh-failure snapshot retention, empty state and filter reset.
- No JavaScript runtime errors recorded. No POST/PUT/PATCH/DELETE requests were triggered in guest browser QA.
- Five existing read-only public release checks passed (health, private-balance guard, unpaid service requirements, platform test-funding proof and submission guide). These checks do **not** verify paid service execution, final settlement, external traction or a signed-in production checkout.

## Cache and financial authority

`GET /api/catalog` retains the full normalized catalogue contract for integrations. `GET /api/catalog?view=browse` returns compact public summaries, and `GET /api/catalog?id=…` returns a selected product's options. Only these public read routes use public cache headers/compression. Client requests explicitly omit credentials; private account/auth/order routes are unchanged and must not use this shared cache.

Captured prices and stock are indicative and labelled with their capture date. Test quotes still come from the existing authoritative backend; actor ownership, budget limits, balance, expiry, consent and idempotent confirmation remain unchanged. The test price remains 1.000000 test USDC per unit, maximum 10 units, producing non-redeemable saved artifacts. No real supplier orders/invoices, mainnet or live Earn were enabled.

## Updating the immediate-render snapshot

From the repository root, run `node scripts/refresh-public-catalog.mjs`. It reads only the existing public Mercenta catalogue GET endpoint, refuses examples/unverified data and unexpected secret/supplier labels, selects public fields explicitly, and atomically replaces the public source artifact. Review the snapshot diff and release-specific coverage assertions, run frontend tests/build, then redeploy. This utility creates no order, invoice or payment. A failed refresh never replaces the verified snapshot.

The artifact lives in `web/src/lib/catalog-public-snapshot.json`, not a runtime/private data directory; it contains no account balances, wallet sessions, credentials or delivery receipts. Only compact public summaries are passed into the initial browser render.

## Next release boundary

Mainnet remains **NO-GO**. See `submission/NEXT-STEPS.md` for hackathon demo closure, genuine external-pilot evidence and the separate real-money release gates. See `catalog-performance-qa.json` for the scoped measurements/checks.
