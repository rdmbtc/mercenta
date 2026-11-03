import {retailResponse,retailWallet,retailKey,retailUpstream,sameOrigin,smallJson,fulfillSchema,readQuote} from '@/lib/mainnet-retail';
import {getDb} from '@/lib/db';
import {notifyAdminsNewOrder} from '@/lib/telegram-admin';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!sameOrigin(req))return retailResponse({error:'ORIGIN_NOT_ALLOWED'},403);
 const wallet=retailWallet(req);if(!wallet)return retailResponse({error:'SIGN_IN_REQUIRED'},401);
 const key=retailKey();if(!key)return retailResponse({error:'RETAIL_NOT_CONFIGURED'},503);
 let data;try{data=fulfillSchema.parse(await smallJson(req));}catch{return retailResponse({error:'INVALID_REQUEST'},400);}
 if(data.wallet.toLowerCase()!==wallet)return retailResponse({error:'WALLET_MISMATCH'},403);
 const q=readQuote(data.quote,key);
 if(!q||q.wallet!==wallet||q.denominationId!==data.denominationId||q.quantity!==data.quantity||q.accountReference!==data.accountReference)return retailResponse({error:'INVALID_OR_EXPIRED_QUOTE'},409);
 const res = await retailUpstream('fulfill',wallet,key,{txHash:data.txHash,wallet,denominationId:q.denominationId,quantity:q.quantity,productName:q.productName,optionName:q.optionName,productType:q.productType,accountReference:q.accountReference,expectedAmountUnits:q.amountUnits});
 if(res.ok){
  try {
   const cloned = res.clone();
   const body = await cloned.json() as { success?: boolean; orderId?: string };
   if(body && body.success){
    const orderId = String(body.orderId || ('ord_' + data.txHash.slice(2, 18)));
    const now = Date.now();
    const units = BigInt(q.amountUnits);
    const amountUsdc = (Number(units) / 1e6).toFixed(6);
    try {
     getDb().prepare(
      'INSERT OR IGNORE INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, payment_tx_hash, delivery_status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
     ).run(orderId, q.productName, wallet, Number(units), 'FULFILLED', data.txHash.toLowerCase(), 'DELIVERED', now + 3600000, now, now);
    } catch {}
    notifyAdminsNewOrder({
     orderId,
     productId: q.denominationId,
     productName: `${q.productName} · ${q.optionName}`,
     customerWallet: wallet,
     telegramUsername: q.accountReference && q.accountReference.startsWith('@') ? q.accountReference : undefined,
     amountUsdc,
     txHash: data.txHash,
     status: 'FULFILLED',
     network: 'Arc Mainnet (5042)',
     quantity: q.quantity,
    }).catch(err => console.error('Admin notification error:', err));
   }
  } catch {}
 }
 return res;
}
