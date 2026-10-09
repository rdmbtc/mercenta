/** Durable quote holds and incoming-payment liabilities. No public route, signing or procurement. */
import Database from 'better-sqlite3';
import {assertProductionNamespace} from './production-mainnet.js';
import {createRetailQuote,validateRetailQuote,retailQuoteDigest,retailPaymentVerificationInput,type RetailQuote} from './mainnet-retail-policy.js';
import {verifyRetailMainnetUsdcReceipt} from './mainnet-usdc-receipt.js';
import type {DualWitnessPorts} from './receipt-proof-generator.js';
type Row={id:string;owner:string;body:string;digest:string;state:string;cost_micro:string;expires_at:number;tx_hash:string|null};
export class MainnetRetailStore {
 private db:Database.Database;
 constructor(path:string,testnetPath:string){
  assertProductionNamespace(path,testnetPath);this.db=new Database(path);
  try {
   const tables=this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as {name:string}[];
   if(tables.some(t=>!t.name.startsWith('retail_')))throw Error('RETAIL_DATABASE_MUST_BE_SEPARATE');
   this.db.pragma('journal_mode=WAL');this.db.pragma('synchronous=FULL');this.db.pragma('busy_timeout=5000');this.db.pragma('foreign_keys=ON');
   this.db.exec(`CREATE TABLE IF NOT EXISTS retail_meta(id INTEGER PRIMARY KEY CHECK(id=1),network TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS retail_quotes(id TEXT PRIMARY KEY,owner TEXT NOT NULL,body TEXT NOT NULL,digest TEXT NOT NULL,state TEXT NOT NULL,cost_micro TEXT NOT NULL,expires_at INTEGER NOT NULL,tx_hash TEXT UNIQUE);
    CREATE TABLE IF NOT EXISTS retail_payments(tx_hash TEXT PRIMARY KEY,order_id TEXT UNIQUE NOT NULL REFERENCES retail_quotes(id),amount_micro TEXT NOT NULL,receipt TEXT NOT NULL,recorded_at INTEGER NOT NULL);
    INSERT OR IGNORE INTO retail_meta VALUES(1,'arc-mainnet:5042:retail-v1');`);
   const m=this.db.prepare('SELECT network FROM retail_meta WHERE id=1').get() as {network:string};if(m.network!=='arc-mainnet:5042:retail-v1')throw Error('RETAIL_DATABASE_NETWORK_MISMATCH');
  }catch(e){this.db.close();throw e;}
 }
 close(){this.db.close();}
 private owned(id:string,owner:string){const row=this.db.prepare('SELECT * FROM retail_quotes WHERE id=?').get(id) as Row|undefined;if(!row||row.owner!==owner.toLowerCase())throw Error('RETAIL_ORDER_NOT_FOUND');return row;}
 private reserved(now:number){const rows=this.db.prepare("SELECT cost_micro FROM retail_quotes WHERE (state='QUOTED' AND expires_at>?) OR state IN ('PAYMENT_VERIFIED','MANUAL_REVIEW')").all(now) as {cost_micro:string}[];return rows.reduce((n,r)=>n+BigInt(r.cost_micro),0n);}
 /** Called with authenticated owner and private live adapter observations. Atomic holds prevent overcommit. */
 quote(owner:string,quantity:number,observation:unknown,now=Date.now()):RetailQuote{
  return this.db.transaction(()=>{
   const q=createRetailQuote(owner,quantity,observation,this.reserved(now),now);
   const rows=this.db.prepare("SELECT body FROM retail_quotes WHERE (state='QUOTED' AND expires_at>?) OR state IN ('PAYMENT_VERIFIED','MANUAL_REVIEW')").all(now) as {body:string}[];
   const held=rows.map(r=>validateRetailQuote(JSON.parse(r.body))).filter(r=>r.serviceId===q.serviceId&&r.itemId===q.itemId).reduce((n,r)=>n+r.quantity,0);
   const stock=(observation as {inStock:number}).inStock;if(held+quantity>stock)throw Error('RETAIL_STOCK_RESERVED');
   this.db.prepare('INSERT INTO retail_quotes VALUES(?,?,?,?,?,?,?,NULL)').run(q.id,q.owner,JSON.stringify(q),retailQuoteDigest(q),'QUOTED',q.costUsdMicro,q.expiresAt);return q;
  }).immediate();
 }
 get(id:string,owner:string){const row=this.owned(id,owner);return {quote:validateRetailQuote(JSON.parse(row.body)),state:row.state,transactionHash:row.tx_hash,deliveryAvailable:false};}
 /** Fresh two-RPC evidence is checked outside the SQL transaction, then uniquely claimed inside it. */
 async recordPayment(id:string,owner:string,hash:string,assetKind:'native'|'erc20',witnesses:DualWitnessPorts,now=Date.now()){
  const before=this.owned(id,owner),q=validateRetailQuote(JSON.parse(before.body));
  const result=await verifyRetailMainnetUsdcReceipt(retailPaymentVerificationInput(q,hash,assetKind,now),witnesses);
  if(result.status!=='VERIFIED')return {recorded:false,reason:result.reason,moneyMoved:false};
  return this.db.transaction(()=>{
   const row=this.owned(id,owner);if(row.digest!==retailQuoteDigest(q))throw Error('RETAIL_QUOTE_CHANGED');
   const tx=result.hash.toLowerCase(),existing=this.db.prepare('SELECT order_id FROM retail_payments WHERE tx_hash=?').get(tx) as {order_id:string}|undefined;
   if(existing){if(existing.order_id!==id)throw Error('RETAIL_PAYMENT_ALREADY_CLAIMED');return {recorded:true,state:row.state,replay:true,moneyMoved:false};}
   if(row.tx_hash)throw Error('RETAIL_ORDER_ALREADY_PAID');
   // A late payment is still a customer liability. It does not restore stock or trigger a purchase.
   const blockMs=Number(result.blockTimestampUnix)*1000;
   const state=blockMs>=q.expiresAt||now>=q.expiresAt?'MANUAL_REVIEW':'PAYMENT_VERIFIED';
   this.db.prepare('INSERT INTO retail_payments VALUES(?,?,?,?,?)').run(tx,id,q.saleUsdcMicro,JSON.stringify(result),now);
   this.db.prepare('UPDATE retail_quotes SET state=?,tx_hash=? WHERE id=?').run(state,tx,id);
   return {recorded:true,state,replay:false,moneyMoved:false};
  }).immediate();
 }
 accounting(now=Date.now()){
  const rows=this.db.prepare('SELECT amount_micro FROM retail_payments').all() as {amount_micro:string}[];
  return {incomingCustomerLiabilityUsdcMicro:rows.reduce((n,r)=>n+BigInt(r.amount_micro),0n).toString(),procurementHeldUsdMicro:this.reserved(now).toString(),revenueUsdcMicro:'0',purchasesEnabled:false,signingEnabled:false,integrity:this.db.pragma('quick_check',{simple:true})};
 }
}
