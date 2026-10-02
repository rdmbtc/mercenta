import {readFileSync,statSync} from 'node:fs';
import {isIP} from 'node:net';
import {z} from 'zod';
import {CHAIN_CONFIGS} from '@circle-fin/x402-batching/client';
export const NETWORK='eip155:5042002',GATEWAY_API='https://gateway-api-testnet.circle.com/v1';
export const CHAIN=CHAIN_CONFIGS.arcTestnet;
const address=z.string().regex(/^0x[a-fA-F0-9]{40}$/).transform(v=>v.toLowerCase());
const commonAgentFields={walletAddress:address,ownerWallet:address,enabled:z.boolean().default(false),services:z.array(z.object({id:z.string().regex(/^[a-z][a-z0-9-]{0,49}$/),url:z.string().url(),payTo:address,maxAmountUnits:z.string().regex(/^[1-9]\d{0,4}$/)}).strict()).max(10)};
export const agentConfigSchema=z.discriminatedUnion('provider',[
 z.object({...commonAgentFields,provider:z.literal('circle-mpc').default('circle-mpc'),apiKey:z.string().startsWith('TEST_API_KEY:').min(25),entitySecret:z.string().regex(/^[a-fA-F0-9]{64}$/),walletId:z.string().uuid()}).strict(),
 z.object({...commonAgentFields,provider:z.literal('local-eoa'),privateKeyPath:z.string().min(1).max(1024)}).strict()
]).superRefine((c,ctx)=>{
 const ids=new Set<string>();
 for(const [i,s] of c.services.entries()){
  const u=new URL(s.url);
  if(u.protocol!=='https:'||u.username||u.password||u.hash||u.port&&u.port!=='443'||isIP(u.hostname)||!u.hostname.includes('.')||u.hostname.endsWith('.local')||u.hostname.endsWith('.localhost'))ctx.addIssue({code:'custom',path:['services',i,'url'],message:'PUBLIC_HTTPS_REQUIRED'});
  if(BigInt(s.maxAmountUnits)>10_000n)ctx.addIssue({code:'custom',path:['services',i,'maxAmountUnits'],message:'CAP_001_USDC'});
  if(ids.has(s.id))ctx.addIssue({code:'custom',message:'DUPLICATE_SERVICE'});ids.add(s.id);
 }
});
export type AgentConfig=z.infer<typeof agentConfigSchema>;
export type Service=AgentConfig['services'][number];
export function loadAgentConfig(path?:string){
 if(!path)return null;
 try{const st=statSync(path);if(!st.isFile()||st.size>32768||process.platform!=='win32'&&(st.mode&0o027)!==0)throw new Error();return agentConfigSchema.parse(JSON.parse(readFileSync(path,'utf8')))}catch{throw new Error('CIRCLE_AGENT_CONFIGURATION_INVALID')}
}
const requirement=z.object({scheme:z.literal('exact'),network:z.literal(NETWORK),asset:address,amount:z.string().regex(/^[1-9]\d{0,4}$/),payTo:address,maxTimeoutSeconds:z.number().int().min(1).max(604900),extra:z.object({name:z.literal('GatewayWalletBatched'),version:z.literal('1'),verifyingContract:address}).passthrough()}).passthrough();
export type Requirements=z.infer<typeof requirement>;
export function checkedRequirements(header:string,service:Service){
 if(header.length>16000||!/^[A-Za-z0-9+/=_-]+$/.test(header))throw new Error('INVALID_PAYMENT_REQUIREMENTS');
 let raw:unknown;try{raw=JSON.parse(Buffer.from(header,'base64').toString('utf8'))}catch{throw new Error('INVALID_PAYMENT_REQUIREMENTS')}
 const r=z.object({x402Version:z.literal(2),accepts:z.array(z.unknown()).min(1).max(32),resource:z.object({url:z.string(),description:z.string().max(1000).optional(),mimeType:z.string().max(100).optional()}).passthrough()}).parse(raw);
 if(r.resource.url!==service.url)throw new Error('RESOURCE_MISMATCH');
 const option=r.accepts.map(x=>requirement.safeParse(x)).find(x=>x.success&&x.data.asset===CHAIN.usdc.toLowerCase()&&x.data.extra.verifyingContract===CHAIN.gatewayWallet.toLowerCase()&&x.data.payTo===service.payTo&&BigInt(x.data.amount)<=BigInt(service.maxAmountUnits));
 if(!option?.success)throw new Error('NO_ALLOWED_ARC_GATEWAY_OPTION');
 return {x402Version:2,accepted:option.data,resource:r.resource};
}
export function assertOwner(c:AgentConfig,actor:string){if(actor!==`wallet:${c.ownerWallet}`)throw new Error('CIRCLE_AGENT_NOT_AVAILABLE')}
export function checkDailyLimit(reserved:string,amount:string){if(BigInt(reserved)+BigInt(amount)>100_000n)throw new Error('CIRCLE_DAILY_LIMIT')}
export function publicCircleStatus(c:AgentConfig|null,actor:string){
 const available=!!c&&actor===`wallet:${c.ownerWallet}`;
 return {configured:available,enabled:available&&c!.enabled,chainId:5042002,accountType:'EOA',provider:available?c!.provider:null,custody:available?(c!.provider==='local-eoa'?'server-managed-local-eoa':'developer-controlled-mpc'):null,walletAddress:available?c!.walletAddress:null,services:available?c!.services.map(({id,maxAmountUnits})=>({id,maxAmountUnits})):[],perPaymentLimitUnits:'10000',dailyLimitUnits:'100000',guardrail:'backend-only; not onchain delegated authority',gateway:{nanopayments:true,requiresEOA:true,autoDeposit:false},requiresConfirmation:true};
}
export function matchTransfer(t:unknown,expected:{nonce:string;from:string;to:string;amount:string}){
 const v=z.object({id:z.string().uuid(),status:z.enum(['received','batched','confirmed','completed','failed']),token:z.literal('USDC'),sendingNetwork:z.literal(NETWORK),recipientNetwork:z.literal(NETWORK),fromAddress:address,toAddress:address,amount:z.string().regex(/^[1-9]\d*$/),nonce:z.string().regex(/^0x[a-fA-F0-9]{64}$/).transform(s=>s.toLowerCase()),txHash:z.string().regex(/^0x[a-fA-F0-9]{64}$/).nullable()}).passthrough().parse(t);
 if(v.nonce!==expected.nonce.toLowerCase()||v.fromAddress!==expected.from.toLowerCase()||v.toAddress!==expected.to.toLowerCase()||v.amount!==expected.amount)throw new Error('CIRCLE_ATTRIBUTION_MISMATCH');
 if(v.status==='completed'&&!v.txHash)throw new Error('CIRCLE_RECEIPT_MISSING');
 return v;
}
