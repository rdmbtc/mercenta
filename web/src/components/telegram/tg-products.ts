export interface TgProductDenomination {
  id: string;
  label: string;
  priceUsdc: number;
  badge?: string;
}

export interface TgProduct {
  id: string;
  name: string;
  brand: string;
  category: 'gaming' | 'subscriptions' | 'microdonations' | 'developer' | 'compute';
  categoryLabel: string;
  coverImage: string;
  region: string;
  shortDesc: string;
  instantDelivery: boolean;
  denominations: TgProductDenomination[];
}

export const TG_CATEGORIES = [
  { id: 'all', label: 'All Products', icon: 'Sparkles' },
  { id: 'gaming', label: 'Gaming Keys & Vouchers', icon: 'Gamepad2' },
  { id: 'subscriptions', label: 'Streaming & Media', icon: 'Tv' },
  { id: 'microdonations', label: 'Creator & In-Game', icon: 'Zap' },
  { id: 'developer', label: 'Developer API Pools', icon: 'Code' },
  { id: 'compute', label: 'Cloud GPU Vouchers', icon: 'Cpu' },
] as const;

export const TG_CATALOG_PRODUCTS: TgProduct[] = [
  // 1. Gaming Keys & Platform Vouchers
  {
    id: 'mct-steam-wallet',
    name: 'Steam Wallet USD Code',
    brand: 'Valve / Steam',
    category: 'gaming',
    categoryLabel: 'Gaming Keys & Platform Vouchers',
    coverImage: '/product-covers/steamwalletgiftcard.jpg',
    region: 'GLOBAL / US',
    shortDesc: 'Instant top-up for Steam games, DLCs, and community market items.',
    instantDelivery: true,
    denominations: [
      { id: 'steam-10', label: '$10.00 Steam Wallet', priceUsdc: 10.0 },
      { id: 'steam-25', label: '$25.00 Steam Wallet', priceUsdc: 25.0, badge: 'POPULAR' },
      { id: 'steam-50', label: '$50.00 Steam Wallet', priceUsdc: 50.0 },
      { id: 'steam-100', label: '$100.00 Steam Wallet', priceUsdc: 100.0 },
    ],
  },
  {
    id: 'mct-playstation-network',
    name: 'PlayStation Network Card',
    brand: 'Sony PlayStation',
    category: 'gaming',
    categoryLabel: 'Gaming Keys & Platform Vouchers',
    coverImage: '/product-covers/Playstationgiftcards.png',
    region: 'US / Global',
    shortDesc: 'PS Store funds for PS5 and PS4 games, add-ons, and subscriptions.',
    instantDelivery: true,
    denominations: [
      { id: 'psn-10', label: '$10.00 PSN Voucher', priceUsdc: 10.0 },
      { id: 'psn-25', label: '$25.00 PSN Voucher', priceUsdc: 25.0, badge: 'HOT' },
      { id: 'psn-50', label: '$50.00 PSN Voucher', priceUsdc: 50.0 },
      { id: 'psn-75', label: '$75.00 PSN Voucher', priceUsdc: 75.0 },
    ],
  },
  {
    id: 'mct-xbox-card',
    name: 'Xbox Live & Game Pass Gift Card',
    brand: 'Microsoft Xbox',
    category: 'gaming',
    categoryLabel: 'Gaming Keys & Platform Vouchers',
    coverImage: '/product-covers/xboxgiftcard.png',
    region: 'GLOBAL',
    shortDesc: 'Redeemable for Xbox Game Pass Ultimate and digital console games.',
    instantDelivery: true,
    denominations: [
      { id: 'xbox-15', label: '$15.00 Xbox Card', priceUsdc: 15.0 },
      { id: 'xbox-25', label: '$25.00 Xbox Card', priceUsdc: 25.0 },
      { id: 'xbox-50', label: '$50.00 Xbox Card', priceUsdc: 50.0 },
    ],
  },
  {
    id: 'mct-roblox-card',
    name: 'Roblox Digital Gift Card',
    brand: 'Roblox Corporation',
    category: 'gaming',
    categoryLabel: 'Gaming Keys & Platform Vouchers',
    coverImage: '/product-covers/robloxgiftcards.png',
    region: 'GLOBAL',
    shortDesc: 'Converts to Robux and exclusive virtual avatar items.',
    instantDelivery: true,
    denominations: [
      { id: 'roblox-10', label: '$10.00 (800 Robux)', priceUsdc: 10.0 },
      { id: 'roblox-25', label: '$25.00 (2,000 Robux)', priceUsdc: 25.0, badge: 'TRENDING' },
      { id: 'roblox-50', label: '$50.00 (4,500 Robux)', priceUsdc: 50.0 },
    ],
  },
  {
    id: 'mct-valorant-points',
    name: 'Valorant Riot Points Voucher',
    brand: 'Riot Games',
    category: 'gaming',
    categoryLabel: 'Gaming Keys & Platform Vouchers',
    coverImage: '/product-covers/valorantgiftcard.jpeg',
    region: 'GLOBAL',
    shortDesc: 'Unlock agent skins, weapon bundles, and Battle Pass directly.',
    instantDelivery: true,
    denominations: [
      { id: 'val-1000', label: '1,000 Valorant Points', priceUsdc: 9.99 },
      { id: 'val-2050', label: '2,050 Valorant Points', priceUsdc: 19.99 },
      { id: 'val-3650', label: '3,650 Valorant Points', priceUsdc: 34.99 },
    ],
  },

  // 2. Streaming & Media Subscriptions
  {
    id: 'mct-apple-gift-card',
    name: 'Apple Gift Card & App Store Code',
    brand: 'Apple',
    category: 'subscriptions',
    categoryLabel: 'Streaming & Media Subscriptions',
    coverImage: '/product-covers/applegiftcard.png',
    region: 'US / Global',
    shortDesc: 'Valid for Apple Music, iCloud+, App Store, and Apple TV+.',
    instantDelivery: true,
    denominations: [
      { id: 'apple-10', label: '$10.00 Apple Card', priceUsdc: 10.0 },
      { id: 'apple-25', label: '$25.00 Apple Card', priceUsdc: 25.0, badge: 'POPULAR' },
      { id: 'apple-50', label: '$50.00 Apple Card', priceUsdc: 50.0 },
      { id: 'apple-100', label: '$100.00 Apple Card', priceUsdc: 100.0 },
    ],
  },
  {
    id: 'mct-spotify-sub',
    name: 'Spotify Premium Digital Code',
    brand: 'Spotify',
    category: 'subscriptions',
    categoryLabel: 'Streaming & Media Subscriptions',
    coverImage: '/product-covers/spotify.webp',
    region: 'GLOBAL',
    shortDesc: 'Ad-free high-fidelity music streaming and offline playback.',
    instantDelivery: true,
    denominations: [
      { id: 'spot-1m', label: '1 Month Premium', priceUsdc: 10.99 },
      { id: 'spot-3m', label: '3 Months Premium', priceUsdc: 31.99 },
      { id: 'spot-6m', label: '6 Months Premium', priceUsdc: 59.99 },
    ],
  },
  {
    id: 'mct-discord-nitro',
    name: 'Discord Nitro Subscription Code',
    brand: 'Discord',
    category: 'subscriptions',
    categoryLabel: 'Streaming & Media Subscriptions',
    coverImage: '/product-covers/discord.webp',
    region: 'GLOBAL',
    shortDesc: 'Includes 2 Server Boosts, HD streaming, custom emojis and perks.',
    instantDelivery: true,
    denominations: [
      { id: 'nitro-basic', label: '1 Month Nitro Basic', priceUsdc: 2.99 },
      { id: 'nitro-full', label: '1 Month Nitro Full', priceUsdc: 9.99, badge: 'HOT' },
      { id: 'nitro-year', label: '1 Year Nitro Full', priceUsdc: 99.99 },
    ],
  },

  // 3. Creator & Game Micro-Donations
  {
    id: 'mct-telegram-stars',
    name: 'Telegram Stars (Instant Direct Top-Up)',
    brand: 'Telegram',
    category: 'microdonations',
    categoryLabel: 'Creator & Game Micro-Donations',
    coverImage: '/product-covers/telegramstars.png',
    region: 'GLOBAL',
    shortDesc: 'Official in-app digital currency for Telegram Mini Apps & bots.',
    instantDelivery: true,
    denominations: [
      { id: 'stars-50', label: '50 Telegram Stars', priceUsdc: 0.99 },
      { id: 'stars-100', label: '100 Telegram Stars', priceUsdc: 1.89, badge: 'BESTSELLER' },
      { id: 'stars-250', label: '250 Telegram Stars', priceUsdc: 4.49 },
      { id: 'stars-500', label: '500 Telegram Stars', priceUsdc: 8.79 },
      { id: 'stars-1000', label: '1,000 Telegram Stars', priceUsdc: 16.99 },
    ],
  },
  {
    id: 'mct-telegram-premium',
    name: 'Telegram Premium Subscription Gift',
    brand: 'Telegram',
    category: 'microdonations',
    categoryLabel: 'Creator & Game Micro-Donations',
    coverImage: '/product-covers/telegrampremium.png',
    region: 'GLOBAL',
    shortDesc: 'Double limits, 4GB uploads, voice-to-text, zero ads and badges.',
    instantDelivery: true,
    denominations: [
      { id: 'tgprem-3m', label: '3 Months Premium Gift', priceUsdc: 11.99 },
      { id: 'tgprem-6m', label: '6 Months Premium Gift', priceUsdc: 16.99, badge: 'VALUE' },
      { id: 'tgprem-12m', label: '12 Months Premium Gift', priceUsdc: 29.99 },
    ],
  },
  {
    id: 'mct-pubg-mobile',
    name: 'PUBG Mobile UC Top-Up',
    brand: 'Krafton / Tencent',
    category: 'microdonations',
    categoryLabel: 'Creator & Game Micro-Donations',
    coverImage: '/product-covers/pubgmobiletopup.png',
    region: 'GLOBAL / CIS',
    shortDesc: 'Unknown Cash (UC) for Royale Pass, crates, and character outfits.',
    instantDelivery: true,
    denominations: [
      { id: 'pubg-60', label: '60 UC Top-Up', priceUsdc: 0.98 },
      { id: 'pubg-325', label: '325 UC Top-Up', priceUsdc: 4.95, badge: 'HOT' },
      { id: 'pubg-660', label: '660 UC Top-Up', priceUsdc: 9.85 },
      { id: 'pubg-1800', label: '1,800 UC Top-Up', priceUsdc: 24.50 },
    ],
  },
  {
    id: 'mct-freefire-diamonds',
    name: 'Garena Free Fire Diamonds',
    brand: 'Garena',
    category: 'microdonations',
    categoryLabel: 'Creator & Game Micro-Donations',
    coverImage: '/product-covers/freefirecis.png',
    region: 'GLOBAL',
    shortDesc: 'In-game diamonds for weapon skins, elite passes, and spins.',
    instantDelivery: true,
    denominations: [
      { id: 'ff-100', label: '100 + 10 Bonus Diamonds', priceUsdc: 1.15 },
      { id: 'ff-310', label: '310 + 31 Bonus Diamonds', priceUsdc: 3.40 },
      { id: 'ff-520', label: '520 + 52 Bonus Diamonds', priceUsdc: 5.60 },
    ],
  },

  // 4. Developer API & Token Bundles
  {
    id: 'mct-developer-api-bundle',
    name: 'AI Model Inference Token Pool',
    brand: 'Mercenta Developer Rails',
    category: 'developer',
    categoryLabel: 'Developer API & Token Bundles',
    coverImage: '/products/developer.webp',
    region: 'GLOBAL API',
    shortDesc: 'Wholesale prepaid credit vouchers for LLMs, vision, and agent runs.',
    instantDelivery: true,
    denominations: [
      { id: 'api-10', label: '10M Inference Credits', priceUsdc: 10.0 },
      { id: 'api-50', label: '55M Inference Credits (+10% Bonus)', priceUsdc: 50.0, badge: 'AGENT PACK' },
      { id: 'api-100', label: '120M Inference Credits (+20% Bonus)', priceUsdc: 100.0 },
    ],
  },

  // 5. Cloud Compute & GPU Vouchers
  {
    id: 'mct-cloud-gpu-voucher',
    name: 'Dedicated H100 / A100 GPU Hour Voucher',
    brand: 'Mercenta Compute Vault',
    category: 'compute',
    categoryLabel: 'Cloud Compute & GPU Vouchers',
    coverImage: '/products/compute.webp',
    region: 'GLOBAL DATACENTER',
    shortDesc: 'Instant verifiable reservation for high-performance cluster compute.',
    instantDelivery: true,
    denominations: [
      { id: 'gpu-10h', label: '10 H100 GPU Compute Hours', priceUsdc: 24.90 },
      { id: 'gpu-50h', label: '50 H100 GPU Compute Hours', priceUsdc: 115.0, badge: 'PRO CLUSTER' },
      { id: 'gpu-100h', label: '100 H100 GPU Compute Hours', priceUsdc: 219.0 },
    ],
  },
];
