/** Pure planning policy. No signer, token transfer, provider subscription or APR promise. */
export type CapitalSnapshot = {
  settledCashUnits: string; reserveFloorUnits: string; reservedOrderUnits: string;
  refundLiabilityUnits: string; liquidityBufferUnits: string; burn30dUnits: string;
  pendingPurchaseUnits: string; yieldRedeemableUnits: string; pendingIncomingUnits: string;
  maxActionUnits: string; observedAt: number; redemptionDelayMs: number;
  obligations: {id: string; dueAt: number; amountUnits: string}[];
  redemptionState: 'NONE'|'PENDING'|'UNKNOWN'|'SETTLED'|'FAILED';
  paused: boolean; eligibilityVerified: boolean; quoteFresh: boolean;
};
const unitPattern=/^(0|[1-9]\d{0,17})$/;
const unit=(v:unknown)=>{if(typeof v!=='string'||!unitPattern.test(v))throw Error('CAPITAL_UNITS_INVALID');return BigInt(v);};
export function planCapital(s:CapitalSnapshot,now:number){
  if(!Number.isSafeInteger(now)||now<0||!Number.isSafeInteger(s.observedAt)||s.observedAt<0||!Number.isSafeInteger(s.redemptionDelayMs)||s.redemptionDelayMs<0||s.redemptionDelayMs>604800000||!Array.isArray(s.obligations)||s.obligations.length>100||!['NONE','PENDING','UNKNOWN','SETTLED','FAILED'].includes(s.redemptionState)||[s.paused,s.eligibilityVerified,s.quoteFresh].some(v=>typeof v!=='boolean'))throw Error('CAPITAL_SNAPSHOT_INVALID');
  const cash=unit(s.settledCashUnits),floor=unit(s.reserveFloorUnits),orders=unit(s.reservedOrderUnits),refunds=unit(s.refundLiabilityUnits),buffer=unit(s.liquidityBufferUnits),burn=unit(s.burn30dUnits),purchase=unit(s.pendingPurchaseUnits),yieldQuote=unit(s.yieldRedeemableUnits),incoming=unit(s.pendingIncomingUnits),cap=unit(s.maxActionUnits);
  if(cap===0n)throw Error('CAPITAL_ACTION_LIMIT_REQUIRED');
  const ids=new Set<string>();let due=0n,nextDue:number|null=null;
  for(const o of s.obligations){if(!o||typeof o.id!=='string'||!o.id||o.id.length>100||ids.has(o.id)||!Number.isSafeInteger(o.dueAt)||o.dueAt<0)throw Error('CAPITAL_OBLIGATION_INVALID');ids.add(o.id);const amount=unit(o.amountUnits);if(o.dueAt<=now+s.redemptionDelayMs){due+=amount;if(nextDue===null||o.dueAt<nextDue)nextDue=o.dueAt;}}
  const operating=(burn*14n+29n)/30n,base=floor>operating?floor:operating;
  const protectedUnits=base+orders+refunds+buffer+due,needed=protectedUnits+purchase;
  const surplus=cash>needed?cash-needed:0n,shortfall=needed>cash?needed-cash:0n;
  let decision='HOLD',action=0n,reason='NO_IDLE_SURPLUS';
  if(s.paused){reason='POLICY_PAUSED';}
  else if(s.observedAt>now||now-s.observedAt>15000){reason='BALANCE_SNAPSHOT_STALE';}
  else if(s.redemptionState==='UNKNOWN'){decision='RECONCILE';reason='UNKNOWN_REDEMPTION_DO_NOT_RESUBMIT';}
  else if(s.redemptionState==='PENDING'){decision='WAIT_FOR_SETTLEMENT';reason='UNSETTLED_REDEMPTION_NOT_SPENDABLE';}
  else if(s.redemptionState==='FAILED'){decision='MANUAL_REVIEW';reason='REDEMPTION_FAILURE_REQUIRES_REVIEW';}
  else if(shortfall>0n){if(s.eligibilityVerified&&s.quoteFresh&&yieldQuote>0n){decision='REQUEST_REDEMPTION';action=shortfall<yieldQuote?shortfall:yieldQuote;action=action<cap?action:cap;reason=action<shortfall?'PARTIAL_LIQUIDITY_REMAINS_BLOCKED':'REDEMPTION_MUST_SETTLE_BEFORE_PURCHASE';}else{decision='LIQUIDITY_SHORTFALL';reason='NO_VERIFIED_REDEMPTION_ACCESS_OR_QUOTE';}}
  else if(purchase>0n){decision='PURCHASE_READY_FOR_REVIEW';reason='SETTLED_CASH_COVERS_PROTECTED_FUNDS_AND_PURCHASE';}
  else if(surplus>0n){if(s.eligibilityVerified&&s.quoteFresh){decision='PROPOSE_ALLOCATION';action=surplus<cap?surplus:cap;reason='OWNER_REVIEW_AND_REAL_ADAPTER_REQUIRED';}else{reason='YIELD_ACCESS_OR_QUOTE_UNVERIFIED';}}
  return {schemaVersion:1 as const,mode:'PLANNING_ONLY' as const,executionEnabled:false as const,decision,reason,settledCashUnits:cash.toString(),protectedUnits:protectedUnits.toString(),operatingReserveUnits:base.toString(),imminentObligationsUnits:due.toString(),candidateSurplusUnits:surplus.toString(),shortfallUnits:shortfall.toString(),proposedActionUnits:action.toString(),ignoredPendingIncomingUnits:incoming.toString(),redemptionDeadline:nextDue===null?null:Math.max(0,nextDue-s.redemptionDelayMs),actualYieldUnits:null,aprVerified:false as const,moneyMoved:false as const};
}
