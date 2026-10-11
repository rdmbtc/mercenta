// Curated quick-select products for Arc Mainnet USDC checkout
export interface QuickSelectProduct {
  id: string;
  name: string;
  category: 'gaming' | 'creator' | 'developer' | 'cloud' | 'streaming';
  country: string;
  price: string; // in USDC
  kind: 'Shop' | 'Direct Top-Up';
  denomination_id?: string;
}

export const mainnetQuickSelect: QuickSelectProduct[] = [
  {
    id: '7295df4e-6fb0-4dfb-b962-ded3d073bc03',
    denomination_id: '7295df4e-6fb0-4dfb-b962-ded3d073bc03',
    name: 'Telegram Stars (custom quantity) · Telegram Stars',
    category: 'creator',
    country: 'GLOBAL',
    price: '0.830000',
    kind: 'Direct Top-Up',
  },
  {
    id: 'mainnet:apple-gift-card-tr',
    denomination_id: 'mainnet:apple-gift-card-tr',
    name: 'Apple Gift Card · App Store & iTunes',
    category: 'gaming',
    country: 'TR',
    price: '0.830000',
    kind: 'Shop',
  },
  {
    id: 'mainnet:steam-gift-card',
    denomination_id: 'mainnet:steam-gift-card',
    name: 'Steam Gift Card · Wallet Code',
    category: 'gaming',
    country: 'GLOBAL',
    price: '5.000000',
    kind: 'Shop',
  },
  {
    id: 'mainnet:psn-card',
    denomination_id: 'mainnet:psn-card',
    name: 'PlayStation Network (PSN) · Digital Voucher',
    category: 'gaming',
    country: 'US',
    price: '10.000000',
    kind: 'Shop',
  },
  {
    id: 'mainnet:xbox-game-pass',
    denomination_id: 'mainnet:xbox-game-pass',
    name: 'Xbox Game Pass / Gift Card',
    category: 'gaming',
    country: 'US',
    price: '10.000000',
    kind: 'Shop',
  },
  {
    id: 'mainnet:roblox-gift-card',
    denomination_id: 'mainnet:roblox-gift-card',
    name: 'Roblox Digital Gift Card · Robux Voucher',
    category: 'gaming',
    country: 'GLOBAL',
    price: '10.000000',
    kind: 'Shop',
  },
  {
    id: 'mainnet:spotify-premium',
    denomination_id: 'mainnet:spotify-premium',
    name: 'Spotify Premium · Individual Subscription',
    category: 'streaming',
    country: 'GLOBAL',
    price: '4.500000',
    kind: 'Shop',
  },
  {
    id: 'mainnet:gpu-compute',
    denomination_id: 'mainnet:gpu-compute',
    name: 'Cloud GPU & Dedicated Compute Voucher',
    category: 'cloud',
    country: 'GLOBAL',
    price: '9.500000',
    kind: 'Shop',
  },
  {
    id: 'mainnet:developer-api-bundle',
    denomination_id: 'mainnet:developer-api-bundle',
    name: 'Developer API & AI Token Bundle',
    category: 'developer',
    country: 'GLOBAL',
    price: '6.000000',
    kind: 'Shop',
  },
];
