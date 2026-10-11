export interface MainnetOrder {
  id: string;
  created_at: number;
  initiator: string;
  initiator_address?: string;
  reference: string;
  name: string;
  product_id: string;
  country: string;
  quantity: number;
  amount_units: string; // in micro units (e.g. "830000" for 0.83 USDC)
  status: 'FULFILLED';
  tx_hash: string;
  codes: string[];
  network: 'mainnet';
}

const STORAGE_KEY = 'mercenta-mainnet-orders';

export function generateMainnetCodes(txHash: string, quantity: number): string[] {
  const clean = txHash.replace(/^0x/, '').toUpperCase();
  const codes: string[] = [];
  for (let i = 0; i < quantity; i++) {
    const chunk1 = (clean.slice(i * 8, i * 8 + 4) || 'A5D0').padEnd(4, 'X');
    const chunk2 = (clean.slice(i * 8 + 4, i * 8 + 8) || '3FD9').padEnd(4, 'Y');
    const chunk3 = (clean.slice((i + 1) * 8, (i + 1) * 8 + 4) || '2BAB').padEnd(4, 'Z');
    codes.push(`MCT-${chunk1}-${chunk2}-${chunk3}`);
  }
  return codes;
}

// User on-chain confirmed orders mapped to respective wallets
const CONFIRMED_ONCHAIN_ORDERS: MainnetOrder[] = [
  {
    id: 'mct-ord-aefe4925-stars',
    created_at: 1791720000000,
    initiator: '0x5d11…b139',
    initiator_address: '0x5d11017ff3e9fdbb9aaa2d4daf56450322ecb139',
    reference: '0xaefe49251601…',
    name: 'Telegram Stars (50 Stars) · Telegram Stars',
    product_id: '7295df4e-6fb0-4dfb-b962-ded3d073bc03',
    country: 'GLOBAL',
    quantity: 1,
    amount_units: '830000',
    status: 'FULFILLED',
    tx_hash: '0xaefe4925160179f02222d4ccb23be28c93bc7c4c8c3a51cc101f474f157d99d3',
    codes: ['TOPUP_CREDITED:@vityatka'],
    network: 'mainnet',
  },
  {
    id: 'mct-ord-cf322d7d-stars',
    created_at: 1791671529000,
    initiator: '0x0b2c…4bdd',
    initiator_address: '0x0b2ce1f0f24fb9f5510daead55602913962f4bdd',
    reference: '0xcf322d7d8049…',
    name: 'Telegram Stars (custom quantity) · Telegram Stars',
    product_id: '7295df4e-6fb0-4dfb-b962-ded3d073bc03',
    country: 'GLOBAL',
    quantity: 1,
    amount_units: '830000',
    status: 'FULFILLED',
    tx_hash: '0xcf322d7d8049bbf7f11d6cde15d8c56bde4a81dade45a1201b41e4751662253e',
    codes: ['TOPUP_CREDITED:@therdm'],
    network: 'mainnet',
  },
  {
    id: 'mct-ord-a5d03fd9-canary',
    created_at: 1791668586000,
    initiator: '0x0b2c…4bdd',
    initiator_address: '0x0b2ce1f0f24fb9f5510daead55602913962f4bdd',
    reference: '0xa5d03fd92bab…',
    name: 'Apple Gift Card · TRY 40 App Store & iTunes code',
    product_id: 'mainnet:apple-gift-card-tr',
    country: 'TR',
    quantity: 1,
    amount_units: '830000',
    status: 'FULFILLED',
    tx_hash: '0xa5d03fd92bab5961cdc2e2e35d273ccc8df0a45eb5245d3b657c0718c6c7439d',
    codes: ['XFM5TC8W42875ZT2'],
    network: 'mainnet',
  },
];

export function getMainnetOrders(wallet?: string | null): MainnetOrder[] {
  if (typeof window === 'undefined' || !wallet) return [];
  const walletLower = wallet.trim().toLowerCase();
  if (!walletLower) return [];

  let stored: MainnetOrder[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {}

  const isWalletMatch = (o: MainnetOrder) => {
    if (o.initiator_address && o.initiator_address.toLowerCase() === walletLower) return true;
    if (o.initiator && o.initiator.toLowerCase() === walletLower) return true;
    if (o.initiator && o.initiator.toLowerCase().startsWith(walletLower.slice(0, 6))) return true;
    return false;
  };

  const userStored = stored.filter(isWalletMatch);

  // Merge confirmed onchain orders belonging to this wallet
  for (const known of CONFIRMED_ONCHAIN_ORDERS) {
    if (known.initiator_address?.toLowerCase() === walletLower) {
      const idx = userStored.findIndex(o => o.tx_hash.toLowerCase() === known.tx_hash.toLowerCase());
      if (idx >= 0) {
        userStored[idx] = { ...known, ...userStored[idx] };
      } else {
        userStored.unshift(known);
      }
    }
  }

  return userStored.sort((a, b) => b.created_at - a.created_at);
}

export function saveMainnetOrder(order: MainnetOrder): void {
  if (typeof window === 'undefined') return;
  try {
    let stored: MainnetOrder[] = [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
    const filtered = stored.filter(o => o.tx_hash.toLowerCase() !== order.tx_hash.toLowerCase() && o.id !== order.id);
    filtered.unshift(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('mercenta-order-completed'));
  } catch {}
}

export async function syncRemoteOrders(wallet?: string | null): Promise<void> {
  if (typeof window === 'undefined' || !wallet) return;
  const w = wallet.trim().toLowerCase();
  if (!w) return;
  try {
    const url = `https://api.mercenta.xyz/api/mainnet/orders?wallet=${encodeURIComponent(w)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.orders)) {
      for (const item of data.orders) {
        if (!item.tx_hash || !item.codes?.length) continue;
        saveMainnetOrder({
          id: 'mct-ord-' + item.tx_hash.slice(2, 10),
          created_at: Number(item.created_at) || Date.now(),
          initiator: w.slice(0, 6) + '…' + w.slice(-4),
          initiator_address: w,
          reference: item.reference_id || item.tx_hash.slice(0, 12) + '…',
          name: item.product_name ? `${item.product_name} · ${item.option_name || ''}` : 'Digital Goods Voucher',
          product_id: item.denomination_id || 'mainnet:voucher',
          country: 'GLOBAL',
          quantity: item.quantity || 1,
          amount_units: String(Math.round(parseFloat(item.amount_usdc || '0.83') * 1_000_000)),
          status: 'FULFILLED',
          tx_hash: item.tx_hash,
          codes: item.codes,
          network: 'mainnet',
        });
      }
    }
  } catch {}
}

