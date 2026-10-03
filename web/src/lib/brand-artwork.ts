// Locally hosted platform artwork, not SKU/denomination/stock evidence.
// Matched by explicit brand names, never across provider product IDs.
export const BRAND_ARTWORK_RULES=[
 {brand:"valorant",pattern:/\bvalorant\b/i,src:"/product-covers/valorant.webp"},
 {brand:"steam",pattern:/\bsteam\b/i,src:"/product-covers/steam.webp"},
 {brand:"playstation",pattern:/\b(?:play\s?station|psn)\b/i,src:"/product-covers/playstation.webp"},
 {brand:"xbox",pattern:/\bxbox\b/i,src:"/product-covers/xbox.webp"},
 {brand:"roblox",pattern:/\broblox\b/i,src:"/product-covers/roblox.webp"},
 {brand:"spotify",pattern:/\bspotify\b/i,src:"/product-covers/spotify.webp"},
 {brand:"discord",pattern:/\bdiscord\b/i,src:"/product-covers/discord.webp"},
 {brand:"google-play",pattern:/\bgoogle\s+play\b/i,src:"/product-covers/google-play.webp"},
 {brand:"apple",pattern:/\b(?:apple|itunes)\b/i,src:"/product-covers/apple.webp"},
 {brand:"nintendo",pattern:/\bnintendo\b/i,src:"/product-covers/nintendo.webp"},
 {brand:"razer-gold",pattern:/\brazer[\s_-]*gold\b/i,src:"/product-covers/razer-gold.webp"},
 {brand:"battle-net",pattern:/\bbattle[.\s_-]*net\b/i,src:"/product-covers/battle-net.webp"},
 {brand:"fortnite",pattern:/\bfortnite\b/i,src:"/product-covers/fortnite.webp"},
 {brand:"world-of-warcraft",pattern:/\b(?:world\s+of\s+warcraft|wow\s+timecard)\b/i,src:"/product-covers/world-of-warcraft.webp"},
 {brand:"riot",pattern:/\b(?:riot|league\s+of\s+legends)\b/i,src:"/product-covers/riot.webp"},
 {brand:"undawn",pattern:/\bundawn\b/i,src:"/product-covers/undawn.webp"},
 {brand:"tinder",pattern:/\btinder\b/i,src:"/product-covers/tinder.webp"},
 {brand:"gearup",pattern:/\bgear\s?up\b/i,src:"/product-covers/gearup.webp"},
 {brand:"exitlag",pattern:/\bexit\s?lag\b/i,src:"/product-covers/exitlag.webp"},
 {brand:"ea",pattern:/\bea\b/i,src:"/product-covers/ea.webp"},
] as const;
export function brandArtwork(name:string){let src:string|undefined,index=Infinity;for(const rule of BRAND_ARTWORK_RULES){const match=rule.pattern.exec(name);if(match&&match.index<index){src=rule.src;index=match.index}}return src}
