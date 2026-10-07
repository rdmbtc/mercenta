import {createHash} from 'node:crypto';import type {WitnessPorts} from './receipt-proof-generator.js';import {ARC_PRODUCTION} from './production-mainnet.js';
const address=/^0x[\da-f]{40}$/i,hash=/^0x[\da-f]{64}$/i,transfer='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
export async function verifyMainnetUsdcReceipt(input:{hash:string;sender:string;recipient:string;amountMicro:bigint;assetKind:'erc20'|'native'},w:{primaryWitness:WitnessPorts;secondaryWitness:WitnessPorts}){
 const fail=(reason:string)=>({status:'UNVERIFIED' as const,reason,chainId:5042,moneyMoved:false});
 try{
 if(!hash.test(input.hash)||!address.test(input.sender)||!address.test(input.recipient)||/^0x0{40}$/i.test(input.sender)||/^0x0{40}$/i.test(input.recipient)||input.sender.toLowerCase()===input.recipient.toLowerCase()||input.amountMicro<=0n||input.amountMicro>1000000n||!['erc20','native'].includes(input.assetKind))return fail('INVALID_ONE_DOLLAR_CANARY_TRANSFER');
 const {primaryWitness:a,secondaryWitness:b}=w;const u=new URL(a.endpoint!),v=new URL(b.endpoint!);if(u.protocol!=='https:'||v.protocol!=='https:'||u.username||u.password||v.username||v.password||u.hostname===v.hostname)return fail('DISTINCT_HTTPS_WITNESSES_REQUIRED');
 if(await a.getChainId()!==5042||await b.getChainId()!==5042)return fail('WRONG_CHAIN');
 const [t1,t2,r1,r2,h1,h2]=await Promise.all([a.getTransaction(input.hash),b.getTransaction(input.hash),a.getReceipt(input.hash),b.getReceipt(input.hash),a.getHead(),b.getHead()]);
 if(!t1||!t2||!r1||!r2)return fail('RECEIPT_PENDING');
 if(t1.hash.toLowerCase()!==input.hash.toLowerCase()||t2.hash.toLowerCase()!==input.hash.toLowerCase()||t1.chainId!==5042||t2.chainId!==5042||t1.from.toLowerCase()!==input.sender.toLowerCase()||t2.from.toLowerCase()!==t1.from.toLowerCase()||t2.to.toLowerCase()!==t1.to.toLowerCase()||t2.value!==t1.value||r1.status!==1||r2.status!==1||r1.blockHash!==r2.blockHash||r1.blockNumber!==r2.blockNumber||r1.from.toLowerCase()!==t1.from.toLowerCase()||r2.from.toLowerCase()!==t2.from.toLowerCase()||r1.to.toLowerCase()!==t1.to.toLowerCase()||r2.to.toLowerCase()!==t2.to.toLowerCase())return fail('CANONICAL_TRANSFER_MISMATCH');
 if(h1-r1.blockNumber+1n<3n||h2-r2.blockNumber+1n<3n)return fail('INSUFFICIENT_MAINNET_CONFIRMATIONS');
 const [c1,c2]=await Promise.all([a.getBlock(r1.blockNumber),b.getBlock(r2.blockNumber)]);if(!c1||!c2||c1.hash!==r1.blockHash||c2.hash!==r2.blockHash)return fail('NONCANONICAL_BLOCK');
 if(input.assetKind==='native'){if(t1.to.toLowerCase()!==input.recipient.toLowerCase()||t1.value!==input.amountMicro*1000000000000n)return fail('EXACT_NATIVE_USDC_REQUIRED');}
 else{
 if(t1.to.toLowerCase()!==ARC_PRODUCTION.usdc||t1.value!==0n)return fail('EXACT_USDC_TOKEN_CALL_REQUIRED');
 const topic=(s:string)=>'0x'+s.slice(2).toLowerCase().padStart(64,'0');
 for(const r of [r1,r2]){if(!Array.isArray(r.logs))return fail('USDC_LOGS_REQUIRED');const logs=r.logs.filter(l=>l.address.toLowerCase()===ARC_PRODUCTION.usdc&&l.topics[0]?.toLowerCase()===transfer&&l.topics[1]?.toLowerCase()===topic(input.sender)&&l.topics[2]?.toLowerCase()===topic(input.recipient));if(logs.length!==1||!hash.test(logs[0]!.data)||BigInt(logs[0]!.data)!==input.amountMicro)return fail('EXACT_ERC20_USDC_REQUIRED');}
 }
 const binding={chainId:5042,hash:input.hash.toLowerCase(),sender:input.sender.toLowerCase(),recipient:input.recipient.toLowerCase(),amountMicro:input.amountMicro.toString(),assetKind:input.assetKind,blockHash:r1.blockHash};
 return {status:'VERIFIED' as const,...binding,confirmations:Number((h1<h2?h1:h2)-r1.blockNumber+1n),evidenceDigest:createHash('sha256').update(JSON.stringify(binding)).digest('hex'),moneyMoved:false,explorerUrl:ARC_PRODUCTION.explorer+'/tx/'+input.hash};
 }catch{return fail('RPC_UNAVAILABLE_OR_MALFORMED_EVIDENCE');}
}
