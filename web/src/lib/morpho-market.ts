import {z} from 'zod';
export const MORPHO_ARC=Object.freeze({chainId:5042,usdc:'0x3600000000000000000000000000000000000000' as const,appUrl:'https://app.morpho.org/',docsUrl:'https://docs.morpho.org/learn/resources/risks/',termsUrl:'https://morpho.org/disclaimers/',apiUrl:'https://api.morpho.org/graphql'});
// Reviewed addresses, not discovery by name, rate or API-supplied URL. No financial methods.
export const MORPHO_VAULTS=[
 {id:'galaxy',name:'Galaxy USDC',address:'0x8E357432CC12ff425c36432F312968aEb16112AF',codeHash:'0xac3d89c4bed30ede74f4e94e9c0e124a13ed24d0e011181515996362879bae57',review:'Allocation and oracle review pending'},
 {id:'keyrock',name:'Keyrock Prime USDC',address:'0x5bEfAb92a5A3D60F578Cb51EEb4e4FD50a1e3123',codeHash:'0xac3d89c4bed30ede74f4e94e9c0e124a13ed24d0e011181515996362879bae57',review:'Allocation and oracle review pending'},
 {id:'bitwise',name:'Bitwise Premium RWA USDC',address:'0x7610094B846657dCF166D59e42973db52c7015F9',codeHash:'0xac3d89c4bed30ede74f4e94e9c0e124a13ed24d0e011181515996362879bae57',review:'Allocation and oracle review pending'},
] as const;
const micro=z.string().regex(/^\d{1,80}$/),hash=z.string().regex(/^0x[\da-f]{64}$/i),percent=z.string().regex(/^\d{1,3}\.\d{2}$/);
export const morphoVaultSchema=z.object({id:z.enum(['galaxy','keyrock','bitwise']),address:z.string().regex(/^0x[\da-f]{40}$/i),name:z.string(),status:z.enum(['observed','blocked','unavailable']),reason:z.string(),netApyPercent:percent.nullable(),performanceFeePercent:percent.nullable(),managementFeePercent:percent.nullable(),totalAssetsMicro:micro.nullable(),reportedLiquidityMicro:micro.nullable(),warnings:z.array(z.string()).max(20),allocationReview:z.literal('pending')}).strict();
export const morphoSnapshotSchema=z.object({chainId:z.literal(5042),protocol:z.literal('Morpho Vault V2'),asset:z.literal('USDC'),observedAt:z.number().int().nonnegative(),expiresAt:z.number().int().nonnegative(),blockNumber:micro.nullable(),blockHash:hash.nullable(),rateKind:z.literal('API_REPORTED_VARIABLE_NET_APY'),indexerFreshness:z.literal('not_verified'),externalExecutionOnly:z.literal(true),mercentaCustody:z.literal(false),principalGuaranteed:z.literal(false),interestGuaranteed:z.literal(false),vaults:z.array(morphoVaultSchema).length(3)}).strict().superRefine((s,ctx)=>{
 if(s.expiresAt<s.observedAt||s.expiresAt>s.observedAt+30000)ctx.addIssue({code:'custom',message:'Invalid freshness window'});
 if(s.vaults.some((v,i)=>v.id!==MORPHO_VAULTS[i].id||v.address.toLowerCase()!==MORPHO_VAULTS[i].address.toLowerCase()||v.name!==MORPHO_VAULTS[i].name))ctx.addIssue({code:'custom',message:'Unpinned vault'});
 if(s.vaults.some(v=>v.status==='observed')&&(!s.blockHash||!s.blockNumber))ctx.addIssue({code:'custom',message:'Missing chain proof'});
});
export type MorphoSnapshot=z.infer<typeof morphoSnapshotSchema>;
export function unavailableMorpho(now=Date.now()):MorphoSnapshot{return {chainId:5042,protocol:'Morpho Vault V2',asset:'USDC',observedAt:now,expiresAt:now,blockNumber:null,blockHash:null,rateKind:'API_REPORTED_VARIABLE_NET_APY',indexerFreshness:'not_verified',externalExecutionOnly:true,mercentaCustody:false,principalGuaranteed:false,interestGuaranteed:false,vaults:MORPHO_VAULTS.map(v=>({id:v.id,address:v.address,name:v.name,status:'unavailable',reason:'LIVE_VERIFICATION_UNAVAILABLE',netApyPercent:null,performanceFeePercent:null,managementFeePercent:null,totalAssetsMicro:null,reportedLiquidityMicro:null,warnings:[],allocationReview:'pending'}))};}
const rawVault=z.object({address:z.string(),asset:z.object({address:z.string(),decimals:z.literal(6)}),chain:z.object({id:z.literal(5042)}),listed:z.boolean(),netApy:z.number().finite().min(0).max(1).nullable(),performanceFee:z.number().finite().min(0).max(.5),managementFee:z.number().finite().min(0).max(.05),liquidity:z.union([micro,z.number().int().nonnegative().safe()]),warnings:z.array(z.object({type:z.string().max(100),level:z.string().max(30)})).max(20)});
export type MorphoWitness={chainId:number;blockNumber:string;blockHash:string;timestamp:number;vaults:{address:string;codeHash:string;asset:string;totalAssets:string;performanceFee:string;managementFee:string;gates:string[]}[]};
export function assessMorpho(api:unknown,rows:MorphoWitness[],now=Date.now()):MorphoSnapshot{
 const unknown=unavailableMorpho(now);
 if(rows.length!==2||JSON.stringify(rows[0])!==JSON.stringify(rows[1]))return unknown;
 const a=rows[0];if(a.chainId!==5042||!hash.safeParse(a.blockHash).success||!micro.safeParse(a.blockNumber).success||!Number.isSafeInteger(a.timestamp)||a.timestamp*1000>now||now-a.timestamp*1000>120000||a.vaults.length!==3)return unknown;
 const parsed=z.object({items:z.array(rawVault).length(3)}).safeParse(api);if(!parsed.success)return unknown;
 const apiAddresses=parsed.data.items.map(v=>v.address.toLowerCase());if(new Set(apiAddresses).size!==3||apiAddresses.some(x=>!MORPHO_VAULTS.some(v=>v.address.toLowerCase()===x)))return unknown;
 const pct=(n:number)=>(n*100).toFixed(2);
 const vaults=unknown.vaults.map((v,i)=>{
  const obs=a.vaults[i],spec=MORPHO_VAULTS[i],raw=parsed.data.items.find(x=>x.address.toLowerCase()===spec.address.toLowerCase())!;
  if(obs.address.toLowerCase()!==spec.address.toLowerCase()||obs.asset.toLowerCase()!==MORPHO_ARC.usdc.toLowerCase()||raw.asset.address.toLowerCase()!==MORPHO_ARC.usdc.toLowerCase()||obs.codeHash!==spec.codeHash||![obs.totalAssets,obs.performanceFee,obs.managementFee].every(x=>micro.safeParse(x).success)||obs.gates.length!==4||obs.gates.some(x=>!/^0x[\da-f]{40}$/i.test(x)))return v;
  const performance=Number(BigInt(obs.performanceFee))/1e18,management=Number(BigInt(obs.managementFee))*31536000/1e18;
  if(Math.abs(performance-raw.performanceFee)>1e-8||Math.abs(management-raw.managementFee)>1e-8||BigInt(String(raw.liquidity))>BigInt(obs.totalAssets))return v;
  const reason=!raw.listed?'NOT_LISTED':raw.warnings.length?'PROVIDER_WARNINGS':obs.gates.some(x=>BigInt(x)!==0n)?'ACCESS_GATE_ENABLED':BigInt(obs.totalAssets)===0n?'EMPTY_VAULT':BigInt(String(raw.liquidity))===0n?'NO_REPORTED_LIQUIDITY':raw.netApy===null?'RATE_UNAVAILABLE':'CONTRACT_OBSERVED_NOT_AUDITED';
  return {...v,status:reason==='CONTRACT_OBSERVED_NOT_AUDITED'?'observed' as const:'blocked' as const,reason,netApyPercent:reason==='CONTRACT_OBSERVED_NOT_AUDITED'?pct(raw.netApy!):null,performanceFeePercent:pct(performance),managementFeePercent:pct(management),totalAssetsMicro:obs.totalAssets,reportedLiquidityMicro:String(raw.liquidity),warnings:raw.warnings.map(w=>w.type)};
 });
 return {...unknown,expiresAt:now+30000,blockNumber:a.blockNumber,blockHash:a.blockHash,vaults};
}
// Exploration only. This is never an investment recommendation or transaction permission.
export function canExploreMorpho(s:MorphoSnapshot|null,id:string,accepted:boolean,now=Date.now()){
 return !!s&&morphoSnapshotSchema.safeParse(s).success&&accepted&&s.observedAt<=now&&s.expiresAt>now&&s.vaults.some(v=>v.id===id&&v.status==='observed'&&v.netApyPercent!==null);
}
export function formatMorphoUsdc(value:string|null,locale='en-US'){if(value===null)return '—';const whole=BigInt(value)/1000000n;return whole.toLocaleString(locale)+' USDC';}
