/** USYC automatic planning policy. Execution, custody and issuer access remain separate. */
import {z} from 'zod';
const units=z.bigint().nonnegative().max(10n**30n),time=z.number().int().nonnegative().safe();
const policySchema=z.object({enabled:z.boolean(),capitalSource:z.literal('MERCHANT_OWNED'),reserveFloorMicro:units,gasReserveMicro:units,maxAllocationMicro:units,maxExposureMicro:units,minActionMicro:units.positive(),maxSlippageBps:z.number().int().min(0).max(50),redemptionDelayMs:time,ownerPermissionUntil:time}).strict();
const snapshotSchema=z.object({chainId:z.literal(5042),cashUsdcMicro:units,burn30dMicro:units,customerLiabilitiesMicro:units,refundExposureMicro:units,pendingSpendUsdcMicro:units,usycPositionValueMicro:units,observedAt:time,liabilitiesComplete:z.boolean(),ownCapitalConfirmed:z.boolean(),eligibilityVerified:z.boolean(),adapterVerified:z.boolean(),quoteObservedAt:time,quoteExpiresAt:time,navMicro:units.positive(),usycDecimals:z.number().int().min(0).max(18),pendingOperation:z.enum(['NONE','SUBSCRIPTION_PENDING','REDEMPTION_PENDING','UNKNOWN']),obligations:z.array(z.object({dueAt:time,amountMicro:units}).strict()).max(1000)}).strict();
export type UsycAutoPolicy=z.infer<typeof policySchema>;
export type UsycTreasurySnapshot=z.infer<typeof snapshotSchema>;
export type UsycAutoPlan={action:'HOLD'|'SUBSCRIBE'|'REQUEST_REDEMPTION';reason:string;protectedCashMicro:string;idleSurplusMicro:string;actionMicro:string;minimumUsycUnits:string;executionAuthorized:false;annualYieldGuaranteed:false};
/** All policy/snapshot evidence is supplied by trusted treasury adapters, never a public form or LLM. */
export function planUsycAuto(rawPolicy:unknown,rawSnapshot:unknown,now=Date.now()):UsycAutoPlan{
 const hold=(reason:string,protectedCash=0n,surplus=0n):UsycAutoPlan=>({action:'HOLD',reason,protectedCashMicro:protectedCash.toString(),idleSurplusMicro:surplus.toString(),actionMicro:'0',minimumUsycUnits:'0',executionAuthorized:false,annualYieldGuaranteed:false});
 if(!Number.isSafeInteger(now)||now<0)return hold('INVALID_CLOCK');
 const pp=policySchema.safeParse(rawPolicy),ss=snapshotSchema.safeParse(rawSnapshot);if(!pp.success||!ss.success)return hold('UNVERIFIED_TREASURY_INPUT');
 const p=pp.data,s=ss.data;
 const operating=(s.burn30dMicro*14n+29n)/30n;
 const base=operating>p.reserveFloorMicro?operating:p.reserveFloorMicro;
 if(!Number.isSafeInteger(now+p.redemptionDelayMs))return hold('INVALID_REDEMPTION_HORIZON');
 const obligations=s.obligations.filter(o=>o.dueAt<=now+p.redemptionDelayMs).reduce((n,o)=>n+o.amountMicro,0n);
 const protectedCash=base+p.gasReserveMicro+s.customerLiabilitiesMicro+s.refundExposureMicro+s.pendingSpendUsdcMicro+obligations;
 const surplus=s.cashUsdcMicro>protectedCash?s.cashUsdcMicro-protectedCash:0n;
 if(!p.enabled)return hold('USYC_EXECUTION_DISABLED',protectedCash,surplus);
 if(p.ownerPermissionUntil<=now)return hold('OWNER_PERMISSION_EXPIRED',protectedCash,surplus);
 if(!s.ownCapitalConfirmed||!s.liabilitiesComplete)return hold('CUSTOMER_FUNDS_OR_LIABILITIES_UNVERIFIED',protectedCash,surplus);
 if(!s.eligibilityVerified||!s.adapterVerified)return hold('USYC_ISSUER_ACCESS_OR_ADAPTER_UNVERIFIED',protectedCash,surplus);
 if(s.observedAt>now||now-s.observedAt>15000||s.quoteObservedAt>now||now-s.quoteObservedAt>15000||s.quoteExpiresAt<=now)return hold('STALE_CASH_OR_NAV',protectedCash,surplus);
 if(s.pendingOperation!=='NONE')return hold('WAIT_FOR_ORIGINAL_OPERATION',protectedCash,surplus);
 if(s.cashUsdcMicro<protectedCash){
  const deficit=protectedCash-s.cashUsdcMicro,amount=deficit<s.usycPositionValueMicro?deficit:s.usycPositionValueMicro;
  if(amount<p.minActionMicro)return hold('INSUFFICIENT_REDEEMABLE_POSITION',protectedCash,surplus);
  // This is a request, not settled cash. Cash is never increased here or ahead of a receipt.
  return {...hold('REDEMPTION_REQUIRED_NOT_INSTANT_CASH',protectedCash,surplus),action:'REQUEST_REDEMPTION',actionMicro:amount.toString()};
 }
 const headroom=p.maxExposureMicro>s.usycPositionValueMicro?p.maxExposureMicro-s.usycPositionValueMicro:0n;
 const amount=[surplus,p.maxAllocationMicro,headroom].reduce((a,b)=>a<b?a:b);
 if(amount<p.minActionMicro)return hold('NO_BOUNDED_IDLE_SURPLUS',protectedCash,surplus);
 const expectedUnits=amount*(10n**BigInt(s.usycDecimals))/s.navMicro;
 const minimum=expectedUnits*BigInt(10000-p.maxSlippageBps)/10000n;
 if(minimum===0n)return hold('SUBSCRIPTION_ROUNDING_TOO_SMALL',protectedCash,surplus);
 return {...hold('BOUNDED_MERCHANT_SURPLUS_ONLY',protectedCash,surplus),action:'SUBSCRIBE',actionMicro:amount.toString(),minimumUsycUnits:minimum.toString()};
}
