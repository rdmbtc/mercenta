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
  amount_units: string;
  status: 'FULFILLED' | 'PENDING' | 'RECORDED';
  tx_hash: string;
  codes: string[];
  network: 'mainnet';
  delivery_source?: 'provider_response' | 'historical_reference' | 'unconfirmed';
}
const STORAGE_KEY = 'mercenta-mainnet-orders';
const addressPattern = /^0x[a-f0-9]{40}$/i;
const hashPattern = /^0x[a-f0-9]{64}$/i;

/** Exact six-decimal money; never silently round prices or default to a different amount. */
export function mainnetAmountUnits(value: string, quantity = 1): string {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) throw new Error('INVALID_QUANTITY');
  if (!/^\d{1,12}(?:\.\d{1,6})?$/.test(value)) throw new Error('INVALID_USDC_AMOUNT');
  const [whole, fraction = ''] = value.split('.');
  const units = (BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0'))) * BigInt(quantity);
  if (units <= 0n) throw new Error('INVALID_USDC_AMOUNT');
  return units.toString();
}
export function mainnetAmountDisplay(units: string): string {
  if (!/^\d+$/.test(units)) throw new Error('INVALID_USDC_UNITS');
  const n = BigInt(units);
  return `${n / 1_000_000n}.${(n % 1_000_000n).toString().padStart(6, '0')}`;
}
export function providerDeliveryCodes(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) return [];
  if (!value.every(c => typeof c === 'string' && c.trim().length > 0 && c.length <= 4096 && !c.startsWith('MCT-'))) return [];
  return value as string[];
}
/** Public historical references contain no redeemable keys or private delivery details.
 * These are not fresh provider/chain verification results and must not imply delivery. */
const HISTORICAL_REFERENCES: MainnetOrder[] = [
  {id:'mct-ord-aefe4925-stars',created_at:Date.parse('2026-10-11T21:04:04Z'),initiator:'0x5d11…b139',initiator_address:'0x5d11017ff3e9fdbb9aaa2d4daf56450322ecb139',reference:'0xaefe49251601…',name:'Telegram Stars (50 Stars) · Telegram Stars',product_id:'7295df4e-6fb0-4dfb-b962-ded3d073bc03',country:'GLOBAL',quantity:1,amount_units:'830000',status:'RECORDED',tx_hash:'0xaefe4925160179f02222d4ccb23be28c93bc7c4c8c3a51cc101f474f157d99d3',codes:[],network:'mainnet',delivery_source:'historical_reference'},
  {id:'mct-ord-cf322d7d-stars',created_at:Date.parse('2026-10-10T23:32:12Z'),initiator:'0x0b2c…4bdd',initiator_address:'0x0b2ce1f0f24fb9f5510daead55602913962f4bdd',reference:'0xcf322d7d8049…',name:'Telegram Stars · Telegram Stars',product_id:'7295df4e-6fb0-4dfb-b962-ded3d073bc03',country:'GLOBAL',quantity:1,amount_units:'830000',status:'RECORDED',tx_hash:'0xcf322d7d8049bbf7f11d6cde15d8c56bde4a81dade45a1201b41e4751662253e',codes:[],network:'mainnet',delivery_source:'historical_reference'},
  {id:'mct-ord-a5d03fd9-canary',created_at:Date.parse('2026-10-10T21:43:06Z'),initiator:'0x0b2c…4bdd',initiator_address:'0x0b2ce1f0f24fb9f5510daead55602913962f4bdd',reference:'0xa5d03fd92bab…',name:'Apple Gift Card · TRY 40 App Store & iTunes code',product_id:'mainnet:apple-gift-card-tr',country:'TR',quantity:1,amount_units:'830000',status:'RECORDED',tx_hash:'0xa5d03fd92bab5961cdc2e2e35d273ccc8df0a45eb5245d3b657c0718c6c7439d',codes:[],network:'mainnet',delivery_source:'historical_reference'},
];
function normalizeOrder(value: unknown): MainnetOrder | null {
  if (!value || typeof value !== 'object') return null;
  const o = value as MainnetOrder;
  if (typeof o.id !== 'string' || typeof o.name !== 'string' || !hashPattern.test(o.tx_hash) || !addressPattern.test(o.initiator_address ?? '') || !/^\d+$/.test(o.amount_units) || !Number.isFinite(o.created_at) || o.created_at <= 0 || !Number.isSafeInteger(o.quantity) || o.quantity < 1 || o.quantity > 100 || o.network !== 'mainnet') return null;
  // Migrate legacy browser records: old code fabricated keys and top-up success markers.
  const codes = o.delivery_source === 'provider_response' ? providerDeliveryCodes(o.codes) : [];
  return {...o,codes,status:codes.length ? 'FULFILLED' : o.status === 'PENDING' ? 'PENDING' : 'RECORDED',delivery_source:codes.length ? 'provider_response' : o.delivery_source === 'historical_reference' ? 'historical_reference' : 'unconfirmed'};
}
function storedOrders(): MainnetOrder[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw.map(normalizeOrder).filter((o): o is MainnetOrder => !!o) : [];
  } catch { return []; }
}
export function getMainnetOrders(wallet?: string | null): MainnetOrder[] {
  if (typeof window === 'undefined' || !wallet || !addressPattern.test(wallet.trim())) return [];
  const w = wallet.trim().toLowerCase();
  const result = storedOrders().filter(o => o.initiator_address?.toLowerCase() === w);
  for (const known of HISTORICAL_REFERENCES) {
    if (known.initiator_address === w && !result.some(o => o.tx_hash.toLowerCase() === known.tx_hash)) result.push({...known,codes:[]});
  }
  return result.sort((a,b) => b.created_at-a.created_at);
}
export function saveMainnetOrder(order: MainnetOrder): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeOrder(order);
  if (!normalized) return;
  try {
    const stored = storedOrders().filter(o => o.tx_hash.toLowerCase() !== normalized.tx_hash.toLowerCase());
    stored.unshift(normalized);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(stored));
    window.dispatchEvent(new Event('mercenta-order-completed'));
  } catch { /* Storage availability never changes the settlement result. */ }
}
export async function syncRemoteOrders(wallet?: string | null): Promise<void> {
  if (typeof window === 'undefined' || !wallet || !addressPattern.test(wallet.trim())) return;
  const w = wallet.trim().toLowerCase();
  try {
    const res = await fetch(`/api/mainnet/orders?wallet=${encodeURIComponent(w)}`,{headers:{Accept:'application/json'},credentials:'same-origin',cache:'no-store'});
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data.orders)) return;
    for (const item of data.orders) {
      try {
        const codes = providerDeliveryCodes(item.codes);
        // No fabricated default price, date, wallet attribution or delivery.
        if (!hashPattern.test(item.tx_hash) || !codes.length || !item.amount_usdc || !Number.isFinite(Number(item.created_at)) || Number(item.created_at) <= 0) continue;
        const remoteWallet = item.wallet ?? item.buyer_address;
        if (remoteWallet && String(remoteWallet).toLowerCase() !== w) continue;
        saveMainnetOrder({id:'mct-ord-'+item.tx_hash.slice(2),created_at:Number(item.created_at),initiator:w.slice(0,6)+'…'+w.slice(-4),initiator_address:w,reference:item.reference_id || item.tx_hash,name:item.product_name ? `${item.product_name} · ${item.option_name || ''}` : 'Digital goods',product_id:item.denomination_id || 'mainnet:voucher',country:item.country || 'GLOBAL',quantity:item.quantity ?? 1,amount_units:mainnetAmountUnits(String(item.amount_usdc)),status:'FULFILLED',tx_hash:item.tx_hash,codes,network:'mainnet',delivery_source:'provider_response'});
      } catch { /* Malformed records must not invent history. */ }
    }
  } catch { /* Existing local references remain available during an outage. */ }
}
/** Redacted, portable account record. It is not independent settlement or delivery proof. */
export function mainnetReceiptExport(order: MainnetOrder) {
  const o = normalizeOrder(order);
  if (!o) throw new Error('INVALID_MAINNET_ORDER');
  return {schema:'mercenta.account-receipt.v1',network:'Arc Mainnet',chainId:5042,orderId:o.id,recordedAt:new Date(o.created_at).toISOString(),item:o.name,quantity:o.quantity,amount:{units:o.amount_units,decimals:6,usdc:mainnetAmountDisplay(o.amount_units)},buyer:o.initiator_address,transaction:{hash:o.tx_hash,explorer:`https://explorer.arc.io/tx/${o.tx_hash}`,verification:'not_independently_verified_by_this_export'},delivery:{status:o.status,source:o.delivery_source,redacted:true},note:'Payment, supplier delivery and funding provenance require separate evidence. Activation codes and recipient handles are excluded.'};
}
