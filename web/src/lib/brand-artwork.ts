// Locally hosted platform artwork, not SKU/denomination/stock evidence.
// Matched by explicit brand names, never across provider product IDs.
export const BRAND_ARTWORK_RULES = [
  // Top Featured Products (High-Resolution Custom Covers)
  { brand: "telegram-stars-custom", pattern: /\btelegram\s+stars\s*\([^)]*custom[^)]*\)/i, src: "/product-covers/telegramstarscustom.png" },
  { brand: "telegram-stars", pattern: /\btelegram\s+stars\b/i, src: "/product-covers/telegramstars.png" },
  { brand: "telegram-premium", pattern: /\btelegram\s+premium\b/i, src: "/product-covers/telegrampremium.png" },
  { brand: "steam-wallet-topup", pattern: /\bsteam(?:\s+wallet)?\s+top\s*up\b/i, src: "/product-covers/steamwallettopup.jpg" },
  { brand: "steam-wallet-card", pattern: /\bsteam(?:\s+wallet|\s+gift\s*card|\s+code)\b/i, src: "/product-covers/steamwalletgiftcard.jpg" },
  { brand: "roblox", pattern: /\broblox\b/i, src: "/product-covers/robloxgiftcards.png" },
  { brand: "playstation", pattern: /\b(?:play\s?station|psn)\b/i, src: "/product-covers/Playstationgiftcards.png" },
  { brand: "xbox", pattern: /\bxbox\b/i, src: "/product-covers/xboxgiftcard.png" },
  { brand: "apple", pattern: /\b(?:apple|itunes)\b/i, src: "/product-covers/applegiftcard.png" },
  { brand: "nintendo", pattern: /\bnintendo\b/i, src: "/product-covers/nintendogiftcard.png" },
  { brand: "battle-net", pattern: /\b(?:battle[.\s_-]*net|blizzard)\b/i, src: "/product-covers/battlenetgiftcard.jpg" },
  { brand: "valorant", pattern: /\bvalorant\b/i, src: "/product-covers/valorantgiftcard.jpeg" },
  { brand: "pubg", pattern: /\bpubg\s*mobile\b/i, src: "/product-covers/pubgmobiletopup.png" },
  { brand: "free-fire", pattern: /\bfree\s*fire\b/i, src: "/product-covers/freefirecis.png" },
  { brand: "blood-strike", pattern: /\bblood\s*strike\b/i, src: "/product-covers/bloodstriketopup.png" },
  { brand: "zenless-zone-zero", pattern: /\bzenless(?:\s+zone\s+zero)?\b/i, src: "/product-covers/zenlesszonezerotopup.png" },

  // Platform & Service Fallbacks
  { brand: "steam", pattern: /\bsteam\b/i, src: "/product-covers/steam.webp" },
  { brand: "xbox-console", pattern: /\bxbox\b/i, src: "/product-covers/xbox.webp" },
  { brand: "spotify", pattern: /\bspotify\b/i, src: "/product-covers/spotify.webp" },
  { brand: "discord", pattern: /\bdiscord\b/i, src: "/product-covers/discord.webp" },
  { brand: "google-play", pattern: /\bgoogle\s+play\b/i, src: "/product-covers/google-play.webp" },
  { brand: "razer-gold", pattern: /\brazer[\s_-]*gold\b/i, src: "/product-covers/razer-gold.webp" },
  { brand: "fortnite", pattern: /\bfortnite\b/i, src: "/product-covers/fortnite.webp" },
  { brand: "world-of-warcraft", pattern: /\b(?:world\s+of\s+warcraft|wow\s+timecard)\b/i, src: "/product-covers/world-of-warcraft.webp" },
  { brand: "riot", pattern: /\b(?:riot|league\s+of\s+legends)\b/i, src: "/product-covers/riot.webp" },
  { brand: "undawn", pattern: /\bundawn\b/i, src: "/product-covers/undawn.webp" },
  { brand: "tinder", pattern: /\btinder\b/i, src: "/product-covers/tinder.webp" },
  { brand: "gearup", pattern: /\bgear\s?up\b/i, src: "/product-covers/gearup.webp" },
  { brand: "exitlag", pattern: /\bexit\s?lag\b/i, src: "/product-covers/exitlag.webp" },
  { brand: "ea", pattern: /\bea\b/i, src: "/product-covers/ea.webp" },
] as const;

export const TOP_FEATURED_PATTERNS = [
  /\btelegram\s+stars\s*\([^)]*custom[^)]*\)/i,
  /\btelegram\s+stars\b/i,
  /\btelegram\s+premium\b/i,
  /\bsteam(?:\s+wallet)?\s+top\s*up\b/i,
  /\bsteam(?:\s+wallet|\s+gift\s*card|\s+code)\b/i,
  /\broblox\b/i,
  /\b(?:play\s?station|psn)\b/i,
  /^(?:xbox\s+gift\s*card|xbox\s+game\s+pass|xbox\s+live)\b|\bxbox\s+gift\s*card\b/i,
  /\b(?:apple|itunes)\b/i,
  /\bvalorant\b/i,
  /\b(?:battle[.\s_-]*net|blizzard)\b/i,
  /\bnintendo\b/i,
  /\bpubg\s*mobile\b/i,
  /\bfree\s*fire\b/i,
  /\bblood\s*strike\b/i,
  /\bzenless(?:\s+zone\s+zero)?\b/i,
] as const;

export function topProductRank(name: string): number {
  for (let i = 0; i < TOP_FEATURED_PATTERNS.length; i++) {
    if (TOP_FEATURED_PATTERNS[i].test(name)) return i;
  }
  return 999;
}

export function brandArtwork(name:string){let src:string|undefined,index=Infinity;for(const rule of BRAND_ARTWORK_RULES){const match=rule.pattern.exec(name);if(match&&match.index<index){src=rule.src;index=match.index}}return src}
