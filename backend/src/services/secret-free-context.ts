/** Allowlisted model DTO: never forward raw delivery, credential or executor records. */
const fields=new Set(['availableUnits','budget','usage','taskBudgetUnits','reserveFloorUnits','query','region','items','receivedProducts','capturedAt','testUnitPriceUnits','productId','name','id','available','stock','sourcePrice','sourceCurrency','testPriceUnits','quantity','amountUnits','expiresAt','nonRedeemable','optionName','productName','noFundsMoved','execution','maxOrders','reserveUnits','budgetUnits','maxOrderUnits','dailyCapUnits','monthlyTotalUnits']);
const tools=new Set(['task.authorize','account.balance','budget.read','catalog.search','catalog.options','checkout.quote']);
function projection(v:unknown,depth=0):unknown {
  if(depth>6)return null;
  if(v===null||typeof v==='boolean')return v;
  if(typeof v==='number')return Number.isFinite(v)?v:null;
  if(typeof v==='string')return /(?:-----BEGIN|\bBearer\s|\bsk[-_]|\b(?:api[_-]?key|password|secret)\s*[:=])/i.test(v)?'[REDACTED]':v.slice(0,250);
  if(Array.isArray(v))return v.slice(0,60).map(x=>projection(x,depth+1));
  if(v&&typeof v==='object'){const out:Record<string,unknown>={};for(const [k,x] of Object.entries(v))if(fields.has(k))out[k]=projection(x,depth+1);return out;}
  return null;
}
export function secretFreeObservations(events:{seq:number;tool:string;status:string;result:unknown}[]){return events.filter(e=>e.status==='CHECKED'&&tools.has(e.tool)).slice(-9).map(e=>({seq:e.seq,tool:e.tool,status:'CHECKED',result:projection(e.result)}));}
