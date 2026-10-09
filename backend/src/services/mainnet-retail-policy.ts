/** Public recipient pin and server-owned retail pricing. No transfer or purchase capability. */
import {createHash,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {retailMicro,RETAIL_PRICE_POLICY} from './retail-pricing.js';
export const MAINNET_RETAIL_RECIPIENT='0x58863e4a739da0e62c2eba258b7783e95d5c48ce';
export const MAINNET_RETAIL_POLICY=Object.freeze({version:'MERCENTA_MAINNET_RETAIL_V1',chainId:5042,recipient:MAINNET_RETAIL_RECIPIENT,markupBps:900,reserveUsdMicro:'10000000',refundMode:'support-owner-manual',quoteLifetimeMs:300000,usdToUsdcPricing:'1:1',paymentsEnabled:false} as const);
const micro=z.string().regex(/^[1-9]\d{0,17}$/),address=z.string().regex(/^0x[0-9a-f]{40}$/i).refine(v=>!/^0x0{40}$/i.test(v));
export const retailQuoteSchema=z.object({id:z.string().uuid(),owner:address,recipient:z.literal(MAINNET_RETAIL_RECIPIENT),chainId:z.literal(5042),serviceId:z.string().uuid(),itemId:z.string().uuid(),region:z.string().regex(/^[A-Z0-9_-]{2,16}$/),quantity:z.number().int().min(1).max(100),unitCostUsdMicro:micro,costUsdMicro:micro,saleUsdcMicro:micro,createdAt:z.number().int().nonnegative().safe(),expiresAt:z.number().int().positive().safe(),pricingPolicy:z.literal(RETAIL_PRICE_POLICY),policyVersion:z.literal(MAINNET_RETAIL_POLICY.version)}).strict();
export type RetailQuote=z.infer<typeof retailQuoteSchema>;
const observationSchema=z.object({serviceId:z.string().uuid(),itemId:z.string().uuid(),region:z.string().regex(/^[A-Z0-9_-]{2,16}$/),type:z.literal('voucher'),requiredFields:z.array(z.string()).length(0),unitCostUsdMicro:micro,inStock:z.number().int().nonnegative().safe(),observedAt:z.number().int().nonnegative().safe(),cashUsdMicro:z.string().regex(/^(0|[1-9]\d{0,17})$/),cashObservedAt:z.number().int().nonnegative().safe()}).strict();
export function validateRetailQuote(raw:unknown):RetailQuote {
 const q=retailQuoteSchema.parse(raw),cost=BigInt(q.unitCostUsdMicro);
 if(q.owner.toLowerCase()===q.recipient||q.costUsdMicro!==(cost*BigInt(q.quantity)).toString()||q.saleUsdcMicro!==(retailMicro(cost)*BigInt(q.quantity)).toString()||q.expiresAt-q.createdAt!==MAINNET_RETAIL_POLICY.quoteLifetimeMs)throw Error('RETAIL_QUOTE_BINDING_INVALID');
 return {...q,owner:q.owner.toLowerCase()};
}
/** Observation must come from the pinned server adapter, never a request body or saved catalogue. */
export function createRetailQuote(owner:string,quantity:number,observation:unknown,reservedUsdMicro=0n,now=Date.now()):RetailQuote {
 const o=observationSchema.parse(observation);
 if(!Number.isSafeInteger(now)||now<0||reservedUsdMicro<0n)throw Error('RETAIL_QUOTE_INPUT_INVALID');
 for(const t of [o.observedAt,o.cashObservedAt])if(t>now||now-t>15000)throw Error('RETAIL_OBSERVATION_STALE');
 if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100||quantity>o.inStock)throw Error('RETAIL_OUT_OF_STOCK');
 const cost=BigInt(o.unitCostUsdMicro)*BigInt(quantity),cash=BigInt(o.cashUsdMicro);
 if(cash<=10000000n||cash-reservedUsdMicro-cost<10000000n)throw Error('RETAIL_PROCUREMENT_PAUSED');
 return validateRetailQuote({id:randomUUID(),owner,recipient:MAINNET_RETAIL_RECIPIENT,chainId:5042,serviceId:o.serviceId,itemId:o.itemId,region:o.region,quantity,unitCostUsdMicro:o.unitCostUsdMicro,costUsdMicro:cost.toString(),saleUsdcMicro:(retailMicro(BigInt(o.unitCostUsdMicro))*BigInt(quantity)).toString(),createdAt:now,expiresAt:now+MAINNET_RETAIL_POLICY.quoteLifetimeMs,pricingPolicy:RETAIL_PRICE_POLICY,policyVersion:MAINNET_RETAIL_POLICY.version});
}
export function retailQuoteDigest(raw:unknown){return createHash('sha256').update(JSON.stringify(validateRetailQuote(raw))).digest('hex');}
export function retailPaymentVerificationInput(raw:unknown,txHash:string,assetKind:'native'|'erc20',now=Date.now()){
 const q=validateRetailQuote(raw);
 if(!Number.isSafeInteger(now)||now<q.createdAt)throw Error('RETAIL_PAYMENT_CLOCK_INVALID');
 // Ceiling deliberately rejects transfers mined before creation, including same-second ambiguity.
 return {hash:txHash,sender:q.owner,recipient:q.recipient,amountMicro:BigInt(q.saleUsdcMicro),assetKind,notBeforeUnix:BigInt(Math.ceil(q.createdAt/1000)),notAfterUnix:BigInt(Math.floor(now/1000))};
}
