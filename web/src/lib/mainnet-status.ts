export async function mainnetRuntimeStatus(){
 const configured=!!process.env.MERCENTA_RETAIL_PROXY_KEY&&process.env.MERCENTA_RETAIL_PROXY_KEY.length>=32;
 const paused=process.env.MERCENTA_RETAIL_PAUSED==='true';
 let supplyReady=false,inventoryReady=false,maintenance=true,stockCheckedAt:number|null=null,fulfillmentReady=false;
 if(configured&&!paused)await Promise.all([
  (async()=>{try{const r=await fetch('https://api.mercenta.xyz/commerce-read/availability',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!r.ok)return;const j=await r.json();const age=Date.now()-Number(j.checkedAt);if(!Number.isFinite(age)||age< -60000||age>120000)return;supplyReady=j.supplyReady===true;inventoryReady=j.inventoryReady===true;maintenance=j.maintenance!==false;stockCheckedAt=Number.isFinite(j.stockCheckedAt)?j.stockCheckedAt:null;}catch{}})(),
  (async()=>{try{const r=await fetch('https://api.mercenta.xyz/api/mainnet/health',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!r.ok)return;const j=await r.json();fulfillmentReady=j.ok===true&&j.service==='mercenta-mainnet-fulfillment';}catch{}})(),
 ]);
 // Supply monitor is a read-only feed: its old false checkout flag is not a retail authorization flag.
 const realPurchasesEnabled=configured&&!paused&&supplyReady&&inventoryReady&&!maintenance&&fulfillmentReady;
 return {configured,supplyReady,inventoryReady,maintenance:maintenance||paused,fulfillmentReady,realPurchasesEnabled,checkedAt:Date.now(),stockCheckedAt,existingOrdersAccessible:true,refundMode:'support-owner-manual',paymentMode:'wallet-direct-merchant',delivery:'provider-confirmation-required',agentExecutionEnabled:false,reason:!configured?'retail_not_configured':paused?'operator_paused':!supplyReady||!inventoryReady||maintenance?'supply_unavailable':!fulfillmentReady?'fulfillment_unavailable':null};
}
