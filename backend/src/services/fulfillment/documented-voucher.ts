import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {DB} from '../../db.js';
import type {Config} from '../../config.js';
import {parseMoney} from '../../money.js';
import {PublicCommerceApi,type SpendCapEvidence} from './public-commerce-api.js';
import {encryptCode,decryptCode,type FulfillmentPort,type SupplyResult} from './index.js';
import {recordProcurementHealth,procurementHealth,reserveProcurement} from '../procurement-health.js';
const uuid=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const money=z.union([z.number().finite(),z.string()]).transform(String).refine(s=>/^(0|[1-9]\d{0,9})(\.\d{1,6})?$/.test(s));
const orderSchema=z.object({orderId:z.string().min(1).max(180),reference:z.string().max(40),itemId:z.string(),quantity:z.literal(1),currency:z.literal('USD'),amount:money,status:z.string(),vouchers:z.array(z.object({pin:z.string().max(10000)})).max(1).optional()});
type Attempt={ref:string;fingerprint:string;item_id:string;cost_units:string;key_hash:string;attempts:number;state:string;order_id:string|null;encrypted_code:string|null};
export type VoucherOptions={enabled?:boolean;capEvidence?:()=>SpendCapEvidence|undefined};
/** Contract-tested single-voucher adapter. Production stays closed until production-network/custody verification exists. No key-cap reader is fabricated. */
export class DocumentedVoucherSupply implements FulfillmentPort {
 constructor(private db:DB,private c:Config,private api:PublicCommerceApi,private options:VoucherOptions={}){
  db.exec(`CREATE TABLE IF NOT EXISTS voucher_attempts(ref TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,item_id TEXT NOT NULL,cost_units TEXT NOT NULL,key_hash TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts IN(0,1)),state TEXT NOT NULL,order_id TEXT,encrypted_code TEXT,updated_at INTEGER NOT NULL);`);
 }
 get configured(){return this.c.NODE_ENV==='test'&&this.options.enabled===true&&this.c.ENABLE_FULFILLMENT==='true'&&this.c.FULFILLMENT_CONTRACT_VERIFIED==='true'&&/^[a-f\d]{64}$/i.test(this.c.DELIVERY_ENCRYPTION_KEY)}
 private cap(){const c=this.options.capEvidence?.();if(!c||!c.verified||c.currency!=='USD'||c.keyFingerprint!==this.api.keyFingerprint||typeof c.remainingUsd!=='string'||!Number.isInteger(c.observedAt)||c.observedAt>Date.now()||Date.now()-c.observedAt>15000)return undefined;try{const n=parseMoney(c.remainingUsd);return n>0n&&n<=1000000n?c:undefined}catch{return undefined}}
 get ready(){return this.configured&&!!this.cap()&&procurementHealth(this.db).open}
 private sku(s:string){const parts=s.split(':');if(parts.length!==2||!parts.every(p=>uuid.test(p)))throw Error('VERIFIED_SUPPLIER_SKU_REQUIRED');return {service:parts[0]!,item:parts[1]!}}
 validateQuote(sku:string,quantity:number,costUsdUnits:string){this.sku(sku);if(quantity!==1)throw Error('LIMITED_ROLLOUT_SINGLE_VOUCHER_ONLY');if(!/^[1-9]\d{0,6}$/.test(costUsdUnits)||BigInt(costUsdUnits)>1000000n)throw Error('OWNER_ONE_DOLLAR_LIMIT');const cap=this.cap();if(!cap||parseMoney(cap.remainingUsd)!==BigInt(costUsdUnits))throw Error('EXACT_ORDER_SERVER_CAP_REQUIRED')}
 async verifyQuote(sku:string,quantity:number,costUsdUnits:string){
  if(!this.ready)throw Error('SERVICE_PURCHASES_PAUSED');this.validateQuote(sku,quantity,costUsdUnits);
  const ids=this.sku(sku);await this.api.voucherService(ids.service);const item=await this.api.item(ids.service,ids.item);
  if(item.priceUsdUnits!==costUsdUnits||item.isLongOrder===true)throw Error('SUPPLIER_PRICE_CHANGED');
  this.funding(await this.api.procurementCashUsd());
  if(!procurementHealth(this.db).open||BigInt(procurementHealth(this.db).availableUnits??'0')-BigInt(costUsdUnits)<10000000n)throw Error('SERVICE_RESERVE_LIMIT');
  this.validateQuote(sku,quantity,costUsdUnits);
 }
 private get(ref:string){return this.db.prepare('SELECT * FROM voucher_attempts WHERE ref=?').get(ref) as Attempt|undefined}
 private state(ref:string,state:string){this.db.prepare('UPDATE voucher_attempts SET state=?,updated_at=? WHERE ref=?').run(state,Date.now(),ref)}
 private funding(amount:{availableUnits:string;observedAt:number}){const u=BigInt(amount.availableUnits);recordProcurementHealth(this.db,{currency:'USD',available:`${u/1000000n}.${(u%1000000n).toString().padStart(6,'0')}`,observedAt:amount.observedAt})}
 async purchase(ref:string,sku:string,quantity:number,costUsdUnits?:string):Promise<SupplyResult>{
  if(!this.configured)throw Error('SUPPLY_NODE_NOT_CONFIGURED');
  if(!/^[a-zA-Z0-9_-]{1,40}$/.test(ref))throw Error('REFERENCE_INVALID');
  if(!costUsdUnits)throw Error('PROCUREMENT_COST_UNVERIFIED');
  const ids=this.sku(sku),fp=createHash('sha256').update(JSON.stringify({sku,quantity,costUsdUnits,key:this.api.keyFingerprint})).digest('hex');
  const existing=this.get(ref);if(existing){if(existing.fingerprint!==fp)throw Error('IDEMPOTENCY_CONFLICT');return this.lookup(ref)}
  if(!this.ready)return {status:'NOT_EXECUTED'};
  this.validateQuote(sku,quantity,costUsdUnits);
  this.db.prepare("INSERT OR IGNORE INTO voucher_attempts(ref,fingerprint,item_id,cost_units,key_hash,state,updated_at) VALUES(?,?,?,?,?,'PREPARING',?)").run(ref,fp,ids.item,costUsdUnits,this.api.keyFingerprint,Date.now());
  let claimed=false;
  try{
   const service=await this.api.voucherService(ids.service);if(service.id!==ids.service)throw Error('SERVICE_MISMATCH');
   const item=await this.api.item(ids.service,ids.item);if(item.priceUsdUnits!==costUsdUnits||item.isLongOrder===true)throw Error('SUPPLIER_PRICE_CHANGED');
   this.funding(await this.api.procurementCashUsd());
   const cap=this.cap();if(!cap||parseMoney(cap.remainingUsd)!==BigInt(costUsdUnits))throw Error('EXACT_ORDER_SERVER_CAP_REQUIRED');
   claimed=this.db.transaction(()=>{
    const a=this.get(ref);if(!a||a.fingerprint!==fp)throw Error('IDEMPOTENCY_CONFLICT');if(a.state!=='PREPARING'||a.attempts!==0)return false;
    const spent=(this.db.prepare('SELECT cost_units FROM voucher_attempts WHERE key_hash=? AND attempts=1').all(this.api.keyFingerprint) as {cost_units:string}[]).reduce((n,r)=>n+BigInt(r.cost_units),0n);
    if(spent+BigInt(costUsdUnits)>1000000n)throw Error('OWNER_ONE_DOLLAR_LIMIT');
    if(!reserveProcurement(this.db,ref,costUsdUnits))throw Error('PROCUREMENT_RESERVATION_ALREADY_EXISTS');
    this.db.prepare("UPDATE voucher_attempts SET attempts=1,state='ATTEMPTED',updated_at=? WHERE ref=? AND attempts=0").run(Date.now(),ref);return true;
   }).immediate();
   if(!claimed)return this.lookup(ref);
   const response=await this.api.createVoucher(ref,ids.item,costUsdUnits,cap);
   const d=z.object({orderId:z.string().min(1).max(180),currency:z.literal('USD'),price:money}).parse(response.data);
   if(parseMoney(d.price)!==BigInt(costUsdUnits))throw Error('SUPPLIER_CHARGE_MISMATCH');
   this.db.prepare("UPDATE voucher_attempts SET order_id=?,state='PENDING',updated_at=? WHERE ref=?").run(d.orderId,Date.now(),ref);
   // Even SUCCESS is reconciled from a bound original order; POST vouchers are never blindly trusted.
   return {status:'PENDING'};
  }catch{
   const current=this.get(ref);if(claimed||current?.attempts===1){this.state(ref,'UNKNOWN');return {status:'UNKNOWN'}}
   // Only failure before the persistent outbound claim proves no purchase was sent.
   this.state(ref,'NOT_EXECUTED');return {status:'NOT_EXECUTED'};
  }
 }
 async lookup(ref:string):Promise<SupplyResult>{
  const a=this.get(ref);if(!a||!this.configured||a.key_hash!==this.api.keyFingerprint)return {status:'UNKNOWN'};
  if(a.state==='NOT_EXECUTED')return {status:'NOT_EXECUTED'};
  if(a.state==='COMPLETED'&&a.encrypted_code)return {status:'COMPLETED',code:decryptCode(a.encrypted_code,this.c.DELIVERY_ENCRYPTION_KEY),chargedUsdUnits:a.cost_units};
  if(a.attempts===0){this.state(ref,'NOT_EXECUTED');return {status:'NOT_EXECUTED'}};
  try{
   const response=await this.api.orderStatus(ref,a.order_id??undefined);
   const d=z.object({page:z.object({items:z.array(orderSchema).max(1)})}).parse(response.data);const o=d.page.items[0];
   if(!o)return {status:'UNKNOWN'};
   if(o.reference!==ref||o.itemId!==a.item_id||parseMoney(o.amount)!==BigInt(a.cost_units)||a.order_id&&o.orderId!==a.order_id)throw Error('ORDER_BINDING_MISMATCH');
   this.db.prepare('UPDATE voucher_attempts SET order_id=?,updated_at=? WHERE ref=?').run(o.orderId,Date.now(),ref);
   if(o.status==='IN_PROGRESS')return {status:'PENDING'};
   // Partial/cancelled outcomes after POST require financial review. They never automatically release a reserve/refund.
   if(o.status!=='SUCCESS')return {status:'UNKNOWN'};
   const received=await this.api.receiveVouchers(ref,o.orderId),full=z.object({page:z.object({items:z.array(orderSchema).length(1)})}).parse(received.data).page.items[0]!;
   if(full.status!=='SUCCESS'||full.orderId!==o.orderId||full.reference!==ref||full.itemId!==a.item_id||parseMoney(full.amount)!==BigInt(a.cost_units))throw Error('DELIVERY_BINDING_MISMATCH');
   const code=full.vouchers?.[0]?.pin;if(full.vouchers?.length!==1||!code||code.length<5||code.includes('****'))throw Error('VOUCHER_INCOMPLETE');
   this.db.prepare("UPDATE voucher_attempts SET state='DELIVERED_UNSETTLED',encrypted_code=?,updated_at=? WHERE ref=?").run(encryptCode(code,this.c.DELIVERY_ENCRYPTION_KEY),Date.now(),ref);
   const ledger=await this.api.orderTransactions(o.orderId);
   const sum=ledger.reduce((n,t)=>n+t.amountUnits,0n);
   if(sum!==-BigInt(a.cost_units))throw Error('SETTLED_DEBIT_MISMATCH');
   const cash=await this.api.procurementCashUsd();
   this.db.transaction(()=>{
    this.funding(cash);
    this.db.prepare('DELETE FROM procurement_reservations WHERE ref=?').run(ref);
    this.state(ref,'COMPLETED');
   }).immediate();
   return {status:'COMPLETED',code,chargedUsdUnits:a.cost_units};
  }catch{this.state(ref,'UNKNOWN');return {status:'UNKNOWN'}}
 }
}
