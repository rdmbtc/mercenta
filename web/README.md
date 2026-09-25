# Mercenta landing — Commerce, with control.

Pre-launch landing for mercenta.xyz. Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, lucide-react.
Everything is server-rendered; the handful of client components are listed below and each one is a progressive
enhancement over markup that already reads correctly without JavaScript.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production check
```

## Structure

| Path | Role |
| --- | --- |
| `src/app/page.tsx` | Server-rendered page: story canvas, vocabulary ticker, decision engine, pipeline, policy terminal, platform bento, metrics, catalogue, settlement, status, CTA, footer. |
| `src/app/layout.tsx` | Metadata (title, description, OpenGraph, Twitter, theme colour), the Geist fonts and the film-grain overlay. Font variables live on `<html>` so `:root` tokens can resolve them. |
| `src/app/globals.css` | Design system: obsidian tokens, `.glass` / `.foil` / `.metal` materials, `.tag` + `.dot` telemetry type, buttons with shimmer, and per-section rules. |
| `src/lib/policy.ts` | Single source of truth: `POLICY`, `ORDER`, `CASES`, `SCENARIOS`, `evaluatePolicy`, `credential`, `usdc`, `percent`, `tone`. |
| `src/components/StoryCanvas.tsx` | The showstopper: a 480vh sticky canvas. Act 00 is the hero; acts 01–04 follow one order with HUD overlays (reticle, laser scan, unfolding foil receipt) while the vault film scrubs with scroll. Client. |
| `src/components/DecisionFeed.tsx` | Decision engine: a fixed sequence of illustrative intents through `evaluatePolicy`, with rolling odometers, a measured eval-time tile, an oscilloscope trace and a typewriter log. Client. |
| `src/components/PolicyTerminal.tsx` | Policy terminal 2.0: persona scenarios, liquid sliders, an SVG circuit the intent packet rides through the gate (checks light in order), and a settlement token that flips in only when the intent clears. Client. |
| `src/components/SiteHeader.tsx` | Fixed glass header: compacts on scroll, highlights the current section, hover Ecosystem menu, mobile menu. Client. |
| `src/components/SpotlightGrid.tsx` | Cursor spotlight + specular + 3D tilt for `.spot` cards; one rAF per pointer frame, CSS variables only. Client. |
| `src/components/MagneticLink.tsx` | Anchor that leans toward the cursor and springs back. Client. |
| `src/components/Odometer.tsx` | Slot-machine digits: each digit is a 0–9 column translated to its value. Server-renderable. |
| `src/components/ScrollEffects.tsx` | Adds `.is-in` to `[data-reveal]` and counts `[data-count]` up. Hiding is scoped to `html.has-js`. Client. |

The hero facts, the feed, the film, the terminal and the platform cards all read the same numbers from
`src/lib/policy.ts`, so no two sections can disagree about a balance, a floor or an outcome. Change a case there and
everything follows.

> `src/lib/` was previously swallowed by the root `.gitignore` (`lib/` from the Python template), which is why a fresh
> checkout could not build. The rule is now anchored to the repository root.

## The film

One illustrative order (MR-ORD-2481, 250 cloud-compute hours from CloudCore Compute) is followed end to end:
**hero → intent → the five ordered checks → the authorization boundary → settlement and delivery receipt.** Five
panels share one sticky stage, crossfading on scroll, with a video scrubbed by native scroll position. The stage
publishes `--p`, `--frame`, `--hero`, `--intent`, `--gate`, `--scan` and `--unfold` as CSS variables and a
`data-lit` count on the gate panel, so the frame inset, the laser sweep, the reticle, the sequential check lighting
and the receipt unfold are all plain CSS driven by one number. Deep links (`#order-journey`, `#policy-gate`) are
absolutely positioned anchors inside the tall container placed at a chosen story progress.

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
   in the HTML, and the decision feed already contains its first four rows.
2. **Scrub.** Scroll through `#order-journey`. The time and act counters track scroll, `video.currentTime` converges
   to `progress × duration`, and no crossfade leaves the stage blank.
3. **Fling.** Throw the page up and down, then sample the network/animation state: `seeking` and `seeked` stay paired
   (one seek in flight, no overlap) and the rAF loop stops shortly after the last scroll event.
4. **Reduced motion.** Emulate `prefers-reduced-motion: reduce` and reload: five static blocks (hero plus four acts),
   no `<video>`, no flare, ticker or reveal animation, every `[data-reveal]` block visible, terminals still interactive.
5. **Keyboard.** Tab from the top: the skip link focuses first, no focused element sits inside an `inert` or
   zero-opacity panel, the mobile menu closes on Escape.
6. **Narrow viewports.** At 390×844 and 320×568 there is no horizontal overflow, and an act taller than the stage
   scrolls internally so its last row is reachable above the bottom chrome.
7. **Terminal.** Clicking a scenario (or Run) sends the packet along the circuit: a pulse at the gate, checks lit in
   order, and the verdict reads "Evaluating…" until the packet stops. A failing check stops the packet red; a held
   check parks it amber at the gate exit; a cleared intent reaches Settlement and the token card flips in with a
   deterministic `•••• nnnn` tail and seal. Editing any input resets the run. Reset is disabled on the default order.
8. **Feed.** The top row changes every few seconds, the odometers roll, the eval-time tile shows a measured µs figure,
   the trace spikes on each decision, the log types out, the pause button stops it (dot turns amber), and hovering
   holds the rows still.
9. **Materials.** Moving the cursor over the platform grid tilts the hovered card (`--rx`/`--ry`) and moves the border
   glow on every card (`--mx`/`--my`); primary buttons carry a sweeping beam and lean toward the cursor.
10. **Build.** `npm run build`, `npx tsc --noEmit` and `npx eslint src` must pass before shipping.

## Truthfulness rules

Nothing on this page is live. The merchant console, catalogue sync, checkout and settlement are all described as
planned; the six ecosystem subdomains are each labelled `planned`; the catalogue, balances, rates and fees are
labelled illustrative and are not real inventory or final pricing. The terminal is labelled
"illustrative configuration", the decision feed is labelled "Simulated" and states that it is evaluated in the
browser, and no order is submitted and no funds move anywhere on this site. The metrics strip states structural
facts about the engine (five checks, three outcomes, one record, no model authority), not performance figures. The
feed's "volume" and "decisions" are session tallies of the simulation and its "eval time" is measured on the visitor's
machine; the terminal's settlement token is USDC-native and labelled illustrative (no card network is named), and its
scenarios use generic agent personas rather than third-party products. No cashback, subsidy or fee promise is made,
and nothing claims delivery before payment.

## Arc branding

Mercenta is the primary brand. Arc is referenced as infrastructure under development, not as a partner or
endorsement. Trademark attribution sits below the footer. No recreated Arc logo is used; any future logo must come
unchanged from the [Circle Brand Kit](https://www.circle.com/pressroom#brandkit) and comply with the Circle Brand Use
Policy. Branding questions: trademarks@circle.com.
