export interface MainnetOrder {
  id: string;
  created_at: number;
  initiator: string;
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

// User on-chain confirmed order (Tx: 0xa5d03fd92bab5961cdc2e2e35d273ccc8df0a45eb5245d3b657c0718c6c7439d)
const CONFIRMED_ONCHAIN_ORDERS: MainnetOrder[] = [
  {
    id: 'mct-ord-a5d03fd9-canary',
    created_at: 1791668586000,
    initiator: '0x0b2c…4bdd',
    reference: '0xa5d03fd92bab…',
    name: 'Digital Goods Voucher · 0.83 USDC',
    product_id: 'mainnet:digital-goods-voucher',
    country: 'GLOBAL',
    quantity: 1,
    amount_units: '830000',
    status: 'FULFILLED',
    tx_hash: '0xa5d03fd92bab5961cdc2e2e35d273ccc8df0a45eb5245d3b657c0718c6c7439d',
    codes: ['MCT-A5D0-3FD9-2BAB'],
    network: 'mainnet',
  },
];

export function getMainnetOrders(wallet?: string | null): MainnetOrder[] {
  if (typeof window === 'undefined') return [...CONFIRMED_ONCHAIN_ORDERS];
  let stored: MainnetOrder[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {}

  const walletLower = wallet?.toLowerCase();
  for (const known of CONFIRMED_ONCHAIN_ORDERS) {
    const matchesWallet = !walletLower || walletLower === '0x0b2ce1f0f24fb9f5510daead55602913962f4bdd';
    if (matchesWallet && !stored.some(o => o.tx_hash.toLowerCase() === known.tx_hash.toLowerCase())) {
      stored.unshift(known);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } catch {}
    }
  }

  return stored.sort((a, b) => b.created_at - a.created_at);
}

export function saveMainnetOrder(order: MainnetOrder): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getMainnetOrders();
    const filtered = existing.filter(o => o.tx_hash.toLowerCase() !== order.tx_hash.toLowerCase() && o.id !== order.id);
    filtered.unshift(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('mercenta-order-completed'));
  } catch {}
}
