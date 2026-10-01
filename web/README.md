# Mercenta landing — Commerce, with control.

Pre-launch landing for mercenta.xyz. Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, lucide-react.
The page is server-rendered; client components listed below provide the interactive demo and navigation.
The policy examples are evaluated locally; they are not connected to supplier or payment services.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production check
```

The catalogue, balances, decisions and receipts are illustrative browser examples, not connected services.
No supplier call, wallet action or USDC transfer is performed.

## Structure

| Path | Role |
| --- | --- |
| `src/app/page.tsx` | Server-rendered page: hero with the order card, problem, solution pipeline + policy sandbox, methodology, vault film, entitlements, catalogue, settlement ledger, CTA, status, footer. |
| `src/app/layout.tsx` | Metadata (title, description, OpenGraph, Twitter, theme colour) and the Geist fonts. The font variables live on `<html>` so `:root` tokens can resolve them. |
| `src/app/globals.css` | All tokens and rules, grouped by section. No CSS framework layer beyond Tailwind's import. |
| `src/lib/policy.ts` | Single source of truth: `POLICY`, `ORDER`, `CASES`, `evaluatePolicy`, `usdc`, `percent`, `tone`. |
| `src/components/SiteHeader.tsx` | Fixed header: compacts on scroll, highlights the current section, mobile menu. Client. |
| `src/components/OrderJourney.tsx` | The scroll film: one illustrative order, four acts. Client. |
| `src/components/PolicyTerminal.tsx` | The interactive policy terminal, with presets, reset and a checks-passed score. Client. |
| `src/components/ScrollEffects.tsx` | Adds `.is-in` to `[data-reveal]` elements as they enter the viewport and counts `[data-count]` numbers up. Hiding is scoped to `html.has-js`, so nothing is invisible without JavaScript. Client. |
| `src/components/Spotlight.tsx` | Pointer-tracking enhancement for fine pointers, disabled for reduced motion. Client. |

The hero facts, the hero order card, the film, the terminal and the platform cards all read the same numbers from
`src/lib/policy.ts`, so no two sections can disagree about a balance, a floor or an outcome. Change a case there and
everything follows.

> `src/lib/` was previously swallowed by the root `.gitignore` (`lib/` from the Python template), which is why a fresh
> checkout could not build. The rule is now anchored to the repository root.

## The film

One fictional order (MR-ORD-2481, 250 cloud-compute hours from CloudCore Compute) illustrates the intended flow:
**intent → the five ordered checks → the authorization boundary → settlement and delivery receipt.** Four acts
share one sticky stage, crossfading on scroll, with a video scrubbed by native scroll position.

- **Native scroll only.** No wheel or touch hijacking, no scroll traps. Progress is read in a `scroll`/`resize`
  driven requestAnimationFrame loop that stops itself once movement settles.
- **Serialized video seeks.** At most one `currentTime` write is in flight; later scroll positions coalesce into the
  newest target and converge after `seeked`. Nothing queues up behind a fling.
- **Reachability before decoration.** Exactly one act owns focus and paint at a time; the others are `inert`, so
  keyboard and screen-reader users never land in an invisible panel.
- **Fits the viewport, else scrolls.** On short or narrow viewports the act scrolls inside its own panel instead of
  clipping: content is always reachable, and the bottom chrome carries a scrim so the skip chip stays legible.
- **Reduced motion** replaces the stage with four static acts (`.film-block`), no video element at all, same copy.
- **Loading and error states** are explicit: cached-load readiness, a deadline with one bounded retry, and a
  "video unavailable" fallback that keeps the poster and the panels.

## Media contract

```
public/videos/mercenta-vault.mp4          # scrub source (muted, decorative)
public/videos/mercenta-vault-poster.jpg   # poster, also the CSS fallback background
```

Both paths are fixed; the film reads only these two files. If the video is missing or fails to decode, the film
degrades to the poster plus its four acts and flags the preview as unavailable. The video is decorative footage:
it is not evidence of a live network, a transaction or a token.

## Verification

Everything below is a browser check, not a unit test — the interesting behaviour is rendering and scroll.
Run `npm run dev`, open the page, and confirm:

1. **Server render.** View source (or `curl -s localhost:3000`): "Commerce, with control.", "Commerce OS for
   autonomous agents", "Illustrative order", "Simulated", "Available to spend", "Reserved", "Gross margin",
   "Agent decision", "Policy blocked", "Human approval required", "Fulfilled" and "Supplier uncertain" are all present
   in the HTML, and the hero order card shows five passed checks.
2. **Scrub.** Scroll through `#order-journey`. The time and act counters track scroll, `video.currentTime` converges
   to `progress × duration`, and no crossfade leaves the stage blank.
3. **Fling.** Throw the page up and down, then sample the network/animation state: `seeking` and `seeked` stay paired
   (one seek in flight, no overlap) and the rAF loop stops shortly after the last scroll event.
4. **Reduced motion.** Emulate `prefers-reduced-motion: reduce` and reload: four static acts, no `<video>`, no aurora,
   ticker or reveal animation, every `[data-reveal]` block visible, terminals still interactive.
5. **Keyboard.** Tab from the top: the skip link focuses first, no focused element sits inside an `inert` or
   zero-opacity panel, the mobile menu closes on Escape.
6. **Narrow viewports.** At 390×844 and 320×568 there is no horizontal overflow, and an act taller than the stage
   scrolls internally so its last row is reachable above the bottom chrome.
7. **Terminal.** Presets, amount and cost inputs, and the supplier select re-evaluate immediately; a failed check
   blocks the order, a held check escalates to a human, "This page's order" matches the film's figures, and Reset is
   disabled while that preset is loaded.
8. **Build.** `npm run build`, `npx tsc --noEmit` and `npx eslint src` must pass before shipping.

Local verification: the production build, type check and lint passed. In Chromium (1440px and 390px), all sections revealed on scroll (the reveal observer uses `threshold: 0`, so fast flings cannot skip tall blocks), the catalogue grid, settlement ledger, status panel and footer rendered without overlap or horizontal overflow, and the mobile menu opened and closed on Escape. Policy presets yielded Cleared, Policy blocked (thin margin and uncertain supplier) and Human approval required (over limit). Reduced-motion reload rendered four static film acts with no video element. These checks do not establish live payment or supplier behavior; every catalogue rate, latency target and ecosystem address is illustrative or planned.

## Truthfulness rules

Nothing on this page is live. The merchant console, catalogue sync, checkout and settlement are all described as
planned; the six ecosystem subdomains are each labelled `planned`; the catalogue, balances, rates and fees are
labelled illustrative and are not real inventory or final pricing. The terminal is labelled
"illustrative configuration", and no order is submitted and no funds move anywhere on this site. The metrics strip states structural
facts about the engine (five checks, three outcomes, one record, no model authority), not performance figures. No
cashback, subsidy or fee promise is made, and nothing claims delivery before payment.

## Arc branding

Mercenta is the primary brand. Arc is referenced as infrastructure under development, not as a partner or
endorsement. Trademark attribution sits below the footer. No recreated Arc logo is used; any future logo must come
unchanged from the [Circle Brand Kit](https://www.circle.com/pressroom#brandkit) and comply with the Circle Brand Use
Policy. Branding questions: trademarks@circle.com.


## catalog.mercenta.xyz

The catalog site lives in this app at `/catalog`. `src/middleware.ts` rewrites any `catalog.*` host to it, so the subdomain serves the catalog at its root.

Live supply feed (server-side only; the supplier key never reaches the client):

```env
SUPPLIER_API_URL=https://supplier.example/api/v1
SUPPLIER_API_KEY=sk_live_...
```

Without these, `src/lib/supplier.ts` serves a curated snapshot and the page flags "CURATED SNAPSHOT" in the telemetry strip. Responses are cached 5 min (`revalidate: 300`). Read-only: no order endpoints are used.

### Catalog features

- `⌘K` / `/` command bar — fuzzy search over SKU, brand, denomination, region tag; Enter jumps and flashes the card.
- Facets: 5 institutional category rails with live counts, region, format (Voucher / Top-Up / eSIM), denomination pills ($5–$100), in-stock toggle, price/stock sort.
- Cards: generative brand art (deterministic per product id), resolver logos with monogram fallback, stock status (INSTANT / LOW RESERVE / OUT), dual USDC ≈ USD pricing, `<1.2s` delivery SLA badge.
- Hover a card → Instant API Purchase opens the Pre-Flight Clearance drawer (Agent ID, budget cap status, settlement network Arc/Base/Solana, live SHA-256 receipt proof preview). Simulation only — no orders are placed.
- Agent Batch mode: select SKUs, floating manifest bar, copy or download a `mercenta-agent-sdk` JSON purchase manifest.
