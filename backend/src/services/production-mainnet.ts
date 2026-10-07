import {z} from 'zod';import {realpathSync} from 'node:fs';import {resolve,dirname,basename,join,sep} from 'node:path';
export const ARC_PRODUCTION=Object.freeze({chainId:5042,network:'eip155:5042',primaryRpc:'https://rpc.mainnet.arc.io',secondaryRpc:'https://rpc.quicknode.mainnet.arc.io',explorer:'https://explorer.arc.io',usdc:'0x3600000000000000000000000000000000000000',gatewayWallet:'0x77777777dcc4d5a8b6e418fd04d8997ef11000ee',gatewayDomain:26,gatewayApi:'https://gateway-api.circle.com/v1',nativeDecimals:18,tokenDecimals:6,nativeEmitter:'0xfffffffffffffffffffffffffffffffffffffffe',minConfirmations:3,minMaxFeePerGasWei:'20000000000'} as const);
const units=z.string().regex(/^(0|[1-9]\d{0,17})$/),address=z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const checks=z.object({separateRuntime:z.boolean(),separateDatabase:z.boolean(),separateSecrets:z.boolean(),mainnetSignerVerified:z.boolean(),supplyContractVerified:z.boolean(),providerSpendCapVerified:z.boolean(),refundPathVerified:z.boolean(),restoreDrillVerified:z.boolean(),alertsVerified:z.boolean(),securityReviewVerified:z.boolean(),ownerApprovalVerified:z.boolean()}).strict();
export const productionLaunchSchema=z.object({network:z.literal('arc-mainnet'),chainId:z.literal(5042),phase:z.enum(['closed','canary','paused']),ownerWallet:address,merchantWallet:address,databaseNamespace:z.literal('mercenta-mainnet'),primaryChainId:z.number().int(),secondaryChainId:z.number().int(),rpcObservedAt:z.number().int(),supplierAvailableUsdMicro:units.nullable(),supplierReservedUsdMicro:units,supplierObservedAt:z.number().int(),canaryCostUsdMicro:units,canarySaleUsdcMicro:units,providerRemainingUsdMicro:units.nullable(),approvalExpiresAt:z.number().int(),checks}).strict();
export type ProductionLaunch=z.infer<typeof productionLaunchSchema>;
/** Server-owned evidence only. This decision does not activate routes or sign/pay anything. */
export function evaluateProductionLaunch(raw:unknown,now=Date.now()){
 const parsed=productionLaunchSchema.safeParse(raw);if(!parsed.success)return {eligibleForOwnerCanary:false,reasons:['INVALID_PRODUCTION_EVIDENCE'],purchasesEnabled:false as const};
 const c=parsed.data,reasons:string[]=[];if(c.phase!=='canary')reasons.push('OWNER_CANARY_NOT_ARMED');
 if(c.primaryChainId!==5042||c.secondaryChainId!==5042)reasons.push('WRONG_MAINNET_CHAIN');
 if(now-c.rpcObservedAt>15000||c.rpcObservedAt>now)reasons.push('RPC_EVIDENCE_STALE');
 if(c.approvalExpiresAt<=now||c.approvalExpiresAt-now>600000)reasons.push('OWNER_APPROVAL_MISSING_OR_INVALID');
 for(const [name,ok] of Object.entries(c.checks))if(!ok)reasons.push('UNVERIFIED_'+name.replace(/[A-Z]/g,m=>'_'+m).toUpperCase());
 const cost=BigInt(c.canaryCostUsdMicro),sale=BigInt(c.canarySaleUsdcMicro);
 if(cost<=0n||cost>1000000n||sale<=0n||sale>1000000n)reasons.push('OWNER_ONE_DOLLAR_CANARY_CAP');
 if(c.supplierAvailableUsdMicro===null||now-c.supplierObservedAt>15000||c.supplierObservedAt>now)reasons.push('PROCUREMENT_BALANCE_UNKNOWN_OR_STALE');
 else if(BigInt(c.supplierAvailableUsdMicro)-BigInt(c.supplierReservedUsdMicro)-cost<10000000n)reasons.push('PROCUREMENT_RESERVE_BELOW_TEN_DOLLARS');
 if(c.providerRemainingUsdMicro===null||BigInt(c.providerRemainingUsdMicro??'0')<cost)reasons.push('SERVER_VERIFIED_PROVIDER_CAP_REQUIRED');
 if(/^0x0{40}$/i.test(c.ownerWallet)||/^0x0{40}$/i.test(c.merchantWallet))reasons.push('ZERO_WALLET');
 return {eligibleForOwnerCanary:reasons.length===0,reasons,purchasesEnabled:false as const,network:'arc-mainnet',chainId:5042,limits:{oneOrder:true,maxCostUsdMicro:'1000000',maxSaleUsdcMicro:'1000000',minimumProcurementReserveUsdMicro:'10000000'},activation:'Separate server integration and fresh owner approval required; not a runtime switch.'};
}
export function assertProductionNamespace(path:string,testnetPath:string){const canonical=(s:string)=>{let current=resolve(s);const suffix:string[]=[];for(;;){try{return join(realpathSync.native(current),...suffix).toLowerCase();}catch{const parent=dirname(current);if(parent===current)return resolve(s).toLowerCase();suffix.unshift(basename(current));current=parent;}}};const a=canonical(path),b=canonical(testnetPath);if(!path||a===b||!a.split(sep).some(p=>p==='mercenta-mainnet'||p==='mercenta-mainnet.sqlite'))throw Error('MAINNET_DATABASE_ISOLATION_REQUIRED');}
export function mainnetMaintenanceMessage(){return {code:'MAINNET_PURCHASES_PAUSED',purchasesEnabled:false,existingOrdersMustRemainReadable:true,refundsMustRemainAvailable:true,message:'Purchases are paused while availability and payment safety are verified. Existing orders must remain accessible. Contact support@mercenta.xyz.'};}
