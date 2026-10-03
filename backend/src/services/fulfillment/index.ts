import {
  createHmac,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import type { Config } from "../../config.js";
export function requestRef(secret: string, orderId: string) {
  return createHmac("sha256", secret)
    .update("mercenta:v1:" + orderId)
    .digest("hex").slice(0,40);
}
export function encryptCode(code: string, key: string) {
  const iv = randomBytes(12),
    c = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  return Buffer.concat([
    iv,
    Buffer.alloc(0),
    c.update(code, "utf8"),
    c.final(),
    c.getAuthTag(),
  ]).toString("base64");
}
export function decryptCode(payload: string, key: string) {
  const b = Buffer.from(payload, "base64"),
    d = createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      b.subarray(0, 12),
    );
  d.setAuthTag(b.subarray(-16));
  return Buffer.concat([d.update(b.subarray(12, -16)), d.final()]).toString(
    "utf8",
  );
}
export type SupplyResult =
  | { status: "COMPLETED"; code: string; chargedUsdUnits?: string }
  | { status: "NOT_EXECUTED" | "PENDING" | "UNKNOWN" };

export interface FulfillmentPort {
 readonly configured:boolean;
 readonly ready:boolean;
 validateQuote?(sku:string,quantity:number,costUsdUnits:string):void;
 verifyQuote?(sku:string,quantity:number,costUsdUnits:string):Promise<void>;
 purchase(ref:string,sku:string,quantity:number,costUsdUnits?:string):Promise<SupplyResult>;
 lookup(ref:string):Promise<SupplyResult>;
}
/** No guessed generic HTTP protocol. Execution requires an explicitly supplied verified adapter. */
export class SupplyNode implements FulfillmentPort {
 constructor(private c:Config,private fundingCheck?:(ref:string,costUsdUnits:string)=>Promise<boolean>,private fundingAvailable?:()=>boolean,private delegate?:FulfillmentPort){}
 get configured(){return this.c.ENABLE_FULFILLMENT==='true'&&this.c.FULFILLMENT_CONTRACT_VERIFIED==='true'&&!!this.c.SUPPLIER_API_URL&&!!this.c.SUPPLIER_API_KEY}
 get ready(){return this.configured&&this.delegate?.ready===true&&this.fundingAvailable?.()===true}
 validateQuote(sku:string,quantity:number,cost:string){this.delegate?.validateQuote?.(sku,quantity,cost)}
 async verifyQuote(sku:string,quantity:number,cost:string){await this.delegate?.verifyQuote?.(sku,quantity,cost)}
 async purchase(ref:string,sku:string,quantity:number,costUsdUnits?:string):Promise<SupplyResult>{
  if(!this.configured)throw Error('SUPPLY_NODE_NOT_CONFIGURED');
  if(!costUsdUnits||!this.fundingCheck)throw Error('PROCUREMENT_COST_UNVERIFIED');
  if(!this.ready||!this.delegate)throw Error('SUPPLY_NODE_NOT_CONFIGURED');
  if(!(await this.fundingCheck(ref,costUsdUnits)))return {status:'UNKNOWN'};
  return this.delegate.purchase(ref,sku,quantity,costUsdUnits);
 }
 async lookup(ref:string):Promise<SupplyResult>{return this.configured&&this.delegate?.configured?this.delegate.lookup(ref):{status:'UNKNOWN'}}
}
