import {createPublicClient,http,keccak256} from 'viem';
import {EARN_MARKET,EARN_RESERVE_ABI,EARN_TOKEN_ABI,assessEarnObservations,unavailableEarn,type EarnSnapshot,type EarnObservation} from './earn-market';
const RPC=['https://ethereum-rpc.publicnode.com','https://eth.drpc.org'];
let cached:EarnSnapshot|null=null,inflight:Promise<EarnSnapshot>|null=null;
export async function readEarnMarket():Promise<EarnSnapshot>{
 if(cached&&Date.now()-cached.observedAt<15000)return cached;
 if(inflight)return inflight;
 inflight=fetchMarket().then(x=>{cached=x;return x}).finally(()=>{inflight=null});return inflight;
}
async function fetchMarket():Promise<EarnSnapshot>{
 try{
 const clients=RPC.map(url=>createPublicClient({transport:http(url,{timeout:7000,retryCount:0})}));
 const heads=await Promise.all(clients.map(async c=>{if(await c.getChainId()!==1)throw Error('WRONG_CHAIN');return c.getBlockNumber()}));const blockNumber=(heads[0]<heads[1]?heads[0]:heads[1])-3n;
 const rows=await Promise.all(clients.map(async(c):Promise<EarnObservation>=>{
 const [block,reserve,decimals,cash,totalSupply,boundPool,boundAsset,...codes]=await Promise.all([
  c.getBlock({blockNumber}),c.readContract({address:EARN_MARKET.pool,abi:EARN_RESERVE_ABI,functionName:'getReserveData',args:[EARN_MARKET.usdc],blockNumber}),
  c.readContract({address:EARN_MARKET.usdc,abi:EARN_TOKEN_ABI,functionName:'decimals',blockNumber}),c.readContract({address:EARN_MARKET.usdc,abi:EARN_TOKEN_ABI,functionName:'balanceOf',args:[EARN_MARKET.aToken],blockNumber}),
  c.readContract({address:EARN_MARKET.aToken,abi:EARN_TOKEN_ABI,functionName:'totalSupply',blockNumber}),c.readContract({address:EARN_MARKET.aToken,abi:EARN_TOKEN_ABI,functionName:'POOL',blockNumber}),c.readContract({address:EARN_MARKET.aToken,abi:EARN_TOKEN_ABI,functionName:'UNDERLYING_ASSET_ADDRESS',blockNumber}),
  ...[EARN_MARKET.pool,EARN_MARKET.usdc,EARN_MARKET.aToken].map(address=>c.getCode({address,blockNumber}))]);
 if(!block.hash||codes.some(code=>!code||code==='0x'))throw Error('MISSING_CODE_OR_BLOCK');
 return {chainId:1,blockNumber:blockNumber.toString(),blockHash:block.hash,blockTimestamp:Number(block.timestamp),rateRay:reserve.currentLiquidityRate.toString(),configuration:reserve.configuration.data.toString(),availableMicro:cash.toString(),totalSupplyMicro:totalSupply.toString(),decimals,aToken:reserve.aTokenAddress.toLowerCase(),boundPool:boundPool.toLowerCase(),boundAsset:boundAsset.toLowerCase(),codeHashes:{pool:keccak256(codes[0]!),usdc:keccak256(codes[1]!),aToken:keccak256(codes[2]!)}};
 }));return assessEarnObservations(rows);
 }catch{return unavailableEarn();} // Never leak RPC bodies, credentials or invented fallback yields.
}
