import {createPublicClient,http,keccak256,parseAbi,type Address} from 'viem';
import {MORPHO_ARC,MORPHO_VAULTS,assessMorpho,unavailableMorpho,type MorphoSnapshot,type MorphoWitness} from './morpho-market';
const RPC=['https://rpc.mainnet.arc.io','https://rpc.quicknode.mainnet.arc.io'];
const ABI=parseAbi(['function asset() view returns(address)','function totalAssets() view returns(uint256)','function performanceFee() view returns(uint96)','function managementFee() view returns(uint96)','function receiveSharesGate() view returns(address)','function sendSharesGate() view returns(address)','function receiveAssetsGate() view returns(address)','function sendAssetsGate() view returns(address)']);
const query='{vaultV2s(first:10,where:{chainId_in:[5042],address_in:['+MORPHO_VAULTS.map(v=>'"'+v.address+'"').join(',')+']}){items{address asset{address decimals} chain{id} listed netApy performanceFee managementFee liquidity warnings{type level}} pageInfo{countTotal count}}}';
let cached:MorphoSnapshot|null=null,inflight:Promise<MorphoSnapshot>|null=null;
export function readMorphoMarket():Promise<MorphoSnapshot>{
 if(cached&&Date.now()-cached.observedAt<15000&&(cached.expiresAt>Date.now()||cached.vaults.every(v=>v.status==='unavailable')))return Promise.resolve(cached);
 if(inflight)return inflight;
 inflight=fetchMarket().then(s=>{cached=s;return s}).finally(()=>{inflight=null});return inflight;
}
async function readApi(){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);
 try{
  const res=await fetch(MORPHO_ARC.apiUrl,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({query}),cache:'no-store',signal:ctl.signal});
  if(!res.ok||!res.body)throw Error('API_UNAVAILABLE');
  const reader=res.body.getReader();let text='',size=0;const decoder=new TextDecoder();
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>24000)throw Error('API_RESPONSE_TOO_LARGE');text+=decoder.decode(value,{stream:true});}}finally{await reader.cancel();}
  const data=JSON.parse(text+decoder.decode());if(data.errors||data.data?.vaultV2s?.pageInfo?.countTotal!==3||data.data?.vaultV2s?.pageInfo?.count!==3)throw Error('INCOMPLETE_VAULT_SET');return data.data.vaultV2s;
 }finally{clearTimeout(timer);}
}
async function fetchMarket():Promise<MorphoSnapshot>{
 try{
  const readRows=async()=>{
  const clients=RPC.map(url=>createPublicClient({transport:http(url,{timeout:6000,retryCount:0})}));
  const heads=await Promise.all(clients.map(async c=>{const [chain,head]=await Promise.all([c.getChainId(),c.getBlockNumber()]);if(chain!==5042)throw Error('WRONG_CHAIN');return head}));const blockNumber=(heads[0]<heads[1]?heads[0]:heads[1])-3n;
  const rows=await Promise.all(clients.map(async(c):Promise<MorphoWitness>=>{
   const block=await c.getBlock({blockNumber});if(!block.hash)throw Error('NO_BLOCK');
   const vaults:MorphoWitness['vaults']=[];
   // Arc public RPCs limit batching/bursts. Bounded, paced reads per witness.
   for(const v of MORPHO_VAULTS){
    const address=v.address as Address,functions=['asset','totalAssets','performanceFee','managementFee','receiveSharesGate','sendSharesGate','receiveAssetsGate','sendAssetsGate'] as const;
    await new Promise(resolve=>setTimeout(resolve,80));const code=await c.getCode({address,blockNumber});
    if(!code||code==='0x')throw Error('MISSING_CODE');
    const values:(string|bigint)[]=[];
    for(const functionName of functions){await new Promise(resolve=>setTimeout(resolve,80));values.push(await c.readContract({address,abi:ABI,functionName,blockNumber}));}
    vaults.push({address:v.address,codeHash:keccak256(code),asset:String(values[0]).toLowerCase(),totalAssets:String(values[1]),performanceFee:String(values[2]),managementFee:String(values[3]),gates:values.slice(4).map(x=>String(x).toLowerCase())});
   }
   return {chainId:5042,blockNumber:String(blockNumber),blockHash:block.hash,timestamp:Number(block.timestamp),vaults};
  }));return rows;};
 const [api,rows]=await Promise.all([readApi(),readRows()]);return assessMorpho(api,rows);
 }catch{return unavailableMorpho();} // No response bodies, credentials, invented rates or stale fallbacks.
}
