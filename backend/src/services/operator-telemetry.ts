import {createHash} from 'node:crypto';
export type OperatorTelemetryInput={id:string;status:string;step:number;maxSteps:number;updatedAt:number;expiresAt:number;events:{seq:number;tool:string;status:string;result?:unknown;provider?:unknown}[];receipt:unknown;scope:{chainId:number;realPurchasingEnabled:boolean}};
/** A deterministic unsigned observation, not a cryptographic payment receipt or settlement witness. */
export function buildOperatorTelemetry(view:OperatorTelemetryInput){
 if(view.scope.chainId!==5042002||view.scope.realPurchasingEnabled!==false)throw Error('TELEMETRY_SCOPE_REJECTED');
 if(!/^[a-zA-Z0-9-]{1,80}$/.test(view.id)||!Number.isSafeInteger(view.step)||view.step<0||!Number.isSafeInteger(view.maxSteps)||view.step>view.maxSteps)throw Error('TELEMETRY_INPUT_REJECTED');
 const knownTools=new Set(['checkout.confirm','receipt.verify','task.cancel','account.balance','account.read','budget.read','catalog.search','catalog.select','catalog.lookup','quote.create','checkout.quote','model.step','policy.check','receipt.read','task.guard','task.create','task.start','task.resume']); const knownStatuses=new Set(['PLANNING','QUOTED','EXECUTED','CANCELLED','BLOCKED','NO_ACTION','CHECKED','FAILED','PROPOSED','REJECTED','ACCEPTED']); const safe=(v:string)=>knownStatuses.has(v)?v:'REDACTED'; const safeTool=(v:string)=>knownTools.has(v)?v:'REDACTED';
 const events=view.events.map(e=>{if(!Number.isSafeInteger(e.seq)||e.seq<1)throw Error('TELEMETRY_SEQUENCE_REJECTED');return {seq:e.seq,tool:safeTool(e.tool),status:safe(e.status)}});
 for(let i=1;i<events.length;i++)if(events[i]!.seq<=events[i-1]!.seq)throw Error('TELEMETRY_SEQUENCE_REJECTED');
 if(!Number.isSafeInteger(view.updatedAt)||!Number.isSafeInteger(view.expiresAt)||view.updatedAt<0||view.expiresAt<0)throw Error('TELEMETRY_INPUT_REJECTED');
 const observation={schemaVersion:1 as const,kind:'UNSIGNED_OPERATOR_OBSERVATION' as const,network:'arc-testnet' as const,chainId:5042002 as const,runId:view.id,status:safe(view.status),step:view.step,maxSteps:view.maxSteps,updatedAt:view.updatedAt,expiresAt:view.expiresAt,events,observedEventCount:events.length,receiptAvailable:view.receipt!==null&&view.receipt!==undefined,settlementProofVerified:false as const,realPurchasingEnabled:false as const};
 return {...observation,digest:createHash('sha256').update(JSON.stringify(observation)).digest('hex')};
}
