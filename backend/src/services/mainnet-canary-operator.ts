/** One owner-authorized canary, not public checkout. Transport is never constructed by the closed runtime. */
import {createHash,randomUUID,randomBytes,createCipheriv} from 'node:crypto';
import {verifyTypedData} from 'viem';
import {z} from 'zod';
import {parseMoney} from '../money.js';
import {MainnetStagingStore,type StagingQuote} from './mainnet-staging-store.js';
import {evaluateProductionLaunch,type ProductionLaunch} from './production-mainnet.js';
import type {PublicCommerceApi,SpendCapEvidence} from './fulfillment/public-commerce-api.js';
import type {WitnessPorts} from './receipt-proof-generator.js';
const uuid=z.string().uuid(),hash=z.string().regex(/^0x[a-fA-F0-9]{64}$/),address=z.string().regex(/^0x[a-fA-F0-9]{40}$/),micro=z.string().regex(/^(0|[1-9]\d{0,11})$/);
const grantSchema=z.object({nonce:hash,orderId:uuid,expiresAt:z.number().int().safe(),gasCapMicro:micro,allowVoucherReceipt:z.literal(true),signature:z.string().regex(/^0x[a-fA-F0-9]{130}$/)}).strict();
export const CANARY_GRANT_TYPES={Canary:[{name:'nonce',type:'bytes32'},{name:'orderId',type:'string'},{name:'quoteDigest',type:'bytes32'},{name:'customer',type:'address'},{name:'merchant',type:'address'},{name:'costUsdMicro',type:'uint256'},{name:'saleUsdcMicro',type:'uint256'},{name:'gasCapMicro',type:'uint256'},{name:'expiresAtMs',type:'uint64'},{name:'allowVoucherReceipt',type:'bool'}]} as const;
type Grant=z.infer<typeof grantSchema>;
type SupplyApi=Pick<PublicCommerceApi,'keyFingerprint'|'voucherService'|'item'|'procurementCashUsd'|'createVoucher'|'orderStatus'|'receiveVouchers'|'orderTransactions'>;
type Witnesses={primaryWitness:WitnessPorts;secondaryWitness:WitnessPorts};
type Attempt={order_id:string;reference:string;sku:string;cost_micro:string;provider_key:string;supply_order_id:string|null};
export type CanaryPorts={api:SupplyApi;ownerWallet:string;merchantWallet:string;deliveryKey:Buffer;launchEvidence:()=>ProductionLaunch;capEvidence:()=>SpendCapEvidence|undefined;witnesses:Witnesses;allowedSku:(sku:string)=>boolean;clock?:()=>number;pricing?:()=>{usdPerUsdcMicro:string;marginBps:number;policyId:string}};
export function canaryTypedData(q:StagingQuote,orderId:string,fingerprint:string,g:Pick<Grant,'nonce'|'expiresAt'|'gasCapMicro'|'allowVoucherReceipt'>){return {domain:{name:'Mercenta Mainnet Owner Canary',version:'1',chainId:5042,verifyingContract:q.merchant as `0x${string}`},types:CANARY_GRANT_TYPES,primaryType:'Canary' as const,message:{nonce:g.nonce as `0x${string}`,orderId,quoteDigest:('0x'+fingerprint) as `0x${string}`,customer:q.owner as `0x${string}`,merchant:q.merchant as `0x${string}`,costUsdMicro:BigInt(q.costMicro),saleUsdcMicro:BigInt(q.saleMicro),gasCapMicro:BigInt(g.gasCapMicro),expiresAtMs:BigInt(g.expiresAt),allowVoucherReceipt:g.allowVoucherReceipt}};}
const orderSchema=z.object({orderId:z.string().min(1).max(180),reference:z.string().max(40),itemId:z.string(),quantity:z.literal(1),currency:z.literal('USD'),amount:z.union([z.string(),z.number()]).transform(String),status:z.string(),vouchers:z.array(z.object({pin:z.string().min(5).max(4096)})).max(1).optional()});
export class MainnetCanaryOperator {
 private clock:()=>number;
 constructor(private readonly store:MainnetStagingStore,private readonly ports:CanaryPorts){
  address.parse(ports.ownerWallet);address.parse(ports.merchantWallet);if(ports.deliveryKey.length!==32)throw Error('MAINNET_DELIVERY_KEY_REQUIRED');this.clock=ports.clock??Date.now;
  store.db.exec(`CREATE TABLE IF NOT EXISTS staging_owner_grants(order_id TEXT PRIMARY KEY,nonce TEXT NOT NULL UNIQUE,owner TEXT NOT NULL,quote_fingerprint TEXT NOT NULL,grant_hash TEXT NOT NULL,expires INTEGER NOT NULL,gas_cap_micro TEXT NOT NULL,consumed INTEGER NOT NULL DEFAULT 0,encrypted_proof TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS staging_payment_fees(order_id TEXT PRIMARY KEY,tx_hash TEXT NOT NULL UNIQUE,payer TEXT NOT NULL,gas_wei TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS staging_quote_pricing(order_id TEXT PRIMARY KEY,policy TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS staging_supply_attempts(order_id TEXT PRIMARY KEY,reference TEXT NOT NULL UNIQUE,sku TEXT NOT NULL,cost_micro TEXT NOT NULL,provider_key TEXT NOT NULL,supply_order_id TEXT);
   CREATE TABLE IF NOT EXISTS staging_canary_slot(slot TEXT PRIMARY KEY,order_id TEXT NOT NULL,claimed_at INTEGER NOT NULL);
   CREATE TRIGGER IF NOT EXISTS staging_canary_no_update BEFORE UPDATE ON staging_canary_slot BEGIN SELECT RAISE(ABORT,'CANARY_SLOT_IMMUTABLE'); END;
   CREATE TRIGGER IF NOT EXISTS staging_canary_no_delete BEFORE DELETE ON staging_canary_slot BEGIN SELECT RAISE(ABORT,'CANARY_SLOT_IMMUTABLE'); END;`);
 }
 private quote(id:string,actor:string,existing=false){const row=this.store.owned(id,actor),q=JSON.parse(row.body) as StagingQuote;if(q.merchant.toLowerCase()!==this.ports.merchantWallet.toLowerCase()||!existing&&!this.ports.allowedSku(q.sku))throw Error('MAINNET_QUOTE_NOT_ALLOWLISTED');return {row,q};}
 private ids(sku:string){const p=sku.split(':');if(p.length!==2)throw Error('VOUCHER_SKU_REQUIRED');return {service:uuid.parse(p[0]),item:uuid.parse(p[1])};}
 async prepareQuote(actor:string,sku:string,region:string) {
  address.parse(actor);if(!this.ports.allowedSku(sku))throw Error('SKU_NOT_ALLOWLISTED');const ids=this.ids(sku),service=await this.ports.api.voucherService(ids.service),item=await this.ports.api.item(ids.service,ids.item);
  if(service.countryCode!==region||item.inStock<1||item.isLongOrder)throw Error('REGION_OR_STOCK_UNAVAILABLE');
  const pricing=z.object({usdPerUsdcMicro:micro,marginBps:z.number().int().min(1500).max(5000),policyId:z.string().min(1).max(100)}).strict().parse(this.ports.pricing?.());
  const rate=BigInt(pricing.usdPerUsdcMicro),cost=BigInt(item.priceUsdUnits);if(rate<=0n||cost<=0n||cost>1000000n)throw Error('CANARY_COST_OR_RATE_INVALID');
  const denominator=rate*BigInt(10000-pricing.marginBps),sale=(cost*1000000n*10000n+denominator-1n)/denominator;
  const q={reference:randomUUID(),owner:actor.toLowerCase(),merchant:this.ports.merchantWallet.toLowerCase(),sku,region,quantity:1 as const,saleMicro:sale.toString(),costMicro:cost.toString(),expiresAt:this.clock()+180000,chainId:5042 as const};
  return this.store.db.transaction(()=>{const id=this.store.quote(q,this.clock());this.store.db.prepare('INSERT INTO staging_quote_pricing VALUES(?,?)').run(id,JSON.stringify(pricing));return {id,saleMicro:q.saleMicro,region,expiresAt:q.expiresAt,pricingPolicy:pricing.policyId,kind:'PROPOSAL_NOT_PAYMENT_AUTHORIZATION',purchasesEnabled:false};}).immediate();
 }
 async approve(id:string,actor:string,raw:unknown){
  const g=grantSchema.parse(raw),now=this.clock(),{row,q}=this.quote(id,actor);this.ids(q.sku);
  if(g.orderId!==id||g.expiresAt<=now||g.expiresAt>now+600000||g.expiresAt>q.expiresAt||BigInt(g.gasCapMicro)<=0n||BigInt(g.gasCapMicro)>1000000n)throw Error('CANARY_GRANT_INVALID');
  let valid=false;try{valid=await verifyTypedData({...canaryTypedData(q,id,row.fingerprint,g),address:this.ports.ownerWallet as `0x${string}`,signature:g.signature as `0x${string}`});}catch{}
  if(!valid)throw Error('OWNER_CANARY_SIGNATURE_REQUIRED');
  const digest=createHash('sha256').update(JSON.stringify(g)).digest('hex');
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.ports.deliveryKey,iv);cipher.setAAD(Buffer.from('mercenta:owner-canary:'+id+':'+row.fingerprint));const ciphertext=Buffer.concat([cipher.update(JSON.stringify(g)),cipher.final()]),proof=JSON.stringify({iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')});
  this.store.db.transaction(()=>{
   const old=this.store.db.prepare('SELECT grant_hash FROM staging_owner_grants WHERE order_id=?').get(id) as {grant_hash:string}|undefined;
   if(old){if(old.grant_hash!==digest)throw Error('CANARY_GRANT_REPLACEMENT_FORBIDDEN');return;}
   if(this.store.db.prepare('SELECT slot FROM staging_canary_slot LIMIT 1').get()||this.store.db.prepare('SELECT order_id FROM staging_owner_grants WHERE expires>? AND consumed=0 LIMIT 1').get(now))throw Error('ONE_OWNER_CANARY_ONLY');
   this.store.db.prepare('INSERT INTO staging_owner_grants(order_id,nonce,owner,quote_fingerprint,grant_hash,expires,gas_cap_micro,encrypted_proof) VALUES(?,?,?,?,?,?,?,?)').run(id,g.nonce.toLowerCase(),this.ports.ownerWallet.toLowerCase(),row.fingerprint,digest,g.expiresAt,g.gasCapMicro,proof);
   this.store.authorize(id,actor,now);
  }).immediate();
  return {authorizedOneCanary:true,expiresAt:g.expiresAt,paymentSent:false};
 }
 private cap(cost:string){const cap=this.ports.capEvidence?.(),now=this.clock();if(!cap||!cap.verified||cap.keyFingerprint!==this.ports.api.keyFingerprint||cap.currency!=='USD'||cap.observedAt>now||now-cap.observedAt>15000||parseMoney(cap.remainingUsd)!==BigInt(cost)||BigInt(cost)>1000000n)throw Error('EXACT_PROVIDER_SIDE_CAP_UNVERIFIED');return cap;}
 async verifyPayment(id:string,actor:string,tx:string,kind:'erc20'|'native'){
  const {q}=this.quote(id,actor,true);const grant=this.store.db.prepare('SELECT expires,gas_cap_micro FROM staging_owner_grants WHERE order_id=?').get(id) as {expires:number;gas_cap_micro:string}|undefined;
  if(!grant||grant.expires<=this.clock())throw Error('FRESH_OWNER_CANARY_GRANT_REQUIRED');
  // Canonical amount/witness verification is performed by the store before any supply call.
  await this.store.verifyPayment(id,actor,tx,kind,this.ports.witnesses,this.clock());
  const saved=this.store.db.prepare('SELECT binding FROM staging_receipts WHERE order_id=?').get(id) as {binding:string};const canonical=JSON.parse(saved.binding).blockHash as string;
  const receipts=await Promise.all([this.ports.witnesses.primaryWitness.getReceipt(tx),this.ports.witnesses.secondaryWitness.getReceipt(tx)]);
  const fee=(r:unknown)=>{const p=r as {gasUsed?:bigint;effectiveGasPrice?:bigint;blockHash?:string;status?:number}|null;if(!p||p.blockHash!==canonical||p.status!==1||typeof p.gasUsed!=='bigint'||typeof p.effectiveGasPrice!=='bigint'||p.gasUsed<=0n||p.effectiveGasPrice<=0n)throw Error('CANONICAL_PAYMENT_FEE_UNVERIFIED');return p.gasUsed*p.effectiveGasPrice;};
  const a=fee(receipts[0]),b=fee(receipts[1]);if(a!==b||a>BigInt(grant.gas_cap_micro)*1000000000000n)throw Error('OWNER_GAS_CAP_EXCEEDED_OR_DISAGREED');
  this.store.db.prepare('INSERT OR IGNORE INTO staging_payment_fees VALUES(?,?,?,?)').run(id,tx.toLowerCase(),q.owner,a.toString());
  return {paymentVerified:true,paidMicro:q.saleMicro,gasFeeWei:a.toString(),purchaseSent:false};
 }
 async procure(id:string,actor:string){
  const {row,q}=this.quote(id,actor,true);
  if(row.state==='DELIVERED')return {status:'DELIVERED',secretReturned:false};
  const existing=this.store.db.prepare('SELECT * FROM staging_supply_attempts WHERE order_id=?').get(id) as Attempt|undefined;
  if(existing)return this.reconcile(id,actor); // Expired grants never block lookup of an already attempted order.
  if(!this.ports.allowedSku(q.sku))throw Error('SKU_NOT_ALLOWLISTED');
  if(row.state!=='PAYMENT_VERIFIED'||!this.store.db.prepare('SELECT order_id FROM staging_payment_fees WHERE order_id=?').get(id))throw Error('VERIFIED_PAYMENT_AND_GAS_REQUIRED');
  const now=this.clock(),grant=this.store.db.prepare('SELECT * FROM staging_owner_grants WHERE order_id=? AND consumed=0 AND expires>?').get(id,now) as {expires:number;quote_fingerprint:string;owner:string}|undefined;
  if(!grant||grant.quote_fingerprint!==row.fingerprint||grant.owner!==this.ports.ownerWallet.toLowerCase())throw Error('FRESH_OWNER_CANARY_GRANT_REQUIRED');
  const ids=this.ids(q.sku),service=await this.ports.api.voucherService(ids.service),item=await this.ports.api.item(ids.service,ids.item),cash=await this.ports.api.procurementCashUsd();
  if(service.countryCode!==q.region||item.priceUsdUnits!==q.costMicro||item.inStock<1||item.isLongOrder)throw Error('FRESH_STOCK_PRICE_OR_REGION_CHANGED');
  const cap=this.cap(q.costMicro),e=this.ports.launchEvidence();
  const reserved=(this.store.db.prepare('SELECT reserve_micro FROM staging_orders').all() as {reserve_micro:string}[]).reduce((sum,r)=>sum+BigInt(r.reserve_micro),0n);
  const policy=evaluateProductionLaunch({...e,supplierAvailableUsdMicro:cash.availableUnits,supplierObservedAt:cash.observedAt,supplierReservedUsdMicro:reserved.toString(),providerRemainingUsdMicro:q.costMicro,approvalExpiresAt:grant.expires,canaryCostUsdMicro:q.costMicro,canarySaleUsdcMicro:q.saleMicro},this.clock());
  if(e.canaryCostUsdMicro!==q.costMicro||e.canarySaleUsdcMicro!==q.saleMicro||!policy.eligibleForOwnerCanary||e.ownerWallet.toLowerCase()!==this.ports.ownerWallet.toLowerCase()||e.merchantWallet.toLowerCase()!==q.merchant.toLowerCase())throw Error('PRODUCTION_CANARY_RELEASE_EVIDENCE_REQUIRED');
  this.store.db.transaction(()=>{
   if(this.store.db.prepare('SELECT slot FROM staging_canary_slot LIMIT 1').get())throw Error('ONE_OWNER_CANARY_ONLY');
   const consumed=this.store.db.prepare('UPDATE staging_owner_grants SET consumed=1 WHERE order_id=? AND consumed=0 AND expires>?').run(id,this.clock());if(consumed.changes!==1)throw Error('CANARY_GRANT_EXPIRED_OR_CONSUMED');
   this.store.db.prepare('INSERT INTO staging_canary_slot VALUES(?,?,?)').run('owner-canary-v1',id,this.clock());
   this.store.reserve(id,actor,{availableUsdMicro:cash.availableUnits,observedAt:cash.observedAt},this.clock());
   this.store.procurementIntent(id,actor,this.clock());
   this.store.db.prepare('INSERT INTO staging_supply_attempts(order_id,reference,sku,cost_micro,provider_key) VALUES(?,?,?,?,?)').run(id,q.reference,q.sku,q.costMicro,this.ports.api.keyFingerprint);
  }).immediate();
  try{
   const response=await this.ports.api.createVoucher(q.reference,ids.item,q.costMicro,cap,this.clock());
   const d=z.object({orderId:z.string().min(1).max(180),currency:z.literal('USD'),price:z.union([z.string(),z.number()]).transform(String)}).parse(response.data);
   if(parseMoney(d.price)!==BigInt(q.costMicro))throw Error('CHARGE_MISMATCH');
   this.store.db.prepare('UPDATE staging_supply_attempts SET supply_order_id=? WHERE order_id=?').run(d.orderId,id);
   return {status:'PENDING',secretReturned:false};
  }catch{this.store.quarantine(id,actor,this.clock());return {status:'SUPPLIER_UNKNOWN',secretReturned:false};}
 }
 async reconcile(id:string,actor:string){
  const {row,q}=this.quote(id,actor,true);if(row.state==='DELIVERED')return {status:'DELIVERED',secretReturned:false};
  const a=this.store.db.prepare('SELECT * FROM staging_supply_attempts WHERE order_id=?').get(id) as Attempt|undefined;
  if(!a||a.provider_key!==this.ports.api.keyFingerprint)throw Error('ORIGINAL_SUPPLY_ATTEMPT_REQUIRED');
  try{
   const response=await this.ports.api.orderStatus(a.reference,a.supply_order_id??undefined);
   const o=z.object({page:z.object({items:z.array(orderSchema).length(1)})}).parse(response.data).page.items[0]!;
   const ids=this.ids(q.sku);if(o.reference!==q.reference||o.itemId!==ids.item||a.supply_order_id&&o.orderId!==a.supply_order_id||parseMoney(o.amount)!==BigInt(q.costMicro))throw Error('ORIGINAL_ORDER_BINDING_MISMATCH');
   if(o.status==='IN_PROGRESS')return {status:'PENDING',secretReturned:false};if(o.status!=='SUCCESS')throw Error('PARTIAL_OR_CANCELLED_REQUIRES_REVIEW');
   const transactions=await this.ports.api.orderTransactions(o.orderId);if(transactions.reduce((n,t)=>n+t.amountUnits,0n)!==-BigInt(q.costMicro))throw Error('EXACT_PROVIDER_DEBIT_REQUIRED');
   this.store.db.prepare('UPDATE staging_supply_attempts SET supply_order_id=? WHERE order_id=?').run(o.orderId,id);
   // Intentional receipt of exactly one owned voucher, not a bulk unmask request.
   const received=await this.ports.api.receiveVouchers(q.reference,o.orderId);
   const full=z.object({page:z.object({items:z.array(orderSchema).length(1)})}).parse(received.data).page.items[0]!;
   if(full.status!=='SUCCESS'||full.orderId!==o.orderId||full.reference!==q.reference||full.itemId!==ids.item||parseMoney(full.amount)!==BigInt(q.costMicro)||full.vouchers?.length!==1||full.vouchers[0]!.pin.includes('****'))throw Error('EXACT_DELIVERY_REQUIRED');
   this.store.sealDelivery(id,actor,{reference:q.reference,sku:q.sku,region:q.region,costUsdMicro:q.costMicro,codes:[full.vouchers[0]!.pin]},this.ports.deliveryKey,this.clock());
   return {status:'DELIVERED',secretReturned:false};
  }catch{if(this.store.owned(id,actor).state==='PROCUREMENT_SUBMITTED')this.store.quarantine(id,actor,this.clock());return {status:'SUPPLIER_UNKNOWN',secretReturned:false};}
 }
}
