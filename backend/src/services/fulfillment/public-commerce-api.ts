/** Documented Public API transport. Private preparation only; never enables financial routes or fabricates a price lock. */
import {createHash} from 'node:crypto';import {z} from 'zod';import {parseMoney} from '../../money.js';
const money=z.union([z.number().finite(),z.string()]).transform(String).refine(v=>/^(0|[1-9]\d{0,9})(\.\d{1,6})?$/.test(v),'Exact nonnegative six-decimal amount required');
const envelope=z.object({status:z.enum(['SUCCESS','IN_PROGRESS','PARTIALLY_COMPLETED','CANCELLED']),statusCode:z.number().int(),traceId:z.string().max(250).optional(),data:z.unknown()});
export type SpendCapEvidence={verified:boolean;currency:'USD';remainingUsd:string;keyFingerprint:string;observedAt:number};
export class PublicCommerceApi {
 readonly keyFingerprint:string;
 constructor(private apiKey:string,private fetcher:typeof fetch=fetch){if(!apiKey)throw Error('SERVER_KEY_REQUIRED');this.keyFingerprint=createHash('sha256').update(apiKey).digest('hex')}
 private async request(path:string,method:'GET'|'POST',body?:object){const r=await this.fetcher('https://approute.io/api/v1'+path,{method,headers:{'X-API-Key':this.apiKey,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(12000)});if(!r.ok){await r.body?.cancel();throw Error('PROVIDER_HTTP_'+r.status)}const reader=r.body?.getReader();if(!reader)throw Error('PROVIDER_EMPTY_RESPONSE');let size=0,text='';const decoder=new TextDecoder();for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>262144){await reader.cancel();throw Error('PROVIDER_RESPONSE_TOO_LARGE')}text+=decoder.decode(value,{stream:true})}text+=decoder.decode();const v=envelope.parse(JSON.parse(text));if(![0,1,2].includes(v.statusCode))throw Error('PROVIDER_APPLICATION_'+v.statusCode);return {...v,httpStatus:r.status}}
 async voucherService(serviceId:string){
  if(!/^[a-fA-F0-9-]{36}$/.test(serviceId))throw Error('CATALOG_ID_INVALID');
  const v=await this.request('/services/'+serviceId,'GET');if(v.status!=='SUCCESS')throw Error('SERVICE_UNVERIFIED');
  const d=z.object({id:z.string(),type:z.literal('voucher'),countryCode:z.string().min(1).max(20),fields:z.array(z.unknown()).length(0).nullable().optional()}).parse(v.data);
  if(d.id!==serviceId)throw Error('SERVICE_MISMATCH');return d;
 }
 async procurementCashUsd(){const v=await this.request('/accounts','GET');if(v.status!=='SUCCESS')throw Error('BALANCE_UNVERIFIED');const data=z.object({items:z.array(z.object({currency:z.string(),balance:money,available:money,overdraftLimit:money.optional()})).max(20)}).parse(v.data),rows=data.items.filter(a=>a.currency==='USD');const account=rows[0];if(rows.length!==1||!account)throw Error('USD_BALANCE_UNVERIFIED');const cash=parseMoney(account.balance),available=parseMoney(account.available);return {currency:'USD' as const,availableUnits:(cash<available?cash:available).toString(),observedAt:Date.now(),overdraftUsed:false}}
 async item(serviceId:string,itemId:string){for(const s of [serviceId,itemId])if(!/^[a-fA-F0-9-]{36}$/.test(s))throw Error('CATALOG_ID_INVALID');const v=await this.request('/services/'+serviceId+'/items/'+itemId,'GET');if(v.status!=='SUCCESS')throw Error('ITEM_UNVERIFIED');const d=z.object({id:z.string(),price:money,currency:z.literal('USD'),inStock:z.number().int().nonnegative(),isLongOrder:z.boolean().optional()}).parse(v.data);if(d.id!==itemId||d.inStock<1)throw Error('ITEM_UNAVAILABLE');return {...d,priceUsdUnits:parseMoney(d.price).toString(),observedAt:Date.now(),fixedFinalQuote:false}}
 async createVoucher(referenceId:string,denominationId:string,expectedUsdUnits:string,cap:SpendCapEvidence,now=Date.now()){
  this.reference(referenceId);if(!/^[a-fA-F0-9-]{36}$/.test(denominationId))throw Error('CATALOG_ID_INVALID');if(!/^[1-9]\d{0,6}$/.test(expectedUsdUnits)||BigInt(expectedUsdUnits)>1000000n)throw Error('OWNER_ONE_DOLLAR_LIMIT');
  const remaining=money.safeParse(cap.remainingUsd);if(typeof cap.remainingUsd!=='string'||!cap.verified||cap.currency!=='USD'||cap.keyFingerprint!==this.keyFingerprint||!remaining.success||parseMoney(remaining.data)<=0n||parseMoney(remaining.data)>1000000n||parseMoney(remaining.data)<BigInt(expectedUsdUnits)||!Number.isInteger(cap.observedAt)||cap.observedAt>now||now-cap.observedAt>15000)throw Error('VERIFIED_SERVER_ONE_DOLLAR_CAP_REQUIRED');
  // Exactly one call. No SDK default 429/5xx POST retries and no body-ignored idempotency replay assumptions.
  return this.request('/orders','POST',{ordersType:'shop',referenceId,orders:[{denominationId,quantity:1,isLongOrder:false,fields:[]}]});
 }
 private reference(s:string){if(!/^[a-zA-Z0-9_-]{1,40}$/.test(s))throw Error('REFERENCE_INVALID')}
 async orderTransactions(orderId:string){
  if(!orderId||orderId.length>180)throw Error('ORDER_ID_REQUIRED_FOR_ACCOUNTING');
  const q=new URLSearchParams({currency:'USD',orderId,limit:'20',offset:'0'}),v=await this.request('/accounts/transactions?'+q,'GET');
  if(v.status!=='SUCCESS')throw Error('SETTLEMENT_UNVERIFIED');
  const d=z.object({totalCount:z.number().int().positive().max(20),items:z.array(z.object({currency:z.literal('USD'),orderId:z.union([z.string(),z.number()]),orderIdRaw:z.union([z.string(),z.number()]).optional(),amount:z.union([z.string(),z.number().finite()]).transform(String).refine(s=>/^-?(0|[1-9]\d{0,9})(\.\d{1,6})?$/.test(s))})).min(1).max(20)}).parse(v.data);
  if(d.totalCount!==d.items.length)throw Error('SETTLEMENT_PAGE_INCOMPLETE');
  return d.items.map(t=>{if(String(t.orderId)!==orderId&&String(t.orderIdRaw)!==orderId)throw Error('SETTLEMENT_ORDER_MISMATCH');return {amountUnits:t.amount.startsWith('-')?-parseMoney(t.amount.slice(1)):parseMoney(t.amount)}});
 }
 async orderStatus(referenceId:string,orderId?:string){this.reference(referenceId);const q=new URLSearchParams({referenceId,limit:'1',offset:'0',unhide:'false'});if(orderId){if(orderId.length>180||!orderId)throw Error('ORDER_ID_INVALID');q.set('orderId',orderId)}return this.request('/orders?'+q,'GET')}
 async receiveVouchers(referenceId:string,orderId:string){this.reference(referenceId);if(!orderId||orderId.length>180)throw Error('ORDER_ID_REQUIRED_FOR_RECEIPT');const q=new URLSearchParams({referenceId,orderId,limit:'1',offset:'0',unhide:'true'});return this.request('/orders?'+q,'GET')}
}
