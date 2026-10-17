import {createHmac,timingSafeEqual} from 'node:crypto';
import {requireSession} from '@/lib/auth';
import {getCatalog} from '@/lib/supplier';
import {mainnetAmountUnits} from '@/lib/mainnet-orders';
import {z} from 'zod';
import {mainnetRuntimeStatus} from './mainnet-status';
const address=/^0x[a-f0-9]{40}$/i;
const inputSchema=z.object({denominationId:z.string().min(1).max(200),quantity:z.number().int().min(1).max(100),accountReference:z.string().max(200).default('')}).strict();
export const fulfillSchema=z.object({txHash:z.string().regex(/^0x[a-f0-9]{64}$/i),wallet:z.string().regex(address),denominationId:z.string().min(1).max(200),quantity:z.number().int().min(1).max(100),productName:z.string().max(300),optionName:z.string().max(300),productType:z.enum(['voucher','direct_topup','esim']),accountReference:z.string().max(200),quote:z.string().min(1).max(4000)}).strict();
type Quote={wallet:string;denominationId:string;quantity:number;accountReference:string;amountUnits:string;productName:string;optionName:string;productType:'voucher'|'direct_topup'|'esim';expires:number};
const headers={'Cache-Control':'no-store','Vary':'Cookie'};
export function retailResponse(data:unknown,status=200){return Response.json(data,{status,headers});}
export function retailKey(){const key=process.env.MERCENTA_RETAIL_PROXY_KEY;return key&&key.length>=32?key:null;}
export function retailWallet(req:Request){try{const s=requireSession(req,Date.now());return s&&address.test(s.address)?s.address.toLowerCase():null;}catch{return null;}}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
export async function smallJson(req:Request){if(Number(req.headers.get('content-length')||0)>8192)throw new Error('BODY_TOO_LARGE');const reader=req.body?.getReader();if(!reader)throw new Error('INVALID_BODY');let n=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>8192){await reader.cancel();throw new Error('BODY_TOO_LARGE');}chunks.push(value);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
function sign(payload:string,key:string){return createHmac('sha256',key).update(payload).digest('base64url');}
export function sealQuote(q:Quote,key:string){const payload=Buffer.from(JSON.stringify(q)).toString('base64url');return payload+'.'+sign(payload,key);}
export function readQuote(token:string,key:string):Quote|null{try{const [p,s,...rest]=token.split('.');if(rest.length||!p||!s)return null;const expected=Buffer.from(sign(p,key)),actual=Buffer.from(s);if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;const q=JSON.parse(Buffer.from(p,'base64url').toString());if(!address.test(q.wallet)||!/^\d+$/.test(q.amountUnits)||BigInt(q.amountUnits)<=0n||!Number.isFinite(q.expires)||q.expires<=Date.now())return null;return q;}catch{return null;}}
export async function makeQuote(req:Request){
 if(!sameOrigin(req))return retailResponse({error:'ORIGIN_NOT_ALLOWED'},403);
 const wallet=retailWallet(req);if(!wallet)return retailResponse({error:'SIGN_IN_REQUIRED'},401);
 const key=retailKey();if(!key)return retailResponse({error:'RETAIL_NOT_CONFIGURED'},503);
 let input;try{input=inputSchema.parse(await smallJson(req));}catch{return retailResponse({error:'INVALID_REQUEST'},400);}
 try{
  const status=await mainnetRuntimeStatus();
  if(!status.realPurchasesEnabled)return retailResponse({error:'RETAIL_PAUSED'},503);
  const catalog=await getCatalog();
  const age=Date.now()-Date.parse(catalog.generatedAt);
  if(!catalog.live||catalog.snapshot||!Number.isFinite(age)||age< -60000||age>300000)return retailResponse({error:'LIVE_QUOTE_UNAVAILABLE'},503);
  const product=catalog.products.find(p=>p.denominations.some(d=>d.id===input.denominationId));
  const option=product?.denominations.find(d=>d.id===input.denominationId);
  if(!product||!option||!option.available||option.isLongOrder||option.currency!=='USD'||(option.stock!==undefined&&option.stock<input.quantity))return retailResponse({error:'OPTION_UNAVAILABLE'},409);
  if(product.type==='direct_topup'&&!/^@?[a-zA-Z0-9_.]{3,64}$/.test(input.accountReference.trim()))return retailResponse({error:'ACCOUNT_REFERENCE_REQUIRED'},400);
  const amountUnits=mainnetAmountUnits(String(option.price),input.quantity);
  const q:Quote={wallet,denominationId:option.id,quantity:input.quantity,accountReference:input.accountReference,amountUnits,productName:product.name,optionName:option.name,productType:product.type,expires:Date.now()+600000};
  return retailResponse({quote:sealQuote(q,key),amountUnits,expires:q.expires});
 }catch{return retailResponse({error:'LIVE_QUOTE_UNAVAILABLE'},503);}
}
export async function retailUpstream(path:string,wallet:string,key:string,body?:unknown){
 try{const response=await fetch('https://api.mercenta.xyz/api/mainnet/'+path,{method:body?'POST':'GET',headers:{Accept:'application/json','Content-Type':'application/json','X-Mercenta-Retail-Proxy':key,'X-Mercenta-Wallet':wallet},body:body?JSON.stringify(body):undefined,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(25000)});if(!response.ok)return retailResponse({error:response.status===403?'ORDER_NOT_OWNED':'DELIVERY_UNAVAILABLE'},response.status===403?403:502);const data=await response.json();if(body)return retailResponse({success:data.success===true,status:data.status,codes:data.codes,orderId:data.orderId});if(!Array.isArray(data.orders))return retailResponse({error:'INVALID_UPSTREAM'},502);return retailResponse({orders:data.orders.filter((r:{wallet?:string})=>r.wallet?.toLowerCase()===wallet).map((r:Record<string,unknown>)=>({tx_hash:r.tx_hash,order_id:r.order_id,reference_id:r.reference_id,wallet:r.wallet,product_name:r.product_name,option_name:r.option_name,denomination_id:r.denomination_id,amount_usdc:r.amount_usdc,quantity:r.quantity,status:r.status,created_at:r.created_at,codes:r.codes}))});}catch{return retailResponse({error:'DELIVERY_UNAVAILABLE'},502);}
}
