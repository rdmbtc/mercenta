/** Canonical production RPC ports. No caller-controlled URL, wallet client or signing capability. */
import {createPublicClient,http} from 'viem';
import type {WitnessPorts} from './receipt-proof-generator.js';
import {ARC_PRODUCTION} from './production-mainnet.js';
export function mainnetWitnesses(){
 const port=(endpoint:string,name:string):WitnessPorts=>{
  const client=createPublicClient({transport:http(endpoint,{retryCount:0,timeout:8000})});
  return {name,endpoint,getChainId:()=>client.getChainId(),getHead:()=>client.getBlockNumber(),
   getTransaction:async hash=>{try{const t=await client.getTransaction({hash:hash as `0x${string}`});if(!t.to||t.chainId!==5042)return null;return {hash:t.hash,from:t.from,to:t.to,value:t.value,chainId:t.chainId};}catch{return null;}},
   getReceipt:async hash=>{try{const r=await client.getTransactionReceipt({hash:hash as `0x${string}`});if(!r.to)return null;return {status:r.status==='success'?1:0,blockHash:r.blockHash,blockNumber:r.blockNumber,from:r.from,to:r.to,gasUsed:r.gasUsed,effectiveGasPrice:r.effectiveGasPrice,logs:r.logs.map(l=>({address:l.address,topics:l.topics.filter((s):s is `0x${string}`=>!!s),data:l.data}))};}catch{return null;}},
   getBlock:async number=>{try{const b=await client.getBlock({blockNumber:BigInt(number)});if(!b.hash||b.number===null)return null;return {hash:b.hash,number:b.number,timestamp:b.timestamp};}catch{return null;}}
  };
 };
 return {primaryWitness:port(ARC_PRODUCTION.primaryRpc,'arc-mainnet-primary'),secondaryWitness:port(ARC_PRODUCTION.secondaryRpc,'arc-mainnet-secondary')};
}
