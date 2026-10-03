/** Owner-only one-shot procurement probe. Not mounted on public routes; does not enable fulfillment or mainnet. */
import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {DB} from '../../db.js';
import {parseMoney} from '../../money.js';
import {encryptCode,decryptCode} from './index.js';
export const PROBE_MAX_USD_UNITS=1000000n;
const exact=z.string().regex(/^(0|[1-9]\d{0,9})(\.\d{1,6})?$/);
const quoteSchema=z.object({itemId:z.string().min(1).max(180),quoteId:z.string().min(1).max(180),quantity:z.literal(1),currency:z.literal('USD'),totalUsd:exact,feesIncluded:z.literal(true),priceBinding:z.literal('fixed-final-quote'),stockVerified:z.literal(true),balanceUsd:exact,balanceVerified:z.literal(true),expiresAt:z.number().int().nonnegative()}).strict();
export type MicroQuote=z.infer<typeof quoteSchema>;
export type ProbeResult={reference:string;status:'PENDING'|'UNKNOWN'}|{reference:string;status:'COMPLETED';providerOrderId:string;itemId:string;quoteId:string;quantity:1;currency:'USD';chargedUsd:string;code:string};
export interface ProbeAdapter {contractVerified:boolean;purchase(input:{reference:string;itemId:string;quoteId:string;quantity:1;maxTotalUsdUnits:string}):Promise<unknown>;lookup(reference:string):Promise<unknown>}
type Row={reference:string;fingerprint:string;quote_id:string;item_id:string;total_units:string;state:string;provider_order_id:string|null;charged_units:string|null;delivery_encrypted:string|null};
const resultSchema=z.discriminatedUnion('status',[
 z.object({reference:z.string(),status:z.literal('PENDING')}).strict(),
 z.object({reference:z.string(),status:z.literal('UNKNOWN')}).strict(),
 z.object({reference:z.string(),status:z.literal('COMPLETED'),providerOrderId:z.string().min(1).max(180),itemId:z.string().min(1).max(180),quoteId:z.string().min(1).max(180),quantity:z.literal(1),currency:z.literal('USD'),chargedUsd:exact,code:z.string().min(1).max(10000)}).strict()
]);
export function verifyMicroQuote(raw:unknown,now=Date.now()){const q=quoteSchema.parse(raw),total=parseMoney(q.totalUsd);if(total<=0n||total>PROBE_MAX_USD_UNITS)throw Error('OWNER_ONE_DOLLAR_LIMIT');if(q.expiresAt<=now||q.expiresAt>now+300000)throw Error('QUOTE_EXPIRED_OR_UNVERIFIED');if(parseMoney(q.balanceUsd)-total<10000000n)throw Error('SERVICE_RESERVE_LIMIT');return q}
export class MicroPurchaseProbe {
 constructor(private db:DB,private adapter:ProbeAdapter,private encryptionKey:string){if(!/^[a-fA-F0-9]{64}$/.test(encryptionKey))throw Error('DELIVERY_ENCRYPTION_REQUIRED');db.exec(`CREATE TABLE IF NOT EXISTS owner_micro_purchase_probe(slot INTEGER PRIMARY KEY CHECK(slot=1),reference TEXT NOT NULL UNIQUE,fingerprint TEXT NOT NULL,quote_id TEXT NOT NULL,item_id TEXT NOT NULL,total_units TEXT NOT NULL,state TEXT NOT NULL,provider_order_id TEXT,charged_units TEXT,delivery_encrypted TEXT,updated_at INTEGER NOT NULL);`)}
 private row(){return this.db.prepare('SELECT * FROM owner_micro_purchase_probe WHERE slot=1').get() as Row|undefined}
 status(){const r=this.row();return r?{reference:r.reference,status:r.state,providerOrderId:r.provider_order_id,chargedUnits:r.charged_units,deliveryStored:!!r.delivery_encrypted}:null}
 private apply(reference:string,raw:unknown){const row=this.row();if(!row||row.reference!==reference)throw Error('REFERENCE_MISMATCH');if(row.state==='COMPLETED')return this.status();const parsed=resultSchema.safeParse(raw);if(!parsed.success||parsed.data.reference!==reference){this.db.prepare("UPDATE owner_micro_purchase_probe SET state='UNKNOWN',updated_at=? WHERE slot=1").run(Date.now());return this.status()}const v=parsed.data;if(v.status!=='COMPLETED'){this.db.prepare('UPDATE owner_micro_purchase_probe SET state=?,updated_at=? WHERE slot=1').run(v.status,Date.now());return this.status()}const charged=parseMoney(v.chargedUsd);if(v.itemId!==row.item_id||v.quoteId!==row.quote_id||charged!==BigInt(row.total_units)||charged>PROBE_MAX_USD_UNITS){this.db.prepare("UPDATE owner_micro_purchase_probe SET state='INCIDENT',updated_at=? WHERE slot=1").run(Date.now());return this.status()}this.db.prepare("UPDATE owner_micro_purchase_probe SET state='COMPLETED',provider_order_id=?,charged_units=?,delivery_encrypted=?,updated_at=? WHERE slot=1").run(v.providerOrderId,charged.toString(),encryptCode(v.code,this.encryptionKey),Date.now());return this.status()}
 async execute(reference:string,raw:unknown,now=Date.now()){
  if(!/^[a-zA-Z0-9_-]{8,100}$/.test(reference))throw Error('REFERENCE_INVALID');
  const parsed=quoteSchema.parse(raw),fingerprint=createHash('sha256').update(JSON.stringify(parsed)).digest('hex');
  const claim=this.db.transaction(()=>{const previous=this.row();if(previous){if(previous.reference!==reference)throw Error('OWNER_SINGLE_ATTEMPT_ALREADY_CLAIMED');if(previous.fingerprint!==fingerprint)throw Error('IDEMPOTENCY_CONFLICT');return false}if(!this.adapter.contractVerified)throw Error('PROVIDER_CONTRACT_UNVERIFIED');const q=verifyMicroQuote(parsed,now);this.db.prepare("INSERT INTO owner_micro_purchase_probe(slot,reference,fingerprint,quote_id,item_id,total_units,state,updated_at) VALUES(1,?,?,?,?,?,'UNKNOWN',?)").run(reference,fingerprint,q.quoteId,q.itemId,parseMoney(q.totalUsd).toString(),now);return true}).immediate();
  if(!claim)return this.status();
  try{return this.apply(reference,await this.adapter.purchase({reference,itemId:parsed.itemId,quoteId:parsed.quoteId,quantity:1,maxTotalUsdUnits:PROBE_MAX_USD_UNITS.toString()}))}catch{return this.status()}
 }
 async reconcile(reference:string){const row=this.row();if(!row||row.reference!==reference)throw Error('REFERENCE_MISMATCH');if(row.state==='COMPLETED'||row.state==='INCIDENT')return this.status();if(!this.adapter.contractVerified)throw Error('PROVIDER_CONTRACT_UNVERIFIED');try{return this.apply(reference,await this.adapter.lookup(reference))}catch{return this.status()}}
 ownerDelivery(reference:string){const row=this.row();if(!row||row.reference!==reference||row.state!=='COMPLETED'||!row.delivery_encrypted)throw Error('VERIFIED_DELIVERY_UNAVAILABLE');return decryptCode(row.delivery_encrypted,this.encryptionKey)}
}
