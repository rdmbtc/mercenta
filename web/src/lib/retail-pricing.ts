/** 9% markup on cost, not 9% net profit. Currency conversion and fees are separate. */
export const RETAIL_MARKUP_BPS=900;
export const RETAIL_PRICE_POLICY='MERCENTA_RETAIL_9_V1';
export function retailMicro(cost:bigint,markupBps=RETAIL_MARKUP_BPS){if(cost<0n||!Number.isSafeInteger(markupBps)||markupBps<800||markupBps>1000)throw Error('RETAIL_PRICE_INVALID');return (cost*BigInt(10000+markupBps)+9999n)/10000n;}
export function retailPrice(cost:number,markupBps=RETAIL_MARKUP_BPS){if(!Number.isFinite(cost)||cost<0||cost>1e9)throw Error('RETAIL_PRICE_INVALID');const s=cost.toFixed(6);if(Number(s)!==cost)throw Error('RETAIL_COST_PRECISION');const n=BigInt(s.replace('.',''));return Number(retailMicro(n,markupBps))/1e6;}
