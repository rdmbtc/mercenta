# Mercenta landing — Commerce, with control.

Pre-launch landing for mercenta.xyz. Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, lucide-react.
Everything is server-rendered except the order film and the policy terminal, the only two client components.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production check
```

## Structure

| Path | Role |
| --- | --- |
| `src/app/page.tsx` | Server-rendered shell: header, hero, catalogue, settlement, status, CTA, footer, ecosystem links. |
| `src/app/layout.tsx` | Metadata (title, description, OpenGraph) and the Geist fonts. Single source of page metadata. |
| `src/app/globals.css` | All styling tokens and rules. No CSS framework layer beyond Tailwind's import. |
| `src/lib/policy.ts` | Single source of truth: `POLICY`, `CASES`, `PRESETS`, `evaluatePolicy`, `usdc`, `percent`. |
| `src/components/OrderJourney.tsx` | The scroll film: one illustrative order, four acts. Client component. |
| `src/components/PolicyTerminal.tsx` | The interactive policy terminal. Client component. |

The story and the terminal read the same numbers from `src/lib/policy.ts`, so the film's outcome and the
terminal's live decision cannot drift apart. Change a balance, a floor or a case there and both follow.

## The film

One illustrative order (MR-ORD-2481, 250 cloud-compute hours from CloudCore Compute) is followed end to end:
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
   Autonomous Agents", "Illustrative order", "Available to spend", "Reserved", "Gross margin", "Agent decision",
   "Policy blocked", "Human approval required", "Fulfilled" and "Supplier uncertain" are all present in the HTML.
2. **Scrub.** Scroll through `#order-journey`. The time and act counters track scroll, `video.currentTime` converges
   to `progress × duration`, and no crossfade leaves the stage blank.
3. **Fling.** Throw the page up and down, then sample the network/animation state: `seeking` and `seeked` stay paired
   (one seek in flight, no overlap) and the rAF loop stops shortly after the last scroll event.
4. **Reduced motion.** Emulate `prefers-reduced-motion: reduce` and reload: four static acts, no `<video>`, all copy
   still present, terminals still interactive.
5. **Keyboard.** Tab from the top: the skip link focuses first, no focused element sits inside an `inert` or
   zero-opacity panel.
6. **Narrow viewports.** At 390×844 and 320×568 there is no horizontal overflow, and an act taller than the stage
   scrolls internally so its last row is reachable above the bottom chrome.
7. **Terminal.** Presets, amount and cost inputs, and the supplier select re-evaluate immediately; a failed check
   blocks the order, a held check escalates to a human, and "this page's order" matches the film's figures.
8. **Build.** `npm run build` and `npx tsc --noEmit` must pass before shipping.

## Truthfulness rules

Nothing on this page is live. The merchant console, catalogue sync, checkout and settlement are all described as
planned; the six ecosystem subdomains are each labelled `planned`; the catalogue, balances, rates and fees are
labelled illustrative and are not real inventory or final pricing. The terminal is labelled
"illustrative configuration", every evaluation runs in the browser, and no order is submitted and no funds move
anywhere on this site. No cashback, subsidy or fee promise is made, and nothing claims delivery before payment.

## Arc branding

Mercenta is the primary brand. Arc is referenced as infrastructure under development, not as a partner or
endorsement. Trademark attribution sits below the footer. No recreated Arc logo is used; any future logo must come
unchanged from the [Circle Brand Kit](https://www.circle.com/pressroom#brandkit) and comply with the Circle Brand Use
Policy. Branding questions: trademarks@circle.com.
