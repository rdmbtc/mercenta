# Mercenta 14-Day Mainnet Traction Sprint — v2: Gift Cards & Seller API Wedge
_Supersedes v1 (API-tokens wedge). Generated 2026-10-11._

## Verdict
Gift cards + Seller API beats API-tokens wedge for 14-day GMV:
- Resellers reorder DAILY (recurring GMV from ~20 accounts, not 60 one-shot buyers)
- Sellers already pay suppliers in crypto (USDT P2P) — USDC is a step sideways, not a leap
- Supply cost is THE competitive variable in reselling (thin margins, 1-3pp) — a 1-2pp price edge flips accounts
- Seller API keeps downstream invisible = cleanest APPROUTE protection

## Product frame
B2C catalog (proof of product) + Seller API (the real engine):
- POST /v1/order {sku, qty} -> codes[] + signed receipt
- GET /v1/catalog -> live SKU/price feed (region-labeled)
- Web console + CSV export for non-technical sellers
- Policy engine = graduated per-store limits growing with track record

## Offer
"Beat your current quote by 1-2pp or your first order is free" + 0% API fee 30d + no minimum order (test-order-first design) + USDC on Arc/Base/Solana + signed receipts + invoices. Referral: 50% of spread share for 90d per referred active seller.

## Targets (100 sellers)
FunPay top sellers (public sales-ranked profiles, chat is culturally normal), GGSel top sellers, G2G sellers via Discord/X, Telegram reseller chats.

## Funnel assumptions (validate)
DM -> reply 25-35% (business-incentivized) -> test order 60% -> daily reorder 70%.
20 closed sellers x $150/day avg reorder = ~$42k/14d ceiling; conservative 8-12 active by D14 = $12-25k incl B2C + dogfood.

## Hard rules
- Supply provenance clean only; region-labeled SKUs; invoices available
- Apple gift cards: lead with Steam/PSN/Xbox/Riot/Blizzard; Apple regional resale is restricted — check per-region before listing
- NEVER name the supplier; sellers see "Mercenta API" only
- No claiming marketplace partnerships; sellers are independent merchants
- Sell price+finality, not "crypto" — the chain is plumbing

## Day plan v2
D1 offer+price sheet+100-seller list; D2 60 outreach; D3 first 3 test orders; D4-5 tests->daily reorders, CSV sellers onboarded; D6 dogfood; D7 Proof-of-Settlement thread + gate (<$2.5k -> kill referral delay, double outreach); D8 50 pSEO gift-card pages + referral launch; D9-10 first API-automated seller, wave 2 outreach; D11-12 seller video testimonials, $1k/day; D13 grants/catalogs with seller-GMV evidence; D14 retro.

## pSEO v2 (50 gift-card intent keys)
buy steam gift card usdc / apple gift card crypto / psn gift card usdc / xbox gift card base / riot points usdc / roblox gift card crypto / blizzard balance usdc / razer gold crypto / etc. Template per v1 (Product+FAQ+HowTo JSON-LD, TL;DR block for answer engines, llms.txt).
